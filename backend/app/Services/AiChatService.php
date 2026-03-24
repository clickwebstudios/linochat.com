<?php

namespace App\Services;

use App\Events\AiTyping;
use App\Events\HumanRequested;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\KbArticle;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\TicketCreatedMail;
use App\Mail\NewTicketMail;
use App\Models\ActivityLog;
use App\Models\NotificationLog;
use OpenAI;
use OpenAI\Exceptions\ErrorException;
use OpenAI\Exceptions\TimeoutException;

class AiChatService
{
    /**
     * Default AI model
     */
    protected string $model = 'gpt-4o-mini';

    /**
     * Maximum retries for API calls
     */
    protected int $maxRetries = 3;

    /**
     * Timeout in seconds for API calls
     */
    protected int $timeout = 30;

    /**
     * Delay between retries in milliseconds
     */
    protected int $retryDelay = 1000;

    /**
     * Generate AI response for customer message
     */
    public function generateResponse(Chat $chat, string $customerMessage, Project $project): ?array
    {
        // Broadcast typing indicator before starting
        broadcast(new AiTyping($chat->id, true, $this->model));

        try {
            $apiKey = config('openai.api_key');
            
            Log::info('AI generateResponse started', [
                'chat_id' => $chat->id,
                'ai_enabled' => $chat->ai_enabled,
                'api_key_config' => config('openai.api_key') ? 'SET' : 'NOT_SET',
                'api_key_config_value' => substr(config('openai.api_key') ?? '', 0, 15),
                'env_key' => env('OPENAI_API_KEY') ? 'SET' : 'NOT_SET',
                'env_key_raw' => substr(env('OPENAI_API_KEY') ?? '', 0, 15),
                'config_cached' => app()->configurationIsCached(),
            ]);
            
            // Check if AI is enabled for this chat
            if ($chat->ai_enabled === false) {
                Log::info('AI is disabled for chat', ['chat_id' => $chat->id]);
                broadcast(new AiTyping($chat->id, false, $this->model));
                return null;
            }

            // Agent has taken over - do not generate AI response
            if ($chat->agent_id) {
                Log::info('Agent has taken over chat, skipping AI', ['chat_id' => $chat->id]);
                broadcast(new AiTyping($chat->id, false, $this->model));
                return null;
            }

            // Check if API key is configured
            Log::info('OpenAI Key check', [
                'key_exists' => !empty($apiKey),
                'key_prefix' => $apiKey ? substr($apiKey, 0, 15) : 'EMPTY',
                'key_length' => strlen($apiKey ?? ''),
                'is_placeholder' => $apiKey === 'sk-test-key-placeholder',
            ]);

            if (empty($apiKey) || $apiKey === 'sk-test-key-placeholder') {
                Log::warning('OpenAI API key not configured, using fallback response');
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->getFallbackResponse($chat);
            }

            // Set model from AI settings (default: gpt-4o-mini for cost efficiency)
            $aiSettings = $project->ai_settings ?? [];
            $this->model = $aiSettings['model'] ?? 'gpt-4o-mini';

            // Get relevant KB articles as context
            $kbContext = $this->getKbContext($project, $customerMessage);
            
            // Get recent conversation history
            $conversationHistory = $this->getConversationHistory($chat);
            
            // Check for handover triggers
            if ($this->shouldHandoverToHuman($customerMessage)) {
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->createHandoverResponse($chat);
            }

            // Build system prompt
            $systemPrompt = $this->buildSystemPrompt($project, $kbContext);
            
            // Build messages array
            $messages = $this->buildMessages($systemPrompt, $conversationHistory, $customerMessage);
            
            // Map confidence_threshold to temperature: higher confidence = lower temperature
            $confidenceThreshold = $aiSettings['confidence_threshold'] ?? 75;
            $temperatureMap = [95 => 0.3, 85 => 0.5, 75 => 0.7, 60 => 0.9];
            $temperature = $temperatureMap[$confidenceThreshold] ?? 0.7;

            // Call OpenAI API with retry logic
            $response = $this->callOpenAIWithRetry($apiKey, $messages, $temperature);

            // If all retries failed
            if ($response === null) {
                Log::error('All OpenAI API retries failed', ['chat_id' => $chat->id]);
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->getFallbackResponse($chat);
            }

            $aiContent = $response['content'];
            $tokensUsed = $response['tokens_used'] ?? 0;

            // Check if AI wants to look up a Frubix client or schedule
            if ($this->isFrubixLookup($aiContent)) {
                $frubixResult = $this->handleFrubixLookup($aiContent, $project);
                if ($frubixResult) {
                    // Re-call OpenAI with Frubix data injected as context
                    $messages[] = ['role' => 'assistant', 'content' => $aiContent];
                    $messages[] = ['role' => 'system', 'content' => $frubixResult];
                    $followUp = $this->callOpenAIWithRetry($apiKey, $messages);
                    if ($followUp) {
                        $aiContent = $followUp['content'];
                        $tokensUsed += $followUp['tokens_used'] ?? 0;
                    }
                }
            }

            // Check if AI wants to handover
            if ($this->isHandoverRequest($aiContent)) {
                // If Frubix is connected and message is about appointments/schedule,
                // override handover — ask for phone/email to look up instead
                $frubixConfig = $this->getFrubixIntegration($project);
                if ($frubixConfig && $this->isAppointmentRelated($customerMessage)) {
                    $isBookingIntent = (bool) preg_match('/\b(book|schedule|make|set up|need).*(appointment|service|visit|call|time|slot)\b/i', $customerMessage);
                    $overrideContent = $isBookingIntent
                        ? "I'd be happy to help you book an appointment! Could I get your full name to get started?"
                        : "Sure, I can check that for you! Could you please provide your phone number or email address so I can look up your appointment details?";
                    $aiMessage = ChatMessage::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'ai',
                        'content' => $overrideContent,
                        'is_ai' => true,
                        'metadata' => ['model' => $this->model, 'frubix_override' => true],
                    ]);
                    broadcast(new AiTyping($chat->id, false, $this->model));
                    return [
                        'id' => $aiMessage->id,
                        'content' => $overrideContent,
                        'sender_type' => 'ai',
                        'created_at' => $aiMessage->created_at,
                        'model' => $this->model,
                    ];
                }

                // Apply fallback_behavior setting
                $fallbackBehavior = $aiSettings['fallback_behavior'] ?? 'transfer';
                if ($fallbackBehavior === 'none') {
                    // Strip handover tag and return AI response as-is
                    $cleanContent = $this->cleanAiResponse(str_replace('[HANDOVER]', '', $aiContent));
                    $aiMessage = ChatMessage::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'ai',
                        'content' => $cleanContent,
                        'is_ai' => true,
                        'metadata' => ['model' => $this->model, 'tokens_used' => $tokensUsed, 'handover_suppressed' => true],
                    ]);
                    broadcast(new AiTyping($chat->id, false, $this->model));
                    return ['id' => $aiMessage->id, 'content' => $cleanContent, 'sender_type' => 'ai', 'created_at' => $aiMessage->created_at, 'model' => $this->model];
                } elseif ($fallbackBehavior === 'collect') {
                    // Ask for contact info instead of transferring
                    broadcast(new AiTyping($chat->id, false, $this->model));
                    return $this->createContactRequestResponse($chat, $aiContent);
                } elseif ($fallbackBehavior === 'suggest') {
                    // Suggest KB articles before transferring
                    $suggestions = $this->getKbContext($project, $customerMessage);
                    $suggestContent = $this->cleanAiResponse(str_replace('[HANDOVER]', '', $aiContent));
                    if (!empty($suggestions)) {
                        $suggestContent .= "\n\nHere are some articles that might help:\n";
                        foreach (array_slice($suggestions, 0, 3) as $article) {
                            $suggestContent .= "• {$article['title']}\n";
                        }
                        $suggestContent .= "\nWould you still like to speak with a human agent?";
                    }
                    $aiMessage = ChatMessage::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'ai',
                        'content' => $suggestContent,
                        'is_ai' => true,
                        'metadata' => ['model' => $this->model, 'tokens_used' => $tokensUsed, 'fallback' => 'suggest'],
                    ]);
                    broadcast(new AiTyping($chat->id, false, $this->model));
                    return ['id' => $aiMessage->id, 'content' => $suggestContent, 'sender_type' => 'ai', 'created_at' => $aiMessage->created_at, 'model' => $this->model];
                }
                // Default: transfer to human
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->createHandoverResponse($chat, $aiContent);
            }

            // Check if AI is requesting contact info for ticket creation
            if ($this->isContactRequest($aiContent)) {
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->createContactRequestResponse($chat, $aiContent);
            }

            // Check if AI collected all booking details and wants to create a ticket
            if ($this->isBookingRequest($aiContent)) {
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->createBookingTicket($chat, $aiContent, $project);
            }

            // Safety net: AI said "booked/confirmed/scheduled" but forgot [CREATE_BOOKING]
            // Re-prompt to get the proper tags
            if ($this->looksLikeBookingConfirmation($aiContent) && !$this->isBookingRequest($aiContent)) {
                Log::info('AI forgot [CREATE_BOOKING] tag, re-prompting', ['chat_id' => $chat->id]);
                $messages[] = ['role' => 'assistant', 'content' => $aiContent];
                $messages[] = ['role' => 'system', 'content' => 'IMPORTANT: You just confirmed a booking but FORGOT to include the [CREATE_BOOKING] tag. The booking was NOT created. You MUST re-send your response with the [CREATE_BOOKING][BOOKING_NAME: ...][BOOKING_PHONE: ...][BOOKING_EMAIL: ...][BOOKING_ADDRESS: ...][BOOKING_ISSUE: ...] tags appended at the end. Do it now.'];
                $retry = $this->callOpenAIWithRetry($apiKey, $messages);
                if ($retry && $this->isBookingRequest($retry['content'])) {
                    $tokensUsed += $retry['tokens_used'] ?? 0;
                    broadcast(new AiTyping($chat->id, false, $this->model));
                    return $this->createBookingTicket($chat, $retry['content'], $project);
                }
            }

            // Extract and save customer details if AI detected them
            $cleanedContent = $this->cleanAiResponse($aiContent);
            $customerName = $this->extractCustomerName($aiContent, $customerMessage);
            $chatUpdates = [];
            $metaUpdates = $chat->metadata ?? [];
            $notRealName = ['Guest', 'Visitor', 'Hello', 'Hi', 'Hey', 'Test', 'User', 'Customer', 'Anonymous'];
            $currentName = $chat->customer_name ?? '';
            if ($customerName && (empty($currentName) || in_array($currentName, $notRealName, true) || strlen($currentName) <= 2)) {
                $chatUpdates['customer_name'] = $customerName;
            }
            // Extract phone/email from customer's message
            if (preg_match('/\b(\+?\d[\d\s\-().]{7,15}\d)\b/', $customerMessage, $pm) && empty($metaUpdates['customer_phone'])) {
                $metaUpdates['customer_phone'] = preg_replace('/[^\d+]/', '', $pm[1]);
            }
            if (preg_match('/[\w.+-]+@[\w-]+\.[\w.]+/', $customerMessage, $em) && empty($chat->customer_email)) {
                $chatUpdates['customer_email'] = $em[0];
            }
            if (!empty($metaUpdates)) $chatUpdates['metadata'] = $metaUpdates;
            if (!empty($chatUpdates)) $chat->update($chatUpdates);

            // Create and save AI message with KB references
            $metadata = [
                'model' => $this->model,
                'context_used' => !empty($kbContext),
                'kb_articles_count' => count($kbContext),
                'tokens_used' => $tokensUsed,
            ];
            
            // Include KB article references for frontend display
            if (!empty($kbContext)) {
                $metadata['kb_references'] = array_map(fn($article) => [
                    'id' => $article->id,
                    'title' => $article->title,
                    'category' => $article->category->name ?? null,
                ], $kbContext);
            }
            
            $aiMessage = ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_type' => 'ai',
                'content' => $cleanedContent,
                'is_ai' => true,
                'metadata' => $metadata,
            ]);
            
            // Track AI usage and cost
            $this->logAiUsage($chat, $response, $tokensUsed);

            // Increment view count for referenced articles
            foreach ($kbContext as $article) {
                $article->increment('views_count');
            }

            // Stop typing indicator
            broadcast(new AiTyping($chat->id, false, $this->model));

            return [
                'id' => $aiMessage->id,
                'content' => $aiMessage->content,
                'sender_type' => 'ai',
                'created_at' => $aiMessage->created_at,
                'model' => $this->model,
                'tokens_used' => $tokensUsed,
                'kb_references' => $metadata['kb_references'] ?? [],
            ];

        } catch (\Exception $e) {
            Log::error('AI response generation failed', [
                'chat_id' => $chat->id,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Ensure typing indicator is stopped even on error
            broadcast(new AiTyping($chat->id, false, $this->model));
            
            return $this->getFallbackResponse($chat);
        }
    }

    /**
     * Call OpenAI API with retry logic
     */
    protected function callOpenAIWithRetry(string $apiKey, array $messages, float $temperature = 0.7): ?array
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                Log::debug("OpenAI API call attempt {$attempt}/{$this->maxRetries}");

                $client = OpenAI::client($apiKey);
                
                $response = $client->chat()->create([
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => $temperature,
                    'max_tokens' => 300,
                ]);

                return [
                    'content' => $response->choices[0]->message->content,
                    'tokens_used' => $response->usage->totalTokens ?? 0,
                    'input_tokens' => $response->usage->promptTokens ?? 0,
                    'output_tokens' => $response->usage->completionTokens ?? 0,
                    'model' => $this->model,
                ];

            } catch (TimeoutException $e) {
                $lastException = $e;
                Log::warning("OpenAI API timeout on attempt {$attempt}/{$this->maxRetries}", [
                    'error' => $e->getMessage(),
                ]);
                
                if ($attempt < $this->maxRetries) {
                    usleep($this->retryDelay * 1000); // Convert to microseconds
                }
            } catch (ErrorException $e) {
                $lastException = $e;
                Log::error("OpenAI API error on attempt {$attempt}/{$this->maxRetries}", [
                    'error' => $e->getMessage(),
                    'error_type' => $e->getErrorType(),
                    'error_code' => $e->getErrorCode(),
                ]);
                
                // Don't retry on certain errors
                if (in_array($e->getErrorType(), ['invalid_request_error', 'authentication_error'])) {
                    Log::error('OpenAI non-retryable error, breaking retry loop', [
                        'error_type' => $e->getErrorType(),
                    ]);
                    break;
                }
                
                if ($attempt < $this->maxRetries) {
                    usleep($this->retryDelay * 1000);
                }
            } catch (\Exception $e) {
                $lastException = $e;
                Log::error("Unexpected error on attempt {$attempt}/{$this->maxRetries}", [
                    'error' => $e->getMessage(),
                    'error_class' => get_class($e),
                ]);
                
                if ($attempt < $this->maxRetries) {
                    usleep($this->retryDelay * 1000);
                }
            }
        }

        Log::error('All OpenAI API retry attempts exhausted', [
            'last_error' => $lastException ? $lastException->getMessage() : 'Unknown',
        ]);

        return null;
    }

    /**
     * Get relevant KB articles for context
     * Uses enhanced keyword matching with TF-IDF-like scoring
     */
    protected function getKbContext(Project $project, string $message): array
    {
        // Get all published articles for this project
        $articles = KbArticle::whereHas('category', function ($q) use ($project) {
                $q->where('project_id', $project->id);
            })
            ->where('is_published', true)
            ->with('category')
            ->get();

        // Try RAG (embedding-based search) first
        $articlesWithEmbeddings = $articles->filter(fn($a) => !empty($a->embedding));
        if ($articlesWithEmbeddings->count() >= 2) {
            $ragResult = $this->searchByEmbedding($message, $articlesWithEmbeddings);
            if (!empty($ragResult)) {
                Log::info('KB RAG search', ['project_id' => $project->id, 'results' => count($ragResult)]);
                return $ragResult;
            }
        }
        // Fall back to keyword search

        if ($articles->isEmpty()) {
            return [];
        }

        // Enhanced keyword matching with weighted scoring
        $messageLower = strtolower($message);
        $messageWords = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $messageLower)));
        
        // Remove common stop words
        $stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ask', 'own', 'say', 'too', 'any', 'try', 'let', 'put', 'end', 'why', 'turn', 'here', 'show', 'every', 'good', 'me', 'too', 'very', 'when', 'much', 'would', 'there', 'their', 'what', 'said', 'each', 'which', 'will', 'about', 'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'under', 'while', 'this', 'that', 'have', 'from', 'they', 'know', 'want', 'been', 'were', 'said', 'time', 'than', 'them', 'into', 'just', 'like', 'over', 'also', 'back', 'only', 'then', 'come', 'make', 'well', 'even', 'more', 'some', 'what', 'with', 'your', 'work', 'part', 'such', 'take', 'most'];
        
        $messageWords = array_filter($messageWords, fn($w) => strlen($w) > 2 && !in_array($w, $stopWords));
        
        // Add phrase matching for better context
        $messagePhrases = $this->extractPhrases($messageLower);
        
        $relevant = [];
        $totalArticles = $articles->count();

        foreach ($articles as $article) {
            $score = 0;
            $articleTitle = strtolower($article->title);
            $articleContent = strtolower(strip_tags($article->content));
            $articleCategory = strtolower($article->category->name ?? '');
            
            // Title matching (higher weight)
            foreach ($messageWords as $word) {
                if (strpos($articleTitle, $word) !== false) {
                    $score += 3; // Title words are more important
                }
            }
            
            // Category matching (medium weight)
            foreach ($messageWords as $word) {
                if (strpos($articleCategory, $word) !== false) {
                    $score += 2;
                }
            }
            
            // Content matching with TF-IDF-like scoring
            $wordFreq = [];
            foreach ($messageWords as $word) {
                $count = substr_count($articleContent, $word);
                if ($count > 0) {
                    // TF (term frequency) component
                    $tf = $count / (strlen($articleContent) / 100); // Normalize by article length
                    // IDF (inverse document frequency) component - how many articles contain this word
                    $docCount = $articles->filter(fn($a) => strpos(strtolower($a->content), $word) !== false)->count();
                    $idf = log($totalArticles / max(1, $docCount));
                    $score += $tf * $idf * 1.5;
                }
            }
            
            // Phrase matching (bonus points for phrase matches)
            foreach ($messagePhrases as $phrase) {
                if (strpos($articleTitle, $phrase) !== false) {
                    $score += 5; // Exact phrase in title is very relevant
                }
                if (strpos($articleContent, $phrase) !== false) {
                    $score += 2;
                }
            }
            
            // Boost recent articles slightly
            if ($article->updated_at && $article->updated_at->diffInDays(now()) < 30) {
                $score *= 1.1;
            }
            
            // Boost popular articles
            if ($article->views_count > 100) {
                $score *= 1.05;
            }
            
            if ($score > 0.5) {
                $relevant[] = [
                    'article' => $article,
                    'score' => $score,
                ];
            }
        }

        // Sort by relevance and take top 3
        usort($relevant, fn($a, $b) => $b['score'] <=> $a['score']);
        
        $topArticles = array_slice(array_column($relevant, 'article'), 0, 3);
        
        Log::info('KB context search', [
            'project_id' => $project->id,
            'message' => substr($message, 0, 100),
            'articles_found' => count($relevant),
            'top_scores' => array_slice(array_column($relevant, 'score'), 0, 3),
            'top_article_ids' => array_map(fn($a) => $a->id, $topArticles),
        ]);
        
        return $topArticles;
    }
    
    /**
     * Search KB articles using OpenAI embeddings (RAG).
     */
    protected function searchByEmbedding(string $query, $articles): array
    {
        $apiKey = config('openai.api_key');
        if (!$apiKey) return [];

        try {
            $client = \OpenAI::client($apiKey);

            // Embed the customer's query
            $response = $client->embeddings()->create([
                'model' => 'text-embedding-3-small',
                'input' => substr($query, 0, 2000),
            ]);

            $queryEmbedding = $response->embeddings[0]->embedding;

            // Compute cosine similarity against each article
            $scored = [];
            foreach ($articles as $article) {
                $similarity = $this->cosineSimilarity($queryEmbedding, $article->embedding);
                if ($similarity > 0.3) {
                    $scored[] = ['article' => $article, 'score' => $similarity];
                }
            }

            // Sort by score descending, take top 3
            usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
            return array_slice(array_column($scored, 'article'), 0, 3);

        } catch (\Exception $e) {
            Log::warning('RAG embedding search failed, falling back to keyword', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Cosine similarity between two vectors.
     */
    protected function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        $len = min(count($a), count($b));

        for ($i = 0; $i < $len; $i++) {
            $dotProduct += $a[$i] * $b[$i];
            $normA += $a[$i] * $a[$i];
            $normB += $b[$i] * $b[$i];
        }

        $denominator = sqrt($normA) * sqrt($normB);
        return $denominator > 0 ? $dotProduct / $denominator : 0.0;
    }

    /**
     * Extract meaningful phrases from message for better matching
     */
    protected function extractPhrases(string $message): array
    {
        $phrases = [];
        
        // Extract 2-3 word phrases
        $words = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $message)));
        $words = array_values($words);
        
        for ($i = 0; $i < count($words) - 1; $i++) {
            // 2-word phrases
            if (strlen($words[$i]) > 3 && strlen($words[$i + 1]) > 3) {
                $phrases[] = $words[$i] . ' ' . $words[$i + 1];
            }
            // 3-word phrases
            if ($i < count($words) - 2 && strlen($words[$i + 2]) > 3) {
                $phrases[] = $words[$i] . ' ' . $words[$i + 1] . ' ' . $words[$i + 2];
            }
        }
        
        return array_unique($phrases);
    }

    /**
     * Get recent conversation history
     */
    protected function getConversationHistory(Chat $chat): array
    {
        return $chat->messages()
            ->whereIn('sender_type', ['customer', 'ai', 'agent'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->sortBy('created_at')
            ->map(function ($msg) {
                return [
                    'role' => $msg->sender_type === 'customer' ? 'user' : 'assistant',
                    'content' => $msg->content,
                ];
            })
            ->toArray();
    }

    /**
     * Generate suggested replies for an agent to use (does NOT save messages).
     */
    public function suggestReplies(Chat $chat, Project $project, int $count = 3): array
    {
        $apiKey = config('openai.api_key');
        if (empty($apiKey) || $apiKey === 'sk-test-key-placeholder') {
            return [];
        }

        $aiSettings = $project->ai_settings ?? [];
        $this->model = $aiSettings['model'] ?? 'gpt-4o-mini';

        $lastCustomerMsg = $chat->messages()
            ->where('sender_type', 'customer')
            ->orderByDesc('created_at')
            ->value('content') ?? '';

        $kbContext = $this->getKbContext($project, $lastCustomerMsg);
        $conversationHistory = $this->getConversationHistory($chat);
        $systemPrompt = $this->buildSystemPrompt($project, $kbContext);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt . "\n\nYou are now generating suggested replies for a human agent. Generate exactly {$count} short, contextual reply options the agent can send to the customer. Return ONLY a JSON array of strings, no other text."],
            ...array_map(fn ($h) => $h, $conversationHistory),
        ];

        if ($lastCustomerMsg) {
            $messages[] = ['role' => 'user', 'content' => $lastCustomerMsg];
        }

        $messages[] = ['role' => 'user', 'content' => "Generate {$count} suggested agent replies as a JSON array of strings."];

        try {
            $client = OpenAI::client($apiKey);
            $response = $client->chat()->create([
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => 0.8,
                'max_tokens' => 500,
            ]);

            $content = trim($response->choices[0]->message->content ?? '');
            // Strip markdown code fences if present
            $content = preg_replace('/^```(?:json)?\s*|\s*```$/s', '', $content);
            $suggestions = json_decode($content, true);

            return is_array($suggestions) ? array_slice($suggestions, 0, $count) : [];
        } catch (\Throwable $e) {
            Log::warning('AI suggest replies failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Build system prompt
     */
    protected function buildSystemPrompt(Project $project, array $kbContext): string
    {
        $companyName = $project->name;
        $website = $project->website ?? '';
        $description = $project->description ?? '';
        $aiSettings = $project->ai_settings ?? [];
        $customPrompt = $aiSettings['system_prompt'] ?? '';
        $aiName = ($aiSettings['ai_name'] ?? null) ?: 'Lino';

        // If admin provided a custom system prompt, use it as the base
        if (!empty(trim($customPrompt))) {
            $prompt = $customPrompt . "\n\n";
        } else {
            $prompt = "Your name is {$aiName}. You are a support agent at {$companyName}. ";
            $prompt .= "You speak as the company — use 'we', 'our', 'us' at all times. Never say 'the company' or refer to {$companyName} in the third person. ";
            $prompt .= "Never mention 'knowledge base', 'articles', or 'AI' — the customer must feel they are talking to a real support representative.\n\n";
        }

        // Response tone from settings
        $tone = $aiSettings['response_tone'] ?? 'professional';

        $language = $aiSettings['response_language'] ?? 'auto';
        $languageMap = [
            'en' => 'Always respond in English.',
            'es' => 'Always respond in Spanish (Español).',
            'fr' => 'Always respond in French (Français).',
            'de' => 'Always respond in German (Deutsch).',
            'auto' => 'Respond in the same language the customer uses. If unsure, default to English.',
        ];
        $prompt .= "LANGUAGE: " . ($languageMap[$language] ?? $languageMap['auto']) . "\n\n";
        $prompt .= "RULES:\n";
        $prompt .= "1. Greet the customer warmly at the start of a new conversation and ask for their name. Example: 'Hi! Welcome to {$companyName}. How can I help you today? Could I get your name please?'\n";
        $prompt .= "2. Answer questions confidently and directly as a company representative. Use 'we offer', 'we don't offer', 'our services include', etc.\n";
        $prompt .= "3. For YES/NO questions about services ('do you offer X?'): give a clear answer. If we don't offer it, say so and suggest what we do offer instead.\n";
        $prompt .= "4. Keep responses SHORT: 1-3 sentences. Be direct, friendly, and {$tone}. No filler words.\n";
        $prompt .= "5. Never invent specific prices or dates not provided below. For specifics, say we'd be happy to discuss details and offer to connect them with the team.\n";
        $prompt .= "6. Use [HANDOVER] ONLY when: (a) the customer explicitly asks for a human, OR (b) the request needs account-specific info or a custom quote that requires a real team member. Do NOT hand over for general service or pricing questions." . ($this->getFrubixIntegration($project) ? " Do NOT hand over for appointment/schedule/booking inquiries — you can look those up yourself (see rules 12-13)." : "") . "\n";
        $prompt .= "7. If you cannot help and no agent is available, use [REQUEST_CONTACT] to collect their name and email.\n";
        $prompt .= "8. When the customer gives their name, append [CUSTOMER_NAME: Name] at the end of your reply (properly capitalized, e.g. John, Jane Doe).\n";
        $prompt .= "9. No Markdown. No [text](url) links. Plain text only (e.g. info@example.com, https://example.com).\n";
        $prompt .= "10. BOOKING FLOW — CRITICAL: When a customer wants to book, schedule, or make an appointment, you MUST collect ALL of the following details one at a time:\n";
        $prompt .= "    - Full name\n";
        $prompt .= "    - Phone number\n";
        $prompt .= "    - Email address\n";
        $prompt .= "    - Service address (where the service will be performed)\n";
        $prompt .= "    Once you have ALL details confirmed, you MUST append the [CREATE_BOOKING] tag and ALL booking tags at the END of your reply. This is NOT optional — without these tags, the booking will NOT be created in our system. Example:\n";
        $prompt .= "    'Great, your booking is confirmed! [CREATE_BOOKING][BOOKING_NAME: John Doe][BOOKING_PHONE: 555-1234][BOOKING_EMAIL: john@example.com][BOOKING_ADDRESS: 123 Main St][BOOKING_ISSUE: Fix dishwasher — leaking water from bottom]'\n";
        $prompt .= "    NEVER say 'booked', 'scheduled', or 'confirmed' without including [CREATE_BOOKING] and all the booking tags. If you say it's booked without the tags, the booking will be LOST.\n";
        $prompt .= "    The BOOKING_ISSUE must summarize EVERYTHING the customer told you about their problem — appliance type, brand, model, symptoms, urgency, etc.\n";

        // Add Frubix integration rules if connected
        $frubixConfig = $this->getFrubixIntegration($project);
        if ($frubixConfig) {
            $prompt .= "11. IMPORTANT — CUSTOMER ACCOUNT ACCESS: You have access to our scheduling and client system. Do NOT hand over to a human agent for appointment lookups, schedule checks, or client information. You can handle these yourself using the tools below.\n";
            $prompt .= "12. CLIENT LOOKUP: When a customer provides their phone number or email (or you already have it from earlier in the conversation), look up their account by appending [LOOKUP_CLIENT: phone_or_email] at the end of your reply. The system will return their client details. Use this proactively whenever a customer shares contact info.\n";
            $prompt .= "13. SCHEDULE / APPOINTMENT CHECK: When a customer asks about their appointments, schedule, or booking status, ask for their phone number or email if you don't have it yet, then append [CHECK_SCHEDULE: phone_or_email] at the end of your reply. The system will return their upcoming appointments. Do NOT use [HANDOVER] for appointment questions — use [CHECK_SCHEDULE] instead.\n";
            $prompt .= "14. APPOINTMENT BOOKING WITH AVAILABILITY CHECK: During the booking flow, also collect the customer's preferred date and time. BEFORE confirming the booking, you MUST check availability by appending [CHECK_SCHEDULE: ALL] with the date. The system will return existing appointments for that period. If the requested time slot overlaps with an existing appointment, tell the customer that slot is taken and suggest nearby available times. Only proceed with [CREATE_BOOKING] once a free slot is confirmed. Add [BOOKING_DATE: YYYY-MM-DD] and [BOOKING_TIME: HH:MM] (24h format) alongside the other booking tags.\n";
            $prompt .= "15. RESCHEDULE / REBOOK: When a customer wants to reschedule, rebook, or change an existing appointment:\n";
            $prompt .= "    a) First look up their appointments using [CHECK_SCHEDULE: phone_or_email] if you haven't already.\n";
            $prompt .= "    b) Once you can see their appointments (from system data), ask which appointment they want to change and what new date/time they prefer.\n";
            $prompt .= "    c) Once confirmed, append [RESCHEDULE_APPOINTMENT: appointment_id][NEW_DATE: YYYY-MM-DD][NEW_TIME: HH:MM] at the end of your reply. Use the appointment ID number from the schedule data.\n";
            $prompt .= "    d) The system will update the appointment and you'll get a confirmation.\n";
            $prompt .= "    Do NOT hand over for rescheduling — you can do it yourself.\n";
        }

        $prompt .= "\n";

        if ($website || $description) {
            $prompt .= "ABOUT US:\n";
            if ($website) {
                $prompt .= "Website: {$website}\n";
            }
            if ($description) {
                $prompt .= "Description: {$description}\n";
            }
            $prompt .= "\n";
        }

        if (!empty($kbContext)) {
            $prompt .= "INTERNAL REFERENCE (use to answer questions — never quote or mention these documents to the customer):\n";
            $prompt .= "===\n";
            foreach ($kbContext as $index => $article) {
                $prompt .= ($index + 1) . ". {$article->title}\n";
                $content = strip_tags($article->content);
                if (strlen($content) > 2000) {
                    $content = substr($content, 0, 2000) . '...';
                }
                $prompt .= "{$content}\n---\n";
            }
            $prompt .= "===\n\n";
        }

        $prompt .= "Tone: warm, confident, human. You ARE {$companyName} support — answer as if you know the company inside out.";

        return $prompt;
    }

    /**
     * Build messages array for OpenAI
     */
    protected function buildMessages(string $systemPrompt, array $history, string $currentMessage): array
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($history as $msg) {
            $messages[] = $msg;
        }

        $messages[] = ['role' => 'user', 'content' => $currentMessage];

        return $messages;
    }

    /**
     * Check if customer is requesting human handover
     */
    protected function shouldHandoverToHuman(string $message): bool
    {
        $handoverKeywords = [
            'talk to human', 'speak to human', 'human agent', 'real person',
            'talk to someone', 'live agent', 'customer service', 'representative',
            'supervisor', 'manager', 'complaint', 'refund', 'cancel',
        ];

        $lowerMessage = strtolower($message);
        
        foreach ($handoverKeywords as $keyword) {
            if (strpos($lowerMessage, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if AI response contains handover request
     */
    protected function isHandoverRequest(string $response): bool
    {
        return strpos($response, '[HANDOVER]') !== false;
    }

    /**
     * Create handover response
     */
    protected function createHandoverResponse(Chat $chat, ?string $aiContent = null): array
    {
        // Update chat status
        $chat->update(['status' => 'waiting']);

        $content = $aiContent
            ? $this->cleanAiResponse(str_replace('[HANDOVER]', '', $aiContent)) . " I'm transferring you to a human agent now."
            : "I'll connect you with a human agent who can help you further. Please wait a moment.";

        // Extract and save customer name if AI detected it before handover
        if ($aiContent) {
            $customerName = $this->extractCustomerName($aiContent, $customerMessage);
            $notRealName2 = ['Guest', 'Visitor', 'Hello', 'Hi', 'Hey', 'Test', 'User', 'Customer', 'Anonymous'];
            $curName = $chat->customer_name ?? '';
            if ($customerName && (empty($curName) || in_array($curName, $notRealName2, true) || strlen($curName) <= 2)) {
                $chat->update(['customer_name' => $customerName]);
            }
        }

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'ai',
            'content' => $content,
            'is_ai' => true,
            'metadata' => [
                'model' => $this->model,
                'handover_triggered' => true,
            ],
        ]);

        // Add system message
        ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'system',
            'content' => 'Transferring to human agent...',
        ]);

        // Notify all project agents so transfer modal opens automatically
        broadcast(new HumanRequested($chat->load(['project', 'project.agents'])));

        return [
            'id' => $message->id,
            'content' => $message->content,
            'sender_type' => 'ai',
            'created_at' => $message->created_at,
            'handover' => true,
            'model' => $this->model,
        ];
    }

    /**
     * Check if AI response contains contact request
     */
    protected function isContactRequest(string $response): bool
    {
        return strpos($response, '[REQUEST_CONTACT]') !== false;
    }

    /**
     * Create contact request response (asks for name/email to create ticket)
     */
    protected function createContactRequestResponse(Chat $chat, ?string $aiContent = null): array
    {
        $content = $aiContent
            ? str_replace('[REQUEST_CONTACT]', '', $aiContent)
            : "I don't have an answer for that right now. To ensure you get help, please provide your name and email, and I'll create a support ticket for you.";

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'ai',
            'content' => $this->cleanAiResponse($content),
            'is_ai' => true,
            'metadata' => [
                'model' => $this->model,
                'request_contact' => true,
                'actions' => ['create_ticket'],
            ],
        ]);

        return [
            'id' => $message->id,
            'content' => $message->content,
            'sender_type' => 'ai',
            'created_at' => $message->created_at,
            'metadata' => [
                'request_contact' => true,
                'actions' => ['create_ticket'],
            ],
            'model' => $this->model,
        ];
    }

    /**
     * Clean AI response
     */
    protected function cleanAiResponse(string $response): string
    {
        $cleaned = preg_replace('/\[CUSTOMER_NAME:\s*[^\]]+\]/i', '', $response);
        $cleaned = str_replace(['[HANDOVER]', '[REQUEST_CONTACT]', '[CREATE_BOOKING]'], '', $cleaned);
        $cleaned = preg_replace('/\[BOOKING_(?:NAME|PHONE|EMAIL|ADDRESS|ISSUE|DATE|TIME):\s*[^\]]*\]/i', '', $cleaned);
        $cleaned = preg_replace('/\[(?:LOOKUP_CLIENT|CHECK_SCHEDULE|RESCHEDULE_APPOINTMENT|NEW_DATE|NEW_TIME):\s*[^\]]*\]/i', '', $cleaned);
        // Convert Markdown links [text](url) to plain text - chat widget shows plain text
        $cleaned = preg_replace('/\[([^\]]+)\]\([^)]+\)/', '$1', $cleaned);

        return trim(preg_replace('/\s+/', ' ', $cleaned));
    }

    /**
     * Extract customer name from AI response if present
     */
    protected function extractCustomerName(string $response, ?string $customerMessage = null): ?string
    {
        // 1. Check for explicit [CUSTOMER_NAME:] tag
        if (preg_match('/\[CUSTOMER_NAME:\s*([^\]]+)\]/i', $response, $matches)) {
            $name = trim($matches[1]);
            if (strlen($name) >= 2 && strlen($name) <= 100) {
                return $name;
            }
        }

        // 2. Fallback: extract from AI response patterns like "Thank you, Alex!" or "Hi Alex,"
        if (preg_match('/(?:Thank you|Thanks|Hi|Hello|Nice to meet you),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[!.,]/', $response, $matches)) {
            $name = trim($matches[1]);
            // Exclude common false positives
            $exclude = ['Welcome', 'There', 'Sure', 'Great', 'How', 'What', 'Please', 'Let'];
            if (strlen($name) >= 2 && strlen($name) <= 50 && !in_array($name, $exclude)) {
                return $name;
            }
        }

        // 3. Fallback: if customer message is a short name-like response (1-3 capitalized words)
        if ($customerMessage) {
            $msg = trim($customerMessage);
            // Patterns: "Alex", "Alex James", "my name is Alex James", "I'm Alex", "it's Alex"
            if (preg_match('/^(?:(?:my name is|i\'?m|it\'?s|this is|i am|name:?)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/i', $msg, $matches)) {
                $name = trim($matches[1]);
                // Capitalize properly
                $name = implode(' ', array_map('ucfirst', explode(' ', strtolower($name))));
                if (strlen($name) >= 2 && strlen($name) <= 50) {
                    return $name;
                }
            }
        }

        return null;
    }

    /**
     * Check if AI response contains a booking creation request
     */
    protected function isBookingRequest(string $response): bool
    {
        return strpos($response, '[CREATE_BOOKING]') !== false;
    }

    /**
     * Extract booking details from AI response and create a ticket
     */
    protected function createBookingTicket(Chat $chat, string $aiContent, ?Project $project = null): array
    {
        $name = null;
        $phone = null;
        $email = null;
        $address = null;
        $issue = null;

        if (preg_match('/\[BOOKING_NAME:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $name = trim($m[1]);
        }
        if (preg_match('/\[BOOKING_PHONE:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $phone = trim($m[1]);
        }
        if (preg_match('/\[BOOKING_EMAIL:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $email = trim($m[1]);
        }
        if (preg_match('/\[BOOKING_ADDRESS:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $address = trim($m[1]);
        }
        if (preg_match('/\[BOOKING_ISSUE:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $issue = trim($m[1]);
        }

        // Update chat with customer details
        $chat->update(array_filter([
            'customer_name' => $name,
            'customer_email' => $email,
        ]));

        // Build description with issue summary and chat history
        $description = '';
        if ($issue) {
            $description .= "Issue Details: {$issue}\n\n";
        }
        $description .= "Customer Details:\n";
        $description .= "Name: {$name}\nPhone: {$phone}\nEmail: {$email}\nService Address: {$address}\n\n";
        $description .= "Chat Transcript:\n\n";
        $messages = $chat->messages()->orderBy('created_at', 'asc')->get();
        foreach ($messages as $msg) {
            $sender = $msg->sender_type === 'customer' ? 'Customer'
                : ($msg->sender_type === 'agent' ? 'Agent' : 'AI');
            $description .= "[{$sender}]: {$msg->content}\n\n";
        }

        // Create ticket with full booking details
        $ticket = Ticket::create([
            'project_id' => $chat->project_id,
            'chat_id' => $chat->id,
            'customer_name' => $name ?? $chat->customer_name ?? 'Unknown',
            'customer_email' => $email,
            'customer_phone' => $phone,
            'service_address' => $address,
            'subject' => 'Booking: ' . ($issue ? Str::limit($issue, 60) . ' — ' : '') . ($name ?? 'Customer') . ' — ' . now()->format('M d, Y H:i'),
            'description' => $description,
            'status' => 'open',
            'priority' => 'high',
            'category' => 'Booking',
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_id' => $email ?? $chat->customer_id,
            'content' => "Booking request created from chat.\n\nName: {$name}\nPhone: {$phone}\nEmail: {$email}\nService Address: {$address}" . ($issue ? "\n\nIssue Details: {$issue}" : ''),
        ]);

        // Create Frubix appointment if integration is connected
        $frubixBooked = false;
        $bookingDate = null;
        $bookingTime = null;
        $project = $project ?? $chat->project ?? Project::find($chat->project_id);
        $frubixConfig = $project ? $this->getFrubixIntegration($project) : null;
        Log::info('Frubix booking check', [
            'chat_id' => $chat->id,
            'project_id' => $chat->project_id,
            'project_loaded' => $project ? true : false,
            'frubix_config' => $frubixConfig ? 'FOUND' : 'NULL',
            'ai_content_has_booking_date' => str_contains($aiContent, '[BOOKING_DATE'),
        ]);
        if ($frubixConfig) {
            if (preg_match('/\[BOOKING_DATE:\s*([^\]]+)\]/i', $aiContent, $m)) {
                $bookingDate = trim($m[1]);
            }
            if (preg_match('/\[BOOKING_TIME:\s*([^\]]+)\]/i', $aiContent, $m)) {
                $bookingTime = trim($m[1]);
            }

            // Check for schedule conflicts before booking
            $conflictMessage = null;
            if ($bookingDate) {
                try {
                    $existingSlots = FrubixService::getSchedule($frubixConfig, [
                        'date' => $bookingDate,
                    ], $project);
                    if (!empty($existingSlots) && $bookingTime) {
                        $requestedMinutes = $this->timeToMinutes($bookingTime);
                        foreach ($existingSlots as $slot) {
                            $slotTime = $slot['scheduled_time'] ?? null;
                            $slotDuration = $slot['duration'] ?? 60;
                            if ($slotTime) {
                                $slotStart = $this->timeToMinutes($slotTime);
                                $slotEnd = $slotStart + $slotDuration;
                                if ($requestedMinutes >= $slotStart && $requestedMinutes < $slotEnd) {
                                    $conflictMessage = "The {$bookingTime} slot on {$bookingDate} is already taken.";
                                    break;
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Frubix schedule conflict check failed', ['error' => $e->getMessage()]);
                }
            }

            try {
                $appointmentData = array_filter([
                    'customer_name' => $name,
                    'customer_phone' => $phone,
                    'customer_email' => $email,
                    'address' => $address,
                    'job_type' => $issue ? Str::limit($issue, 100) : 'Service Request',
                    'notes' => $issue ?? 'Booked via LinoChat',
                    'scheduled_date' => $bookingDate,
                    'scheduled_time' => $bookingTime,
                    'duration' => 60,
                ]);
                if (!$conflictMessage) {
                    FrubixService::createAppointment($frubixConfig, $appointmentData, $project);
                }
                $frubixBooked = !$conflictMessage;
                Log::info('Frubix appointment created', [
                    'chat_id' => $chat->id,
                    'ticket_id' => $ticket->id,
                    'date' => $bookingDate,
                    'time' => $bookingTime,
                    'data' => $appointmentData,
                ]);
            } catch (\Exception $e) {
                Log::error('Frubix appointment FAILED', ['error' => $e->getMessage()]);
            }
        }

        // Clean the AI content for display (remove tags)
        $cleanContent = $this->cleanAiResponse($aiContent);
        $confirmationNote = $frubixBooked
            ? "\n\nYour appointment has been booked" . ($bookingDate ? " for {$bookingDate}" . ($bookingTime ? " at {$bookingTime}" : '') : '') . " (Ticket #{$ticket->ticket_number}). We'll see you then!"
            : ($conflictMessage ?? null
                ? "\n\n{$conflictMessage} Your booking request has been submitted (Ticket #{$ticket->ticket_number}) and our team will help find an available time."
                : "\n\nYour booking request has been submitted (Ticket #{$ticket->ticket_number}). Our team will reach out to confirm the details shortly.");

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'ai',
            'content' => $cleanContent . $confirmationNote,
            'is_ai' => true,
            'metadata' => [
                'model' => $this->model,
                'booking_created' => true,
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'booking_details' => compact('name', 'phone', 'email', 'address'),
            ],
        ]);

        // Send email notifications
        $ticket->refresh();
        $project = $chat->project()->with('agents')->first();

        $companyId = $project->company_id ?? null;

        // Email to customer
        if ($email) {
            try {
                $ticketUrl = config('app.frontend_url', 'http://localhost:5174') . '/ticket/' . $ticket->access_token;
                Mail::to($email)->send(new TicketCreatedMail($ticket, $project->name ?? 'Support', $ticketUrl));
                NotificationLog::record('email', 'Ticket Created — Customer', "Booking ticket #{$ticket->ticket_number} created for {$name}. Subject: {$ticket->subject}" . ($issue ? "\nIssue: {$issue}" : ''), $email, 'sent', $companyId);
            } catch (\Exception $e) {
                Log::error('Failed to send ticket email to customer', ['error' => $e->getMessage()]);
                NotificationLog::record('email', 'Ticket Created — Customer', "Booking ticket #{$ticket->ticket_number} for {$name}", $email, 'failed', $companyId);
            }
        }

        // Email to company admin(s)
        if ($project) {
            $adminEmails = User::where('company_id', $project->company_id)
                ->where('role', 'admin')
                ->pluck('email')
                ->filter()
                ->toArray();
            if ($project->user && $project->user->email) {
                $adminEmails[] = $project->user->email;
            }
            $adminEmails = array_unique($adminEmails);
            foreach ($adminEmails as $adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new NewTicketMail($ticket));
                    NotificationLog::record('email', 'New Ticket — Admin', "New booking ticket #{$ticket->ticket_number} from {$name}. Subject: {$ticket->subject}" . ($issue ? "\nIssue: {$issue}" : ''), $adminEmail, 'sent', $companyId);
                } catch (\Exception $e) {
                    Log::error('Failed to send ticket email to admin', ['email' => $adminEmail, 'error' => $e->getMessage()]);
                    NotificationLog::record('email', 'New Ticket — Admin', "Booking ticket #{$ticket->ticket_number} from {$name}", $adminEmail, 'failed', $companyId);
                }
            }
        }

        // Log activity
        ActivityLog::log('ticket_created', "Booking ticket #{$ticket->ticket_number} created", ($name ?? 'Customer') . " requested a booking" . ($issue ? ": {$issue}" : '') . ". Phone: {$phone}, Email: {$email}", [
            'company_id' => $companyId,
            'project_id' => $chat->project_id,
        ]);

        // Notify agents in-app
        if ($project) {
            $agentIds = $project->agents->pluck('id')->merge([$project->user_id])->unique()->filter()->values();
            foreach ($agentIds as $agentId) {
                \App\Models\AppNotification::create([
                    'user_id' => $agentId,
                    'type' => 'alert',
                    'title' => 'New booking request',
                    'description' => ($name ?? 'A customer') . ' submitted a booking request.',
                ]);
            }
        }

        Log::info('Booking ticket created from AI chat', [
            'chat_id' => $chat->id,
            'ticket_id' => $ticket->id,
            'customer_name' => $name,
            'customer_phone' => $phone,
            'customer_email' => $email,
            'service_address' => $address,
        ]);

        return [
            'id' => $message->id,
            'content' => $message->content,
            'sender_type' => 'ai',
            'created_at' => $message->created_at,
            'model' => $this->model,
            'booking_created' => true,
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
        ];
    }

    /**
     * Check if customer message is about appointments/schedule
     */
    /**
     * Detect if AI response looks like a booking confirmation without the proper tag
     */
    protected function looksLikeBookingConfirmation(string $response): bool
    {
        $lower = strtolower($response);
        $hasConfirmation = preg_match('/\b(booked|confirmed|scheduled|appointment.*(created|set up|has been))\b/i', $response);
        $hasDetails = preg_match('/\b(name|phone|email|address)\b.*\b(name|phone|email|address)\b/is', $response);
        return $hasConfirmation && $hasDetails;
    }

    protected function isAppointmentRelated(string $message): bool
    {
        $keywords = [
            'appointment', 'schedule', 'booking', 'booked', 'book',
            'when is my', 'check my', 'upcoming', 'next visit',
            'date of my', 'time of my', 'reschedule', 'rebook', 'change my',
            'move my', 'cancel my', 'update my',
            'book a', 'book an', 'make an appointment', 'set up',
            'available time', 'available slot', 'free slot',
            'service call', 'technician', 'visit',
        ];
        $lower = strtolower($message);
        foreach ($keywords as $kw) {
            if (strpos($lower, $kw) !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if AI response contains a Frubix lookup request
     */
    protected function isFrubixLookup(string $response): bool
    {
        return preg_match('/\[(LOOKUP_CLIENT|CHECK_SCHEDULE|RESCHEDULE_APPOINTMENT):\s*[^\]]+\]/i', $response) === 1;
    }

    /**
     * Get active Frubix integration config for a project
     */
    protected function getFrubixIntegration(Project $project): ?array
    {
        $integrations = $project->integrations ?? [];
        $frubix = $integrations['frubix'] ?? null;

        if (!$frubix || empty($frubix['access_token'])) {
            return null;
        }

        return $frubix;
    }

    /**
     * Handle Frubix lookup tokens and return context string for AI
     */
    protected function handleFrubixLookup(string $aiContent, Project $project): ?string
    {
        $frubixConfig = $this->getFrubixIntegration($project);
        if (!$frubixConfig) {
            return null;
        }

        $results = [];

        // Handle client lookup
        if (preg_match('/\[LOOKUP_CLIENT:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $query = trim($m[1]);
            try {
                $params = filter_var($query, FILTER_VALIDATE_EMAIL)
                    ? ['email' => $query]
                    : ['phone' => $query];
                $clients = FrubixService::searchClients($frubixConfig, $params);
                if (!empty($clients)) {
                    $results[] = "FRUBIX CLIENT FOUND:\n" . collect($clients)->map(function ($c) {
                        $info = "- Name: " . ($c['name'] ?? 'N/A');
                        if (!empty($c['email'])) $info .= ", Email: {$c['email']}";
                        if (!empty($c['phone'])) $info .= ", Phone: {$c['phone']}";
                        if (!empty($c['address'])) $info .= ", Address: {$c['address']}";
                        if (!empty($c['company_name'])) $info .= ", Company: {$c['company_name']}";
                        return $info;
                    })->implode("\n");
                } else {
                    $results[] = "FRUBIX CLIENT LOOKUP: No client found for '{$query}'.";
                }
            } catch (\Exception $e) {
                Log::warning('Frubix client lookup failed', ['error' => $e->getMessage()]);
                $results[] = "FRUBIX CLIENT LOOKUP: Unable to look up client at this time.";
            }
        }

        // Handle schedule check
        if (preg_match('/\[CHECK_SCHEDULE:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $query = trim($m[1]);
            try {
                $params = ['date_from' => now()->toDateString(), 'date_to' => now()->addDays(30)->toDateString()];
                // If not "ALL", filter by phone/email
                if (strtoupper($query) !== 'ALL') {
                    $params['phone'] = $query;
                }
                $schedule = FrubixService::getSchedule($frubixConfig, $params);
                if (!empty($schedule)) {
                    $results[] = "FRUBIX SCHEDULE (use appointment IDs for rescheduling):\n" . collect($schedule)->map(function ($s) {
                        $info = "- ID #{$s['id']}: " . ($s['scheduled_at'] ?? $s['scheduled_date'] ?? 'TBD');
                        if (!empty($s['scheduled_time'])) $info .= " at {$s['scheduled_time']}";
                        if (!empty($s['customer_name'])) $info .= ", Customer: {$s['customer_name']}";
                        if (!empty($s['job_type'])) $info .= ", Type: {$s['job_type']}";
                        if (!empty($s['status'])) $info .= ", Status: {$s['status']}";
                        if (!empty($s['address'])) $info .= ", Address: {$s['address']}";
                        if (!empty($s['duration'])) $info .= ", Duration: {$s['duration']} min";
                        return $info;
                    })->implode("\n");
                } else {
                    $results[] = "FRUBIX SCHEDULE: No upcoming appointments found for '{$query}'.";
                }
            } catch (\Exception $e) {
                Log::warning('Frubix schedule check failed', ['error' => $e->getMessage()]);
                $results[] = "FRUBIX SCHEDULE: Unable to check schedule at this time.";
            }
        }

        // Handle reschedule
        if (preg_match('/\[RESCHEDULE_APPOINTMENT:\s*([^\]]+)\]/i', $aiContent, $m)) {
            $appointmentId = trim($m[1]);
            $newDate = null;
            $newTime = null;
            if (preg_match('/\[NEW_DATE:\s*([^\]]+)\]/i', $aiContent, $dm)) {
                $newDate = trim($dm[1]);
            }
            if (preg_match('/\[NEW_TIME:\s*([^\]]+)\]/i', $aiContent, $tm)) {
                $newTime = trim($tm[1]);
            }

            try {
                $updateData = array_filter([
                    'scheduled_date' => $newDate,
                    'scheduled_time' => $newTime,
                ]);
                if (!empty($updateData)) {
                    FrubixService::updateAppointment($frubixConfig, (int) $appointmentId, $updateData);
                    $results[] = "RESCHEDULE CONFIRMED: Appointment #{$appointmentId} has been successfully rescheduled" . ($newDate ? " to {$newDate}" : '') . ($newTime ? " at {$newTime}" : '') . ". Confirm this to the customer.";
                } else {
                    $results[] = "RESCHEDULE: No new date or time was provided. Ask the customer for their preferred new date and time.";
                }
            } catch (\Exception $e) {
                Log::warning('Frubix reschedule failed', ['error' => $e->getMessage(), 'appointment_id' => $appointmentId]);
                $results[] = "RESCHEDULE FAILED: Unable to reschedule appointment #{$appointmentId} at this time. Apologize and offer to have a team member help.";
            }
        }

        if (empty($results)) {
            return null;
        }

        return "The following information was retrieved from our system. Use it to respond to the customer naturally (do NOT mention 'Frubix' or 'system lookup' to the customer — present the info as if you already know it). Remove any [LOOKUP_CLIENT], [CHECK_SCHEDULE], [RESCHEDULE_APPOINTMENT], [NEW_DATE], or [NEW_TIME] tags from your response.\n\n" . implode("\n\n", $results);
    }

    /**
     * Get fallback response when AI is unavailable
     */
    protected function getFallbackResponse(Chat $chat): array
    {
        $responses = [
            "I understand. Let me help you with that.",
            "Thanks for your message. I'm looking into this for you.",
            "Got it. Let me find the best information for you.",
        ];

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'ai',
            'content' => $responses[array_rand($responses)],
            'is_ai' => true,
            'metadata' => [
                'model' => 'fallback',
                'error' => 'AI service unavailable',
            ],
        ]);

        return [
            'id' => $message->id,
            'content' => $message->content,
            'sender_type' => 'ai',
            'created_at' => $message->created_at,
            'model' => 'fallback',
        ];
    }

    /**
     * Check if any agents are available for the project
     */
    public function areAgentsAvailable(Project $project): bool
    {
        // Get all agents for this project
        $agentIds = $project->agents()->pluck('users.id');
        
        if ($agentIds->isEmpty()) {
            // Check if project owner is available
            $owner = User::where('id', $project->user_id)->first();
            if ($owner && $owner->status === 'Active') {
                return true;
            }
            return false;
        }

        // Check if any agent is online/active
        $availableAgents = User::whereIn('id', $agentIds)
            ->where('status', 'Active')
            ->count();

        return $availableAgents > 0;
    }

    /**
     * Check if agents are responding (no agent message in last minute)
     */
    public function areAgentsResponding(Chat $chat): bool
    {
        // Check if any agent has responded in the last minute
        $lastAgentMessage = $chat->messages()
            ->where('sender_type', 'agent')
            ->where('created_at', '>=', now()->subMinute())
            ->first();

        return $lastAgentMessage !== null;
    }

    /**
     * Check if we should create a ticket (agents busy/not responding)
     */
    public function shouldCreateTicket(Chat $chat, Project $project): bool
    {
        // Check if chat has been waiting for human for more than 1 minute
        $lastMessage = $chat->messages()->orderBy('created_at', 'desc')->first();
        
        if (!$lastMessage) {
            return false;
        }

        // If chat status is waiting and last message is from customer and older than 1 minute
        if ($chat->status === 'waiting' && $lastMessage->sender_type === 'customer') {
            $minutesSinceLastMessage = now()->diffInMinutes($lastMessage->created_at);
            
            if ($minutesSinceLastMessage >= 1) {
                // Check if agents are available
                if (!$this->areAgentsAvailable($project)) {
                    return true;
                }
                
                // Check if agents are responding
                if (!$this->areAgentsResponding($chat)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Create ticket from chat
     */
    public function createTicketFromChat(Chat $chat, string $customerEmail, ?string $customerName = null, ?string $customerPhone = null, ?string $serviceAddress = null): array
    {
        // Get chat messages for ticket description
        $messages = $chat->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        // Build description from chat history
        $description = "Chat Transcript:\n\n";
        foreach ($messages as $msg) {
            $sender = $msg->sender_type === 'customer' ? 'Customer' :
                     ($msg->sender_type === 'agent' ? 'Agent' : 'AI');
            $description .= "[{$sender}]: {$msg->content}\n\n";
        }

        // Create ticket
        $ticket = Ticket::create([
            'project_id' => $chat->project_id,
            'customer_email' => $customerEmail,
            'customer_name' => $customerName ?? $chat->customer_name ?? 'Unknown',
            'customer_phone' => $customerPhone,
            'service_address' => $serviceAddress,
            'subject' => 'Support Request from Chat - ' . now()->format('M d, Y H:i'),
            'description' => $description,
            'status' => 'open',
            'priority' => 'medium',
            'category' => 'Chat',
        ]);

        // Add ticket message
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_id' => $customerEmail,
            'content' => 'Ticket created from chat conversation.',
        ]);

        // Update chat with ticket reference
        $chat->update([
            'status' => 'closed',
            'metadata' => array_merge($chat->metadata ?? [], ['ticket_id' => $ticket->id]),
        ]);

        return [
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->id,
        ];
    }

    /**
     * Generate AI response requesting contact info for ticket creation
     */
    public function requestContactInfoForTicket(Chat $chat): array
    {
        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'ai',
            'content' => "I apologize, but all our agents are currently busy. To ensure your request is handled promptly, I'd like to create a support ticket for you.\n\nCould you please provide your email address so we can follow up with you?",
            'is_ai' => true,
            'metadata' => [
                'model' => $this->model,
                'requesting_contact_info' => true,
                'reason' => 'agents_busy',
            ],
        ]);

        return [
            'id' => $message->id,
            'content' => $message->content,
            'sender_type' => 'ai',
            'created_at' => $message->created_at,
            'requesting_contact_info' => true,
            'model' => $this->model,
        ];
    }

    /**
     * Generate AI response confirming ticket creation
     */
    public function confirmTicketCreated(Chat $chat, array $ticketInfo): array
    {
        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'ai',
            'content' => "Thank you! I've created a support ticket for you (Ticket #{$ticketInfo['ticket_id']}).\n\nOur team will review your request and get back to you via email as soon as possible. You should receive a confirmation email shortly.\n\nIs there anything else I can help you with?",
            'is_ai' => true,
            'metadata' => [
                'model' => $this->model,
                'ticket_created' => true,
                'ticket_id' => $ticketInfo['ticket_id'],
            ],
        ]);

        return [
            'id' => $message->id,
            'content' => $message->content,
            'sender_type' => 'ai',
            'created_at' => $message->created_at,
            'model' => $this->model,
        ];
    }

    /**
     * Get current AI model
     */
    public function getModel(): string
    {
        return $this->model;
    }

    /**
     * Set AI model (for testing or future upgrades)
     */
    public function setModel(string $model): void
    {
        $this->model = $model;
    }

    private function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return ((int) ($parts[0] ?? 0)) * 60 + ((int) ($parts[1] ?? 0));
    }

    private function logAiUsage(Chat $chat, ?array $response, int $totalTokens): void
    {
        try {
            $inputTokens = $response['input_tokens'] ?? 0;
            $outputTokens = $response['output_tokens'] ?? 0;
            $model = $response['model'] ?? $this->model;

            // Get pricing config
            $pricing = \App\Models\PlatformSetting::getValue('ai_pricing', []);
            $modelPricing = $pricing[$model] ?? ['mode' => 'markup', 'markup_percent' => 200, 'base_cost_input_per_1m' => 0.15, 'base_cost_output_per_1m' => 0.60];

            // Calculate base cost
            $baseCost = ($inputTokens / 1_000_000) * ($modelPricing['base_cost_input_per_1m'] ?? 0.15)
                      + ($outputTokens / 1_000_000) * ($modelPricing['base_cost_output_per_1m'] ?? 0.60);

            // Calculate charged cost
            $mode = $modelPricing['mode'] ?? 'markup';
            if ($mode === 'fixed') {
                $chargedCost = (float) ($modelPricing['fixed_price'] ?? $baseCost);
            } else {
                $markupPercent = (float) ($modelPricing['markup_percent'] ?? 200);
                $chargedCost = $baseCost * (1 + $markupPercent / 100);
            }

            \App\Models\AiUsageLog::create([
                'project_id' => $chat->project_id,
                'chat_id' => $chat->id,
                'model' => $model,
                'input_tokens' => $inputTokens,
                'output_tokens' => $outputTokens,
                'base_cost' => round($baseCost, 6),
                'charged_cost' => round($chargedCost, 6),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to log AI usage', ['error' => $e->getMessage()]);
        }
    }
}
