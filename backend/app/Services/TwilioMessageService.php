<?php

namespace App\Services;

use App\Enums\TokenActionType;
use App\Models\Chat;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class TwilioMessageService
{
    public function __construct(
        private TwilioService $twilioService,
        private TokenService $tokenService,
    ) {}

    /**
     * Send an outbound message via Twilio Conversations for non-web chats.
     * Returns false if tokens insufficient or Twilio fails.
     */
    public function send(Chat $chat, string $content, User $sender): bool
    {
        // Web channel: not handled by Twilio
        if ($chat->channel === 'web') {
            return true;
        }

        $company = $this->getCompanyForChat($chat);
        if (!$company) {
            Log::error('TwilioMessageService: could not resolve company for chat', ['chat_id' => $chat->id]);
            return false;
        }

        // Determine token action type
        $actionType = match($chat->channel) {
            'whatsapp' => TokenActionType::WhatsAppService,
            'messenger' => TokenActionType::Messenger,
            default => TokenActionType::Messenger,
        };

        // Check balance
        if (!$this->tokenService->canAfford($company, $actionType)) {
            Log::warning('Insufficient token balance for outbound message', [
                'company_id' => $company->id,
                'chat_id'    => $chat->id,
                'channel'    => $chat->channel,
            ]);
            return false;
        }

        // Send via Twilio
        $client = $this->twilioService->getSubaccountClient($company);
        if (!$client) {
            Log::error('TwilioMessageService: no Twilio client for company', ['company_id' => $company->id]);
            return false;
        }

        try {
            // customer_id on the chat stores the Twilio ConversationSid for non-web chats
            $client->conversations->v1->conversations($chat->customer_id)
                ->messages
                ->create(['author' => 'system', 'body' => $content]);

            // Deduct tokens after successful send
            $this->tokenService->deduct($company, $actionType, $chat->customer_id);

            return true;
        } catch (\Throwable $e) {
            Log::error('TwilioMessageService: send failed', [
                'chat_id' => $chat->id,
                'error'   => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function getCompanyForChat(Chat $chat): ?Company
    {
        // Load project → owner → company
        $project = $chat->project()->first();
        if (!$project) return null;

        $owner = $project->owner()->first();
        if (!$owner) return null;

        return Company::whereHas('users', function ($q) use ($owner) {
            $q->where('users.id', $owner->id);
        })->first();
    }
}
