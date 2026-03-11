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
use OpenAI;
use OpenAI\Exceptions\ErrorException;
use OpenAI\Exceptions\TimeoutException;

class AiChatService
{
    /**
     * Default AI model
     */
    protected string $model = 'gpt-4o';

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
            
            // Call OpenAI API with retry logic
            $response = $this->callOpenAIWithRetry($apiKey, $messages);

            // If all retries failed
            if ($response === null) {
                Log::error('All OpenAI API retries failed', ['chat_id' => $chat->id]);
                broadcast(new AiTyping($chat->id, false, $this->model));
                return $this->getFallbackResponse($chat);
            }

            $aiContent = $response['content'];
            $tokensUsed = $response['tokens_used'] ?? 0;
            
            // Check if AI wants to handover
            if ($this->isHandoverRequest($aiContent)) {
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
                return $this->createBookingTicket($chat, $aiContent);
            }

            // Extract and save customer name if AI detected it
            $cleanedContent = $this->cleanAiResponse($aiContent);
            $customerName = $this->extractCustomerName($aiContent);
            if ($customerName && (empty($chat->customer_name) || $chat->customer_name === 'Guest')) {
                $chat->update(['customer_name' => $customerName]);
            }

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
    protected function callOpenAIWithRetry(string $apiKey, array $messages): ?array
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                Log::debug("OpenAI API call attempt {$attempt}/{$this->maxRetries}");

                $client = OpenAI::client($apiKey);
                
                $response = $client->chat()->create([
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'max_tokens' => 300,
                ]);

                return [
                    'content' => $response->choices[0]->message->content,
                    'tokens_used' => $response->usage->totalTokens ?? 0,
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

        $prompt .= "LANGUAGE: Always respond in English, regardless of the language the customer uses.\n\n";
        $prompt .= "RULES:\n";
        $prompt .= "1. Greet the customer warmly at the start of a new conversation and ask for their name. Example: 'Hi! Welcome to {$companyName}. How can I help you today? Could I get your name please?'\n";
        $prompt .= "2. Answer questions confidently and directly as a company representative. Use 'we offer', 'we don't offer', 'our services include', etc.\n";
        $prompt .= "3. For YES/NO questions about services ('do you offer X?'): give a clear answer. If we don't offer it, say so and suggest what we do offer instead.\n";
        $prompt .= "4. Keep responses SHORT: 1-3 sentences. Be direct, friendly, and {$tone}. No filler words.\n";
        $prompt .= "5. Never invent specific prices or dates not provided below. For specifics, say we'd be happy to discuss details and offer to connect them with the team.\n";
        $prompt .= "6. Use [HANDOVER] ONLY when: (a) the customer explicitly asks for a human, OR (b) the request needs account-specific info or a custom quote that requires a real team member. Do NOT hand over for general service or pricing questions.\n";
        $prompt .= "7. If you cannot help and no agent is available, use [REQUEST_CONTACT] to collect their name and email.\n";
        $prompt .= "8. When the customer gives their name, append [CUSTOMER_NAME: Name] at the end of your reply (properly capitalized, e.g. John, Jane Doe).\n";
        $prompt .= "9. No Markdown. No [text](url) links. Plain text only (e.g. info@example.com, https://example.com).\n";
        $prompt .= "10. BOOKING FLOW: When a customer wants to book, schedule, or make an appointment, you MUST collect ALL of the following details one at a time before creating the booking:\n";
        $prompt .= "    - Full name\n";
        $prompt .= "    - Phone number\n";
        $prompt .= "    - Email address\n";
        $prompt .= "    - Service address (where the service will be performed)\n";
        $prompt .= "    Ask for each missing piece naturally in conversation. Once you have ALL four details, confirm them with the customer and append [CREATE_BOOKING] followed by the details in this exact format:\n";
        $prompt .= "    [CREATE_BOOKING][BOOKING_NAME: Full Name][BOOKING_PHONE: Phone][BOOKING_EMAIL: Email][BOOKING_ADDRESS: Address]\n";
        $prompt .= "    Do NOT use [CREATE_BOOKING] until you have confirmed all four details with the customer.\n\n";

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
            $customerName = $this->extractCustomerName($aiContent);
            if ($customerName && (empty($chat->customer_name) || $chat->customer_name === 'Guest')) {
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
        $cleaned = preg_replace('/\[BOOKING_(?:NAME|PHONE|EMAIL|ADDRESS):\s*[^\]]*\]/i', '', $cleaned);
        // Convert Markdown links [text](url) to plain text - chat widget shows plain text
        $cleaned = preg_replace('/\[([^\]]+)\]\([^)]+\)/', '$1', $cleaned);

        return trim(preg_replace('/\s+/', ' ', $cleaned));
    }

    /**
     * Extract customer name from AI response if present
     */
    protected function extractCustomerName(string $response): ?string
    {
        if (preg_match('/\[CUSTOMER_NAME:\s*([^\]]+)\]/i', $response, $matches)) {
            $name = trim($matches[1]);
            if (strlen($name) >= 2 && strlen($name) <= 100) {
                return $name;
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
    protected function createBookingTicket(Chat $chat, string $aiContent): array
    {
        $name = null;
        $phone = null;
        $email = null;
        $address = null;

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

        // Update chat with customer details
        $chat->update(array_filter([
            'customer_name' => $name,
            'customer_email' => $email,
        ]));

        // Build description from chat history
        $messages = $chat->messages()->orderBy('created_at', 'asc')->get();
        $description = "Booking Request — Chat Transcript:\n\n";
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
            'subject' => 'Booking Request — ' . ($name ?? 'Customer') . ' — ' . now()->format('M d, Y H:i'),
            'description' => $description,
            'status' => 'open',
            'priority' => 'high',
            'category' => 'Booking',
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_id' => $email ?? $chat->customer_id,
            'content' => "Booking request created from chat.\n\nName: {$name}\nPhone: {$phone}\nEmail: {$email}\nService Address: {$address}",
        ]);

        // Clean the AI content for display (remove tags)
        $cleanContent = $this->cleanAiResponse($aiContent);
        $confirmationNote = "\n\nYour booking request has been submitted (Ticket #{$ticket->ticket_number}). Our team will reach out to confirm the details shortly.";

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

        // Notify agents
        $project = $chat->project()->with('agents')->first();
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
}
