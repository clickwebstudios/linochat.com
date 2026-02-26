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
                    'max_tokens' => 150,
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

        $prompt = "You are a helpful AI customer support assistant for {$companyName}. ";
        $prompt .= "Your goal is to provide accurate, friendly, and concise answers to customer questions.\n\n";
        $prompt .= "IMPORTANT INSTRUCTIONS:\n";
        $prompt .= "1. At the start of every new conversation: greet the customer warmly, then immediately ask for their name. Write your greeting and name request in the chat (e.g. 'Hi! Welcome to {$companyName}. How can I help you today? Please tell me your name.')\n";
        $prompt .= "2. PRIORITY: Use the KNOWLEDGE BASE ARTICLES provided below to answer questions. These articles contain the most accurate and up-to-date information about {$companyName}.\n";
        $prompt .= "3. When answering from a KB article: be accurate, cite the article title if relevant, and synthesize the information into a helpful response.\n";
        $prompt .= "4. If the customer's question is NOT covered in the KB articles: try to answer from general knowledge about {$companyName} (website, description provided), or offer to connect them with a human agent.\n";
        $prompt .= "5. Be conversational and friendly, but professional. Keep responses SHORT: 1-2 sentences max. Be direct and avoid filler.\n";
        $prompt .= "6. Use [HANDOVER] ONLY when: (a) the customer explicitly asks to speak to a human, OR (b) the question requires account-specific info, custom quotes, or something you truly cannot help with. Do NOT hand over for general questions about pricing, services, or the website—answer those when possible.\n";
        $prompt .= "7. If you cannot answer and no human agent is available, include [REQUEST_CONTACT] to ask for their name and email to create a ticket.\n";
        $prompt .= "8. Don't invent specific facts (prices, dates) not in the knowledge base. For general questions, give helpful guidance and suggest they contact support for specifics if needed.\n";
        $prompt .= "9. When the customer provides their name (e.g. in response to 'Please tell me your name'), append [CUSTOMER_NAME: Name] to the end of your response. Use only their name, properly capitalized (e.g. John, Jane Doe). Do not include [CUSTOMER_NAME] if you are unsure or if they did not provide a name.\n";
        $prompt .= "10. Never use Markdown formatting. Write emails and URLs as plain text (e.g. info@example.com, https://example.com). No [text](url) links.\n\n";

        if ($website || $description) {
            $prompt .= "COMPANY CONTEXT:\n";
            if ($website) {
                $prompt .= "Website: {$website}\n";
            }
            if ($description) {
                $prompt .= "Description: {$description}\n";
            }
            $prompt .= "\n";
        }

        if (!empty($kbContext)) {
            $prompt .= "KNOWLEDGE BASE ARTICLES (Use these to answer questions):\n";
            $prompt .= "===\n";
            foreach ($kbContext as $index => $article) {
                $prompt .= "ARTICLE " . ($index + 1) . ": {$article->title}\n";
                $prompt .= "Category: " . ($article->category->name ?? 'General') . "\n";
                // Limit content length to avoid token overflow
                $content = strip_tags($article->content);
                if (strlen($content) > 2000) {
                    $content = substr($content, 0, 2000) . '... [content truncated]';
                }
                $prompt .= "Content: {$content}\n";
                $prompt .= "---\n";
            }
            $prompt .= "===\n\n";
            $prompt .= "INSTRUCTION: Base your answers primarily on the KB articles above. If a customer asks about something covered in these articles, provide a clear, accurate answer based on the article content.\n\n";
        } else {
            $prompt .= "NOTE: No knowledge base articles are available for this project. Answer questions based on general knowledge about {$companyName}.\n\n";
        }

        $prompt .= "Remember: Answer questions when you can using the KB articles. Only use [HANDOVER] when the customer needs a human or you truly cannot help.";

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
        broadcast(new HumanRequested($chat->load('project')));

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
        $cleaned = str_replace(['[HANDOVER]', '[REQUEST_CONTACT]'], '', $cleaned);
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
    public function createTicketFromChat(Chat $chat, string $customerEmail, ?string $customerName = null): array
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
