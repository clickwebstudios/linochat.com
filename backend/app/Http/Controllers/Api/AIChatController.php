<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Project;
use App\Services\AiChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class AIChatController extends Controller
{
    protected $aiService;

    public function __construct(AiChatService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Main AI chat endpoint
     * POST /api/ai/chat
     */
    public function chat(Request $request)
    {
        // Rate limiting: 60 requests per minute per IP
        $ipAddress = $request->ip();
        $rateLimitKey = 'ai-chat:' . $ipAddress;

        if (RateLimiter::tooManyAttempts($rateLimitKey, 60)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            return response()->json([
                'success' => false,
                'message' => 'Rate limit exceeded. Please try again later.',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60); // 60 seconds window

        // Validate input
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000|min:1',
            'chat_id' => 'nullable|string|exists:chats,id',
            'context' => 'nullable|array',
            'context.project_id' => 'required_with:context|string|exists:projects,id',
            'context.customer_id' => 'required_with:context|string',
        ], [
            'message.required' => 'The message field is required.',
            'message.string' => 'The message must be a string.',
            'message.max' => 'The message may not be greater than 5000 characters.',
            'message.min' => 'The message must be at least 1 character.',
            'chat_id.exists' => 'The specified chat does not exist.',
            'context.project_id.exists' => 'The specified project does not exist.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $message = $request->input('message');
            $chatId = $request->input('chat_id');
            $context = $request->input('context', []);

            // Get or create chat
            $chat = null;
            $project = null;

            if ($chatId) {
                $chat = Chat::find($chatId);
                if ($chat) {
                    $project = Project::find($chat->project_id);
                }
            } elseif (!empty($context['project_id'])) {
                $project = Project::find($context['project_id']);
                
                if ($project) {
                    // Create new chat
                    $chat = Chat::create([
                        'project_id' => $project->id,
                        'customer_id' => $context['customer_id'] ?? 'api_' . uniqid(),
                        'customer_email' => $context['customer_email'] ?? null,
                        'customer_name' => $context['customer_name'] ?? null,
                        'status' => 'ai_handling',
                        'priority' => 'medium',
                    ]);
                    $chatId = $chat->id;
                }
            }

            if (!$chat || !$project) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat or project not found',
                ], 404);
            }

            // Save customer message if this is a new request
            if ($chat->status === 'ai_handling') {
                \App\Models\ChatMessage::create([
                    'chat_id' => $chat->id,
                    'sender_type' => 'customer',
                    'sender_id' => $chat->customer_id,
                    'content' => $message,
                    'is_ai' => false,
                ]);
                
                $chat->update(['last_message_at' => now()]);
            }

            // Generate AI response
            $startTime = microtime(true);
            $aiResponse = $this->aiService->generateResponse($chat, $message, $project);
            $processingTime = round((microtime(true) - $startTime) * 1000); // in ms

            if (!$aiResponse) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI response could not be generated',
                    'chat_id' => $chat->id,
                ], 503);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'response' => $aiResponse['content'],
                    'chat_id' => $chat->id,
                    'model' => $aiResponse['model'] ?? $this->aiService->getModel(),
                    'tokens_used' => $aiResponse['tokens_used'] ?? 0,
                    'processing_time_ms' => $processingTime,
                    'message_id' => $aiResponse['id'] ?? null,
                    'kb_references' => $aiResponse['kb_references'] ?? [],
                ],
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI chat endpoint error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->except(['message']), // Don't log message for privacy
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request',
                'error_code' => 'AI_PROCESSING_ERROR',
            ], 500);
        }
    }

    /**
     * Get AI model info
     * GET /api/ai/model
     */
    public function modelInfo()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'model' => $this->aiService->getModel(),
                'max_tokens' => 500,
                'temperature' => 0.7,
            ],
        ]);
    }

    /**
     * Get rate limit status
     * GET /api/ai/rate-limit
     */
    public function rateLimitStatus(Request $request)
    {
        $ipAddress = $request->ip();
        $rateLimitKey = 'ai-chat:' . $ipAddress;

        $attempts = RateLimiter::attempts($rateLimitKey);
        $remaining = max(0, 60 - $attempts);
        $availableIn = RateLimiter::availableIn($rateLimitKey);

        return response()->json([
            'success' => true,
            'data' => [
                'limit' => 60,
                'remaining' => $remaining,
                'reset_in_seconds' => $availableIn > 0 ? $availableIn : 0,
            ],
        ]);
    }
}
