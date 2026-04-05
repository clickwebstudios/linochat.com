<?php
namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Company;
use App\Services\TokenService;
use App\Services\TwilioService;
use App\Enums\TokenActionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TwilioWebhookController extends Controller
{
    public function __construct(
        private TwilioService $twilioService,
        private TokenService $tokenService,
    ) {}

    /**
     * Handle incoming Twilio Conversations webhook.
     * Route: POST /webhooks/twilio/{subaccount_sid}
     */
    public function handle(Request $request, string $subaccount_sid): \Illuminate\Http\JsonResponse
    {
        // 1. Find company by subaccount SID
        $company = Company::where('twilio_subaccount_sid', $subaccount_sid)->first();
        if (!$company) {
            Log::warning('Twilio webhook: unknown subaccount_sid', ['sid' => $subaccount_sid]);
            return response()->json(['error' => 'Unknown subaccount'], 404);
        }

        // 2. Verify Twilio signature (use subaccount auth token)
        $signature = $request->header('X-Twilio-Signature', '');
        $url = $request->fullUrl();
        $params = $request->all();
        $authToken = $company->twilio_auth_token ? decrypt($company->twilio_auth_token) : null;

        if (config('app.env') !== 'local' && !$this->twilioService->validateWebhookSignature($url, $params, $signature, $authToken)) {
            Log::warning('Twilio webhook: invalid signature', ['company_id' => $company->id]);
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        // 3. Parse Twilio Conversations event
        $eventType = $request->input('EventType');
        if ($eventType !== 'onMessageAdded') {
            // Only handle new messages; acknowledge other events silently
            return response()->json(['success' => true]);
        }

        $conversationSid = $request->input('ConversationSid');
        $author = $request->input('Author');        // phone number or page-scoped ID
        $body = $request->input('Body', '');
        $channelType = $this->detectChannel($request);

        // 4. Find or create Chat for this conversation
        $chat = Chat::firstOrCreate(
            ['customer_id' => $conversationSid, 'project_id' => $this->getDefaultProjectId($company)],
            [
                'channel'       => $channelType,
                'customer_name' => $author,
                'status'        => 'active',
                'ai_enabled'    => true,
            ]
        );

        // 5. Create the ChatMessage
        $message = ChatMessage::create([
            'chat_id'     => $chat->id,
            'sender_type' => 'customer',
            'sender_id'   => $author,
            'content'     => $body,
            'is_ai'       => false,
            'metadata'    => ['twilio_conversation_sid' => $conversationSid, 'channel' => $channelType],
        ]);

        // Update chat last_message_at
        $chat->update(['last_message_at' => now()]);

        // 6. Deduct tokens for inbound message (whatsapp = whatsapp_service, messenger = messenger)
        $actionType = $channelType === 'whatsapp' ? TokenActionType::WhatsAppService : TokenActionType::Messenger;
        $this->tokenService->deduct($company, $actionType, $conversationSid);

        // 7. Broadcast to agent dashboard
        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['success' => true]);
    }

    private function detectChannel(Request $request): string
    {
        $channelSid = $request->input('ChannelSid', '');
        $source = $request->input('Source', '');
        if (str_contains(strtolower($source), 'whatsapp') || str_contains(strtolower($channelSid), 'whatsapp')) {
            return 'whatsapp';
        }
        if (str_contains(strtolower($source), 'messenger') || str_contains(strtolower($channelSid), 'messenger')) {
            return 'messenger';
        }
        return 'messenger'; // default for Twilio Conversations inbound
    }

    private function getDefaultProjectId(Company $company): int
    {
        // Find the first admin user belonging to this company
        $adminUser = $company->users()->where('role', 'admin')->first();

        if ($adminUser) {
            $project = $adminUser->ownedProjects()->where('status', 'active')->first();
            if ($project) {
                return $project->id;
            }
        }

        // Fallback: any active project owned by any user in this company
        $anyUser = $company->users()->first();
        if ($anyUser) {
            $project = $anyUser->ownedProjects()->where('status', 'active')->first();
            if ($project) {
                return $project->id;
            }
        }

        return 1;
    }
}
