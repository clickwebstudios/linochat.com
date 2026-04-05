<?php

namespace App\Enums;

enum TokenActionType: string
{
    case MonthlyGrant      = 'monthly_grant';
    case Rollover          = 'rollover';
    case Expiry            = 'expiry';
    case TopUp             = 'topup';
    case Messenger         = 'messenger';
    case WhatsAppService   = 'whatsapp_service';
    case WhatsAppUtility   = 'whatsapp_utility';
    case WhatsAppMarketing = 'whatsapp_marketing';
    case AiReply           = 'ai_reply';
    case AiResolution      = 'ai_resolution';

    public function tokenCost(): int
    {
        return match($this) {
            self::Messenger, self::WhatsAppService, self::AiReply => 1,
            self::WhatsAppUtility => 8,
            self::WhatsAppMarketing => 18,
            self::AiResolution => 5,
            // grants/credits have no cost
            default => 0,
        };
    }

    public function isDebit(): bool
    {
        return in_array($this, [
            self::Messenger, self::WhatsAppService, self::WhatsAppUtility,
            self::WhatsAppMarketing, self::AiReply, self::AiResolution,
        ]);
    }
}
