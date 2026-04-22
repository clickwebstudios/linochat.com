<?php

namespace App\Http\Controllers\Api;

use App\Events\ChatStatusUpdated;
use App\Events\CustomerPresenceUpdated;
use App\Events\CustomerTyping;
use App\Events\HumanRequested;
use App\Events\MessageSent;
use App\Events\NewChatForAgent;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Project;
use App\Models\Company;
use App\Models\User;
use App\Services\AiChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
            $project = Project::where('widget_id', $widget_id)
                ->with('owner.company:id,status')
                ->first();

            if (!$project || $project->status !== 'active') {
                $data = ['success' => false, 'disabled' => true, 'message' => 'Widget not found or inactive'];
                return $this->configResponse($request, $data, 404);
            }

            if (optional($project->owner?->company)->status === 'paused') {
                $data = ['success' => false, 'disabled' => true, 'message' => 'Widget disabled'];
                return $this->configResponse($request, $data, 404);
            }

            // Get widget settings with defaults
            $settings = $project->widget_settings ?? [];

            $scheduleStatus = $this->computeScheduleStatus($settings, $project);

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
                    'font_size' => $settings['font_size'] ?? 14,
                    'animation' => $settings['animation'] ?? 'none',
                    'animation_repeat' => $settings['animation_repeat'] ?? 'infinite',
                    'animation_delay' => $settings['animation_delay'] ?? '0',
                    'animation_duration' => $settings['animation_duration'] ?? 'default',
                    'animation_stop_after' => $settings['animation_stop_after'] ?? '0',
                    'gradient' => $settings['gradient'] ?? 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)',
                    'ai_name' => ($project->ai_settings['ai_name'] ?? null) ?: 'Lino',
                    'website' => $project->website,
                    'is_online' => $scheduleStatus['is_online'],
                    'offline_behavior' => $scheduleStatus['offline_behavior'],
                    'offline_message' => $scheduleStatus['offline_message'],
                    'offline_form_enabled' => $scheduleStatus['offline_form_enabled'],
                    'offline_redirect_url' => $scheduleStatus['offline_redirect_url'],
                    'offline_redirect_label' => $scheduleStatus['offline_redirect_label'],
                    'next_online_at' => $scheduleStatus['next_online_at'],
                    'popover' => ($settings['popover']['enabled'] ?? false) ? $settings['popover'] : null,
                    'page_rules' => $settings['page_rules'] ?? [],
                    'settings_updated_at' => $project->settings_updated_at?->toIso8601String(),
                ],
            ];

            return $this->configResponse($request, $data, 200);
        } catch (\Throwable $e) {
            return $this->configResponse($request, [
                'success' => false,
                'message' => 'Server error. Please try again.',
            ], 500);
        }
    }

    private function computeScheduleStatus(array $settings, Project $project): array
    {
        $schedule = $settings['schedule'] ?? [];
        $mode = $schedule['mode'] ?? 'always';

        $defaults = [
            'is_online' => true,
            'offline_behavior' => $schedule['offline_behavior'] ?? $settings['offline_behavior'] ?? 'hide',
            'offline_message' => $schedule['offline_message'] ?? $settings['offline_message'] ?? '',
            'offline_form_enabled' => $schedule['offline_form_enabled'] ?? false,
            'offline_redirect_url' => $schedule['offline_redirect_url'] ?? '',
            'offline_redirect_label' => $schedule['offline_redirect_label'] ?? 'Email us',
            'next_online_at' => null,
        ];

        // For Frubix-managed projects, check if Frubix agents are online
        $frubixManaged = $project->integrations['frubix_managed'] ?? null;
        if ($frubixManaged && ($frubixManaged['enabled'] ?? false)) {
            $frubixOnline = cache()->get("frubix_agent_online:{$project->id}", true);
            if (!$frubixOnline) {
                return array_merge($defaults, ['is_online' => false]);
            }
        }

        if ($mode === 'always') {
            return $defaults;
        }

        if ($mode !== 'business_hours') {
            return $defaults;
        }

        $tz = $schedule['timezone'] ?? 'America/New_York';
        try {
            $timezone = new \DateTimeZone($tz);
        } catch (\Exception $e) {
            $timezone = new \DateTimeZone('America/New_York');
        }

        $now = new \DateTime('now', $timezone);
        $todayStr = $now->format('Y-m-d');
        $dayName = strtolower($now->format('l'));
        $weekly = $schedule['weekly'] ?? [];
        $exceptions = $schedule['exceptions'] ?? [];

        // Check exceptions for today
        $todayException = null;
        foreach ($exceptions as $exc) {
            if (($exc['date'] ?? '') === $todayStr) {
                $todayException = $exc;
                break;
            }
        }

        if ($todayException && ($todayException['all_day_off'] ?? false)) {
            $offlineBehavior = $todayException['offline_behavior_override'] ?? $defaults['offline_behavior'];
            $offlineMessage = $todayException['offline_message_override'] ?? $defaults['offline_message'];
            $nextOnline = $this->findNextOnlineTime($weekly, $exceptions, $timezone, $now);
            $offlineMessage = $this->replaceMessageVariables($offlineMessage, $project, $nextOnline);
            return array_merge($defaults, [
                'is_online' => false,
                'offline_behavior' => $offlineBehavior,
                'offline_message' => $offlineMessage,
                'next_online_at' => $nextOnline?->format('c'),
            ]);
        }

        // Check weekly schedule
        $daySchedule = $weekly[$dayName] ?? null;
        if (!$daySchedule || !($daySchedule['enabled'] ?? false)) {
            $nextOnline = $this->findNextOnlineTime($weekly, $exceptions, $timezone, $now);
            $defaults['offline_message'] = $this->replaceMessageVariables($defaults['offline_message'], $project, $nextOnline);
            return array_merge($defaults, [
                'is_online' => false,
                'next_online_at' => $nextOnline?->format('c'),
            ]);
        }

        // Check if current time falls within any slot
        $slots = $daySchedule['slots'] ?? [];
        $currentTime = $now->format('H:i');
        $isOnline = false;
        foreach ($slots as $slot) {
            $start = $slot['start'] ?? '09:00';
            $end = $slot['end'] ?? '17:00';
            if ($currentTime >= $start && $currentTime < $end) {
                $isOnline = true;
                break;
            }
        }

        if ($isOnline) {
            return $defaults;
        }

        $nextOnline = $this->findNextOnlineTime($weekly, $exceptions, $timezone, $now);
        $defaults['offline_message'] = $this->replaceMessageVariables($defaults['offline_message'], $project, $nextOnline);
        return array_merge($defaults, [
            'is_online' => false,
            'next_online_at' => $nextOnline?->format('c'),
        ]);
    }

    private function findNextOnlineTime(array $weekly, array $exceptions, \DateTimeZone $timezone, \DateTime $now): ?\DateTime
    {
        $exceptionDates = [];
        foreach ($exceptions as $exc) {
            if ($exc['all_day_off'] ?? false) {
                $exceptionDates[$exc['date'] ?? ''] = true;
            }
        }

        // Scan up to 14 days forward
        for ($offset = 0; $offset <= 14; $offset++) {
            $checkDate = clone $now;
            if ($offset > 0) {
                $checkDate->modify("+{$offset} days");
                $checkDate->setTime(0, 0, 0);
            }
            $dateStr = $checkDate->format('Y-m-d');

            if (isset($exceptionDates[$dateStr])) {
                continue;
            }

            $dayName = strtolower($checkDate->format('l'));
            $daySchedule = $weekly[$dayName] ?? null;
            if (!$daySchedule || !($daySchedule['enabled'] ?? false)) {
                continue;
            }

            $slots = $daySchedule['slots'] ?? [];
            usort($slots, fn ($a, $b) => strcmp($a['start'] ?? '00:00', $b['start'] ?? '00:00'));

            foreach ($slots as $slot) {
                $start = $slot['start'] ?? '09:00';
                $slotStart = clone $checkDate;
                [$h, $m] = explode(':', $start);
                $slotStart->setTime((int)$h, (int)$m, 0);

                if ($slotStart > $now) {
                    return $slotStart;
                }
            }
        }

        return null;
    }

    private function replaceMessageVariables(string $message, Project $project, ?\DateTime $nextOnline): string
    {
        $replacements = [
            '{company_name}' => $project->name ?? '',
            '{support_email}' => $project->support_email ?? $project->email ?? '',
            '{next_available}' => $nextOnline ? $nextOnline->format('l, g:i A') : 'soon',
        ];
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    /**
     * Return config as JSON or JSONP based on callback param.
     */
    /**
     * Notify every agent who could see this chat that the customer is active right
     * now. Lets dashboards flip the chat's online indicator without polling.
     * Safe to call as a fire-and-forget — failures are logged and swallowed.
     */
    private function broadcastCustomerPresence(Chat $chat): void
    {
        if (!$chat->customer_last_seen_at) return;
        $project = $chat->project ?: ($chat->project_id ? Project::find($chat->project_id) : null);
        if (!$project) return;
        $agentIds = $project->getCompanyAgentIds()->map(fn ($id) => (string) $id)->all();
        if (empty($agentIds)) return;

        try {
            broadcast(new CustomerPresenceUpdated(
                (int) $chat->id,
                $chat->customer_last_seen_at->toIso8601String(),
                $agentIds,
            ));
        } catch (\Throwable $e) {
            \Log::warning('CustomerPresenceUpdated broadcast failed', [
                'chat_id' => $chat->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

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
            $customerId = 'cust_' . Str::uuid()->toString();
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

        // Read-only lookup. Chats are created lazily in sendMessage() once the
        // customer actually types, so we never persist ghost chats here.
        // 1) Active chat for this customer (customer resumes mid-conversation).
        $chat = Chat::where('project_id', $project->id)
            ->where('customer_id', $customerId)
            ->whereIn('status', ['active', 'waiting', 'ai_handling'])
            ->first();

        // 2) Otherwise show the most recent closed chat so returning customers
        //    still see their prior history. Reactivation happens on first new
        //    customer message, not here.
        if (!$chat) {
            $chat = Chat::where('project_id', $project->id)
                ->where('customer_id', $customerId)
                ->where('status', 'closed')
                ->orderBy('updated_at', 'desc')
                ->first();
        }

        $data = [
            'success' => true,
            'data' => [
                'chat_id' => $chat?->id,
                'customer_id' => $customerId,
                'status' => $chat?->status,
                'messages' => $chat ? $chat->messages()->orderBy('created_at')->get() : [],
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

        $location = $this->resolveLocation($request);

        return array_filter([
            'current_page' => $currentPage,
            'referrer' => $referrer ?: null,
            'referral_source' => $referralSource,
            'browser' => $browser,
            'device' => $device,
            'location' => $location,
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

    private function resolveLocation(Request $request): ?string
    {
        try {
            $ip = $request->ip();
            if (!$ip || in_array($ip, ['127.0.0.1', '::1'])) {
                return null;
            }
            $response = Http::timeout(2)->get("http://ip-api.com/json/{$ip}?fields=city,regionName,country,status");
            if ($response->ok()) {
                $data = $response->json();
                if (($data['status'] ?? '') === 'success') {
                    $parts = array_filter([$data['city'] ?? null, $data['regionName'] ?? null, $data['country'] ?? null]);
                    return implode(', ', $parts) ?: null;
                }
            }
        } catch (\Throwable $e) {
            // Silently fail — location is not critical
        }
        return null;
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
            'chat_id' => 'nullable',
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

        // Try to locate the chat: first by explicit chat_id, then by customer_id
        // (covers stale/missing chat_id from the widget after the init lookup).
        $chat = null;
        if (!empty($input['chat_id'])) {
            $chat = Chat::where('id', $input['chat_id'])
                ->where('project_id', $project->id)
                ->where('customer_id', $input['customer_id'])
                ->first();
        }
        if (!$chat) {
            $chat = Chat::where('project_id', $project->id)
                ->where('customer_id', $input['customer_id'])
                ->orderBy('updated_at', 'desc')
                ->first();
        }

        // First message from this customer — create the chat now (lazy init
        // keeps the sidebar free of chats that never got a real message).
        if (!$chat) {
            $projectOwner = User::find($project->user_id);
            $company = $projectOwner ? Company::find($projectOwner->company_id) : null;
            if ($company) {
                $plan = strtolower($company->plan ?? 'free');
                $maxChats = config("plan_limits.{$plan}.max_chats_per_month");
                if ($maxChats) {
                    $chatCount = Chat::where('project_id', $project->id)
                        ->where('created_at', '>=', now()->startOfMonth())
                        ->count();
                    if ($chatCount >= $maxChats) {
                        dispatch(function () use ($company) {
                            app(\App\Services\UsageLimitNotificationService::class)->notifyChatLimitReached($company);
                        })->afterResponse();
                        return $this->sendMessageResponse($request, [
                            'success' => false,
                            'message' => 'Monthly chat limit reached. Please contact support.',
                        ], 422);
                    }
                }
            }

            $chat = Chat::create([
                'project_id' => $project->id,
                'customer_id' => $input['customer_id'],
                'customer_email' => $request->input('customer_email'),
                'customer_name' => $request->input('customer_name'),
                'status' => 'ai_handling',
                'ai_enabled' => true,
                'priority' => 'medium',
                'metadata' => $this->buildSessionMetadata($request),
                // Seed these so the chat survives the agent sidebar's "active"
                // filter (customer_last_seen_at >= now-30s) and sorts to the
                // top (order by last_message_at desc) the moment the
                // NewChatForAgent broadcast arrives. The customer-message save
                // below refreshes both values anyway.
                'last_message_at' => now(),
                'customer_last_seen_at' => now(),
            ]);

            // Notify agents about the new chat so it appears in their list
            // before the customer message broadcast arrives.
            $agentIds = $project->getCompanyAgentIds()->map(fn ($id) => (string) $id)->all();
            if (!empty($agentIds)) {
                broadcast(new NewChatForAgent(
                    $chat->load(['project', 'agent', 'messages' => fn ($q) => $q->latest()->limit(1)]),
                    (string) $project->id,
                    $agentIds
                ))->toOthers();

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

        // Auto-reopen closed chats when customer sends a new message
        if ($chat->status === 'closed') {
            $chat->update([
                'status' => 'ai_handling',
                'ai_enabled' => true,
                'agent_id' => null,
                'follow_up_sent_at' => null,
            ]);
            ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_type' => 'system',
                'content' => 'Customer returned — chat reopened.',
            ]);
            broadcast(new \App\Events\ChatStatusUpdated($chat->id, 'ai_handling'));
        }

        try {
            $message = ChatMessage::create([
                'chat_id' => $chat->id,
                'sender_type' => 'customer',
                'sender_id' => $input['customer_id'],
                'content' => $input['message'],
                'is_ai' => false,
            ]);

            // Extract name/phone/email from customer message and update chat immediately
            $chatMeta = $chat->metadata ?? [];
            $chatUpdates = ['last_message_at' => now(), 'customer_last_seen_at' => now(), 'follow_up_sent_at' => null];
            $customerMsg = $input['message'];

            // Extract name from customer message (e.g. "Alex James", "my name is Alex", "I'm Alex")
            $notRealName = ['Guest', 'Visitor', 'Hello', 'Hi', 'Hey', 'Test', 'User', 'Customer', 'Anonymous'];
            $currentName = $chat->customer_name ?? '';
            $needsName = empty($currentName) || in_array($currentName, $notRealName, true) || strlen($currentName) <= 2;
            if ($needsName) {
                if (preg_match('/^(?:(?:my name is|i\'?m|it\'?s|this is|i am|name:?)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/i', trim($customerMsg), $nm)) {
                    $name = implode(' ', array_map('ucfirst', explode(' ', strtolower(trim($nm[1])))));
                    $exclude = ['Hello', 'Hi', 'Hey', 'Yes', 'No', 'Ok', 'Sure', 'Thanks', 'Thank', 'Please', 'Need', 'Want', 'How', 'What', 'Where', 'When', 'Why'];
                    if (strlen($name) >= 2 && strlen($name) <= 50 && !in_array($name, $exclude)) {
                        $chatUpdates['customer_name'] = $name;
                    }
                }
            }

            // Extract phone number
            if (preg_match('/\b(\+?\d[\d\s\-().]{7,15}\d)\b/', $customerMsg, $pm) && empty($chatMeta['customer_phone'])) {
                $chatMeta['customer_phone'] = preg_replace('/[^\d+]/', '', $pm[1]);
                $chatUpdates['metadata'] = $chatMeta;
            }

            // Extract email
            if (preg_match('/[\w.+-]+@[\w-]+\.[\w.]+/', $customerMsg, $em) && empty($chat->customer_email)) {
                $chatUpdates['customer_email'] = $em[0];
            }
            $chat->update($chatUpdates);
            $chat->refresh();

            broadcast(new MessageSent($message))->toOthers();
            $this->broadcastCustomerPresence($chat);

            // Forward to Frubix if this project is Frubix-managed
            $frubixManaged = $project->integrations['frubix_managed'] ?? null;
            $isFrubixManaged = $frubixManaged && ($frubixManaged['enabled'] ?? false);

            if ($isFrubixManaged) {
                try {
                    $frubixUrl = rtrim($frubixManaged['api_url'], '/');
                    $chatMeta = $chat->metadata ?? [];
                    Http::withToken($frubixManaged['api_token'])->post("{$frubixUrl}/api/linochat/messages", [
                        'sender_name'              => $chat->customer_name ?: 'Visitor',
                        'sender_email'             => $chat->customer_email,
                        'sender_phone'             => $chatMeta['customer_phone'] ?? null,
                        'sender_type'              => 'customer',
                        'message'                  => $customerMsg,
                        'channel'                  => 'linochat',
                        'source'                   => 'linochat',
                        'external_conversation_id' => (string) $chat->id,
                        'metadata'                 => [
                            'customer_name'  => $chat->customer_name,
                            'customer_email' => $chat->customer_email,
                            'customer_phone' => $chatMeta['customer_phone'] ?? null,
                            'device'         => $chatMeta['device'] ?? null,
                            'browser'        => $chatMeta['browser'] ?? null,
                            'location'       => $chatMeta['location'] ?? $chatMeta['city'] ?? null,
                            'referrer'       => $chatMeta['referrer'] ?? null,
                            'current_page'   => $chatMeta['current_page'] ?? null,
                        ],
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to forward message to Frubix', ['error' => $e->getMessage()]);
                }
            }

            $aiResponse = null;
            $chat->refresh(); // Ensure we have latest agent_id/status (agent may have taken over)
            // Never use AI when an agent has taken over (agent_id is set) or AI is disabled
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

            // Forward AI response to Frubix so the full conversation is mirrored
            if ($isFrubixManaged && $aiResponse && !empty($aiResponse['content'])) {
                try {
                    $frubixUrl = rtrim($frubixManaged['api_url'], '/');
                    Http::withToken($frubixManaged['api_token'])->post("{$frubixUrl}/api/linochat/messages", [
                        'sender_name'              => 'LinoChat AI',
                        'sender_type'              => 'agent',
                        'message'                  => $aiResponse['content'],
                        'channel'                  => 'linochat',
                        'source'                   => 'linochat',
                        'external_conversation_id' => (string) $chat->id,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to forward AI response to Frubix', ['error' => $e->getMessage()]);
                }
            }

            $data = [
                'success' => true,
                'data' => [
                    'chat_id' => $chat->id,
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
                'message' => 'Server error. Please try again.',
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

        $data = [
            'success' => true,
            'data' => [
                'messages' => $messages,
                'status' => $chat->status,
                'agent_name' => $agentName,
            ],
        ];

        $callback = $request->query('callback');
        if ($callback && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $callback)) {
            return response($callback . '(' . json_encode($data) . ');', 200)
                ->header('Content-Type', 'application/javascript; charset=utf-8')
                ->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json($data);
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
     * Customer heartbeat — widget calls this every ~15s to signal the customer is still online.
     */
    public function heartbeat(Request $request, string $widget_id)
    {
        $chatId = $request->input('chat_id') ?? $request->query('chat_id');
        $customerId = $request->input('customer_id') ?? $request->query('customer_id');

        if (!$chatId || !$customerId) {
            return response()->json(['success' => false], 422);
        }

        $chat = Chat::where('id', $chatId)
            ->where('customer_id', $customerId)
            ->whereHas('project', fn ($q) => $q->where('widget_id', $widget_id))
            ->first();

        if (!$chat) {
            return response()->json(['success' => false], 404);
        }

        $updates = ['customer_last_seen_at' => now()];

        // Update current page if provided
        $currentPage = $request->input('current_page') ?? $request->query('current_page');
        if ($currentPage) {
            $metadata = $chat->metadata ?? [];
            $metadata['current_page'] = $currentPage;
            $updates['metadata'] = $metadata;
        }

        $chat->update($updates);
        $chat->refresh();
        $this->broadcastCustomerPresence($chat);

        return response()->json(['success' => true]);
    }

    /**
     * Track page view — widget sends this when visitor navigates to a new page.
     */
    public function pageView(Request $request, string $widget_id)
    {
        $chatId = $request->input('chat_id');
        $customerId = $request->input('customer_id');
        $pageUrl = $request->input('page_url');
        $pageTitle = $request->input('page_title', '');

        if (!$chatId || !$customerId || !$pageUrl) {
            return response()->json(['success' => false], 422);
        }

        $chat = Chat::where('id', $chatId)
            ->where('customer_id', $customerId)
            ->whereHas('project', fn ($q) => $q->where('widget_id', $widget_id))
            ->first();

        if (!$chat) {
            return response()->json(['success' => false], 404);
        }

        $metadata = $chat->metadata ?? [];
        $metadata['current_page'] = $pageUrl;

        $pagesVisited = $metadata['pages_visited'] ?? [];
        $pagesVisited[] = [
            'url' => $pageUrl,
            'title' => $pageTitle,
            'timestamp' => now()->toIso8601String(),
        ];
        // Keep last 50 entries
        if (count($pagesVisited) > 50) {
            $pagesVisited = array_slice($pagesVisited, -50);
        }
        $metadata['pages_visited'] = $pagesVisited;

        $chat->update([
            'metadata' => $metadata,
            'customer_last_seen_at' => now(),
        ]);
        $chat->refresh();
        $this->broadcastCustomerPresence($chat);

        return response()->json(['success' => true]);
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

        // Persist a notification for all project agents (company-scoped)
        $project = Project::find($chat->project_id);
        if ($project) {
            $agentIds = $project->getCompanyAgentIds();
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
            'phone' => 'nullable|string|max:50',
            'service_address' => 'nullable|string|max:500',
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
            $request->input('name'),
            $request->input('phone'),
            $request->input('service_address')
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

    /**
     * Save customer feedback on an AI message (thumbs up/down).
     */
    public function messageFeedback(Request $request, string $widget_id)
    {
        $validator = Validator::make($request->all(), [
            'message_id' => 'required|string',
            'customer_id' => 'required|string',
            'feedback' => 'required|string|in:positive,negative',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false], 422);
        }

        $project = Project::where('widget_id', $widget_id)->first();
        if (!$project) {
            return response()->json(['success' => false], 404);
        }

        $message = ChatMessage::where('id', $request->input('message_id'))
            ->where('is_ai', true)
            ->whereHas('chat', fn ($q) => $q->where('project_id', $project->id)
                ->where('customer_id', $request->input('customer_id')))
            ->first();

        if (!$message) {
            return response()->json(['success' => false], 404);
        }

        $message->update(['feedback' => $request->input('feedback')]);

        return response()->json(['success' => true]);
    }
}
