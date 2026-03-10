<?php

namespace App\Http\Controllers\Api;

use App\Events\ChatStatusUpdated;
use App\Events\CustomerTyping;
use App\Events\HumanRequested;
use App\Events\MessageSent;
use App\Events\NewChatForAgent;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Project;
use App\Services\AiChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class WidgetController extends Controller
{
    protected $aiService;

    public function __construct(AiChatService $aiService)
    {
        $this->aiService = $aiService;
    }
    /**
     * Get widget configuration
     * Public endpoint - no auth required.
     * Supports JSONP via ?callback=fn for sites with strict CSP that block fetch.
     */
    public function config(Request $request, string $widget_id)
    {
        try {
            $project = Project::where('widget_id', $widget_id)->first();

            if (!$project || $project->status !== 'active') {
                $data = ['success' => false, 'message' => 'Widget not found or inactive'];
                return $this->configResponse($request, $data, 404);
            }

            // Get widget settings with defaults
            $settings = $project->widget_settings ?? [];

            $data = [
                'success' => true,
                'data' => [
                    'widget_id' => $project->widget_id,
                    'company_name' => $project->name,
                    'color' => $settings['color'] ?? $project->color ?? '#4F46E5',
                    'design' => $settings['design'] ?? 'modern',
                    'position' => $settings['position'] ?? 'bottom-right',
                    'welcome_message' => $settings['welcome_message'] ?? "Hi there! How can we help you today?",
                    'button_text' => $settings['button_text'] ?? '💬',
                    'widget_title' => $settings['widget_title'] ?? $project->name,
                    'show_agent_name' => $settings['show_agent_name'] ?? true,
                    'show_agent_avatar' => $settings['show_agent_avatar'] ?? true,
                    'widget_active' => $settings['widget_active'] ?? true,
                    'auto_open' => $settings['auto_open'] ?? false,
                    'auto_open_delay' => $settings['auto_open_delay'] ?? 5,
                    'greeting_enabled' => $settings['greeting_enabled'] ?? false,
                    'greeting_delay' => $settings['greeting_delay'] ?? 3,
                    'greeting_message' => $settings['greeting_message'] ?? '',
                    'ai_name' => ($project->ai_settings['ai_name'] ?? null) ?: 'Lino',
                    'website' => $project->website,
                    'settings_updated_at' => $project->settings_updated_at?->toIso8601String(),
                ],
            ];

            return $this->configResponse($request, $data, 200);
        } catch (\Throwable $e) {
            return $this->configResponse($request, [
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Return config as JSON or JSONP based on callback param.
     */
    private function configResponse(Request $request, array $data, int $status)
    {
        $noCacheHeaders = [
            'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];
        $callback = $request->query('callback');
        if ($callback && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $callback)) {
            $response = response($callback . '(' . json_encode($data) . ');', $status)
                ->header('Content-Type', 'application/javascript; charset=utf-8')
                ->header('Access-Control-Allow-Origin', '*');
            foreach ($noCacheHeaders as $name => $value) {
                $response->header($name, $value);
            }
            return $response;
        }
        return response()->json($data, $status)->withHeaders($noCacheHeaders);
    }

    /**
     * Initialize or get existing chat.
     * Supports GET with ?callback=fn&customer_id=xxx for JSONP (bypasses CSP fetch block).
     */
    public function init(Request $request, string $widget_id)
    {
        // Accept customer_id from query (GET/JSONP) or body (POST)
        $customerId = $request->input('customer_id') ?? $request->query('customer_id');
        if (empty(trim((string) $customerId))) {
            $customerId = 'cust_' . Str::random(16);
        }

        $validator = Validator::make([
            'customer_email' => $request->input('customer_email'),
            'customer_name' => $request->input('customer_name'),
            'customer_id' => $customerId,
        ], [
            'customer_email' => 'nullable|email|max:255',
            'customer_name' => 'nullable|string|max:255',
            'customer_id' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->initResponse($request, [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project || $project->status !== 'active') {
            return $this->initResponse($request, [
                'success' => false,
                'message' => 'Widget not found or inactive',
            ], 404);
        }

        // Find existing active chat for this customer
        $chat = Chat::where('project_id', $project->id)
            ->where('customer_id', $customerId)
            ->whereIn('status', ['active', 'waiting', 'ai_handling'])
            ->first();

        if (!$chat) {
            $metadata = $this->buildSessionMetadata($request);

            $chat = Chat::create([
                'project_id' => $project->id,
                'customer_id' => $customerId,
                'customer_email' => $request->input('customer_email'),
                'customer_name' => $request->input('customer_name'),
                'status' => 'ai_handling',
                'ai_enabled' => true,
                'priority' => 'medium',
                'metadata' => $metadata,
            ]);

            $aiName = ($project->ai_settings['ai_name'] ?? null) ?: 'Lino';
            $welcomeMessage = ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_type' => 'ai',
                'content' => "Hi there! I'm {$aiName}, the AI assistant for {$project->name}. How can I help you today?",
                'is_ai' => true,
            ]);

            $chat->update(['last_message_at' => now()]);
            broadcast(new MessageSent($welcomeMessage))->toOthers();

            // Notify agents about new chat in real time (broadcast immediately, no queue)
            $project = Project::with('agents')->find($chat->project_id);
            if ($project) {
                $agentIds = $project->agents->pluck('id')->merge([$project->user_id])->unique()->filter()->values()->map(fn ($id) => (string) $id)->all();
                if (empty($agentIds) && $project->user_id) {
                    $agentIds = [(string) $project->user_id];
                }
                if (!empty($agentIds)) {
                    broadcast(new NewChatForAgent(
                        $chat->load(['project', 'agent', 'messages' => fn ($q) => $q->latest()->limit(1)]),
                        (string) $project->id,
                        $agentIds
                    ))->toOthers();

                    // Persist a notification for each agent
                    $customerName = $chat->customer_name ?? 'A customer';
                    $projectName  = $project->name ?? 'your project';
                    foreach ($agentIds as $agentId) {
                        AppNotification::create([
                            'user_id'     => $agentId,
                            'type'        => 'user',
                            'title'       => 'New chat',
                            'description' => "{$customerName} started a chat in {$projectName}.",
                        ]);
                    }
                }
            }
        }

        $data = [
            'success' => true,
            'data' => [
                'chat_id' => $chat->id,
                'customer_id' => $customerId,
                'status' => $chat->status,
                'messages' => $chat->messages()->orderBy('created_at')->get(),
            ],
        ];

        return $this->initResponse($request, $data, 200);
    }

    /**
     * Build session metadata from request (client body + server headers).
     * Used for Location, Device, Browser, Referral Source in agent Info panel.
     */
    private function buildSessionMetadata(Request $request): array
    {
        $currentPage = $request->input('current_page') ?? $request->input('referrer');
        $referrer = $request->input('referrer') ?? $request->header('Referer');
        $userAgent = $request->input('user_agent') ?? $request->userAgent() ?? '';

        if (empty($currentPage) && $referrer) {
            $currentPage = $referrer;
        }
        if (empty($currentPage)) {
            $currentPage = '/';
        }

        $browser = $this->parseBrowserFromUserAgent($userAgent);
        $device = $this->parseDeviceFromUserAgent($userAgent);

        $referralSource = $this->deriveReferralSource($currentPage, $referrer);

        return array_filter([
            'current_page' => $currentPage,
            'referrer' => $referrer ?: null,
            'referral_source' => $referralSource,
            'browser' => $browser,
            'device' => $device,
            'location' => null, // Requires IP geolocation service
        ], fn ($v) => $v !== null && $v !== '');
    }

    private function parseBrowserFromUserAgent(string $ua): string
    {
        if (empty($ua)) {
            return '—';
        }
        if (preg_match('/Edg\//', $ua)) {
            return 'Edge';
        }
        if (preg_match('/OPR\//', $ua) || preg_match('/Opera/', $ua)) {
            return 'Opera';
        }
        if (preg_match('/Chrome\//', $ua) && ! preg_match('/Chromium/', $ua)) {
            return 'Chrome';
        }
        if (preg_match('/Firefox\//', $ua)) {
            return 'Firefox';
        }
        if (preg_match('/Safari\//', $ua) && ! preg_match('/Chrome/', $ua)) {
            return 'Safari';
        }
        if (preg_match('/MSIE|Trident/', $ua)) {
            return 'Internet Explorer';
        }

        return 'Unknown';
    }

    private function parseDeviceFromUserAgent(string $ua): string
    {
        if (empty($ua)) {
            return '—';
        }
        if (preg_match('/Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i', $ua)) {
            return preg_match('/iPad|Tablet|PlayBook|Silk/i', $ua) ? 'Tablet' : 'Mobile';
        }

        return 'Desktop';
    }

    private function deriveReferralSource(?string $currentPage, ?string $referrer): string
    {
        if (empty(trim((string) $referrer))) {
            return 'Direct';
        }
        $refHost = parse_url($referrer, PHP_URL_HOST);
        if (! $refHost) {
            return 'External';
        }
        $pageHost = $currentPage ? parse_url($currentPage, PHP_URL_HOST) : null;
        if ($pageHost && strtolower($refHost) === strtolower($pageHost)) {
            return 'Internal';
        }

        return $refHost;
    }

    private function initResponse(Request $request, array $data, int $status)
    {
        $callback = $request->query('callback');
        if ($callback && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $callback)) {
            return response($callback . '(' . json_encode($data) . ');', $status)
                ->header('Content-Type', 'application/javascript; charset=utf-8')
                ->header('Access-Control-Allow-Origin', '*');
        }
        return response()->json($data, $status);
    }

    /**
     * Send message from customer.
     * Supports GET with ?callback=fn&chat_id=&customer_id=&message= for JSONP (bypasses CSP fetch block).
     */
    public function sendMessage(Request $request, string $widget_id)
    {
        $input = $request->all();

        $validator = Validator::make($input, [
            'chat_id' => 'required',
            'customer_id' => 'required|string',
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return $this->sendMessageResponse($request, [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return $this->sendMessageResponse($request, [
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $chat = Chat::where('id', $input['chat_id'])
            ->where('project_id', $project->id)
            ->where('customer_id', $input['customer_id'])
            ->first();

        if (!$chat) {
            return $this->sendMessageResponse($request, [
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        try {
            $message = ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_type' => 'customer',
                'sender_id' => $input['customer_id'],
                'content' => $input['message'],
                'is_ai' => false,
            ]);

            $chat->update(['last_message_at' => now()]);
            broadcast(new MessageSent($message))->toOthers();

            $aiResponse = null;
            $chat->refresh(); // Ensure we have latest agent_id/status (agent may have taken over)
            // Never use AI when an agent has taken over (agent_id is set)
            $shouldAiReply = $chat->ai_enabled !== false
                && !$chat->agent_id
                && ($chat->status === 'ai_handling'
                    || $chat->status === 'waiting');
            if ($shouldAiReply) {
                try {
                    $aiResponse = $this->generateAIResponse($chat, $input['message'], $project);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('AI response failed', ['error' => $e->getMessage()]);
                    $aiResponse = [
                        'id' => null,
                        'content' => 'Sorry, I\'m having trouble responding right now. Please try again later.',
                    ];
                }
            }

            $data = [
                'success' => true,
                'data' => [
                    'message' => $message,
                    'ai_response' => $aiResponse,
                    'chat_status' => $chat->fresh()->status,
                ],
            ];

            return $this->sendMessageResponse($request, $data, 200);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Send message failed', ['error' => $e->getMessage()]);
            return $this->sendMessageResponse($request, [
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function sendMessageResponse(Request $request, array $data, int $status)
    {
        $callback = $request->query('callback');
        if ($callback && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $callback)) {
            return response($callback . '(' . json_encode($data) . ');', $status)
                ->header('Content-Type', 'application/javascript; charset=utf-8')
                ->header('Access-Control-Allow-Origin', '*');
        }
        return response()->json($data, $status);
    }

    /**
     * Get chat messages
     */
    public function messages(Request $request, string $widget_id)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|string',
            'customer_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $chat = Chat::where('id', $request->input('chat_id'))
            ->where('project_id', $project->id)
            ->where('customer_id', $request->input('customer_id'))
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        $messages = $chat->messages()
            ->orderBy('created_at')
            ->limit(100)
            ->get();

        $agentName = null;
        if ($chat->agent_id) {
            $agent = $chat->agent ?? $chat->agent()->first();
            $agentName = $agent?->name;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'messages' => $messages,
                'status' => $chat->status,
                'agent_name' => $agentName,
            ],
        ]);
    }

    /**
     * Customer typing indicator (widget sends when user types)
     */
    public function typing(Request $request, string $widget_id)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|string',
            'customer_id' => 'required|string',
            'is_typing' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $chat = Chat::where('id', $request->input('chat_id'))
            ->where('project_id', $project->id)
            ->where('customer_id', $request->input('customer_id'))
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        broadcast(new CustomerTyping((string) $chat->id, (bool) $request->input('is_typing')));

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Get agent status (online/offline)
     */
    public function agentStatus(string $widget_id)
    {
        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        // Count active agents for this project (online = last_active_at within 5 min)
        $agentIds = $project->agents()->pluck('users.id');
        $activeAgents = \App\Models\User::whereIn('id', $agentIds)
            ->where('status', 'Active')
            ->where('last_active_at', '>=', now()->subMinutes(5))
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'agents_online' => $activeAgents,
                'status' => $activeAgents > 0 ? 'online' : 'offline',
                'estimated_wait' => $activeAgents > 0 ? '1-2 minutes' : '5-10 minutes',
            ],
        ]);
    }

    /**
     * Request human handover
     */
    public function requestHuman(Request $request, string $widget_id)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|string',
            'customer_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $chat = Chat::where('id', $request->input('chat_id'))
            ->where('project_id', $project->id)
            ->where('customer_id', $request->input('customer_id'))
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Update status to waiting for human
        $chat->update(['status' => 'waiting']);

        // Add system message
        $systemMessage = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'system',
            'content' => 'Transferring to human agent...',
        ]);
        
        // Broadcast status update and system message
        broadcast(new ChatStatusUpdated($chat->id, 'waiting'));
        broadcast(new MessageSent($systemMessage))->toOthers();

        // Notify all project agents so transfer modal opens automatically
        broadcast(new HumanRequested($chat->load('project')));

        // Persist a notification for all project agents
        $project = Project::with('agents')->find($chat->project_id);
        if ($project) {
            $agentIds = $project->agents->pluck('id')->merge([$project->user_id])->unique()->filter()->values();
            $customerName = $chat->customer_name ?? 'A customer';
            foreach ($agentIds as $agentId) {
                AppNotification::create([
                    'user_id'     => $agentId,
                    'type'        => 'alert',
                    'title'       => 'Human agent requested',
                    'description' => "{$customerName} is requesting a human agent.",
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Human agent requested',
            'data' => [
                'chat_id' => $chat->id,
                'status' => 'waiting',
                'estimated_wait' => '1-2 minutes',
            ],
        ]);
    }

    /**
     * Check if should create ticket (agents busy/not responding)
     */
    public function checkTicketNeeded(Request $request, string $widget_id)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|string',
            'customer_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $chat = Chat::where('id', $request->input('chat_id'))
            ->where('project_id', $project->id)
            ->where('customer_id', $request->input('customer_id'))
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Check if we should create ticket
        $shouldCreateTicket = $this->aiService->shouldCreateTicket($chat, $project);
        
        if ($shouldCreateTicket) {
            // Request contact info
            $response = $this->aiService->requestContactInfoForTicket($chat);
            
            broadcast(new MessageSent(ChatMessage::find($response['id'])))->toOthers();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'create_ticket' => true,
                    'requesting_contact_info' => true,
                    'ai_response' => $response,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'create_ticket' => false,
                'agents_available' => $this->aiService->areAgentsAvailable($project),
            ],
        ]);
    }

    /**
     * Submit contact info and create ticket
     */
    public function submitContactAndCreateTicket(Request $request, string $widget_id)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|string',
            'customer_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $chat = Chat::where('id', $request->input('chat_id'))
            ->where('project_id', $project->id)
            ->where('customer_id', $request->input('customer_id'))
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Update chat with customer info
        $chat->update([
            'customer_email' => $request->input('email'),
            'customer_name' => $request->input('name'),
        ]);

        // Create ticket
        $ticketInfo = $this->aiService->createTicketFromChat(
            $chat, 
            $request->input('email'),
            $request->input('name')
        );

        // Send confirmation message
        $response = $this->aiService->confirmTicketCreated($chat, $ticketInfo);
        broadcast(new MessageSent(ChatMessage::find($response['id'])))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Ticket created successfully',
            'data' => [
                'ticket_id' => $ticketInfo['ticket_id'],
                'chat_status' => 'closed',
                'ai_response' => $response,
            ],
        ]);
    }

    /**
     * Generate AI response using GPT-4o-mini
     */
    protected function generateAIResponse(Chat $chat, string $message, Project $project): ?array
    {
        $response = $this->aiService->generateResponse($chat, $message, $project);
        
        // Broadcast AI response if generated
        if ($response) {
            $aiMessage = ChatMessage::find($response['id']);
            if ($aiMessage) {
                broadcast(new MessageSent($aiMessage))->toOthers();
            }
        }
        
        return $response;
    }
}
