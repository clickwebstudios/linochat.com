<?php

namespace App\Enums;

enum ChatStatus: string
{
    case Active     = 'active';
    case Waiting    = 'waiting';
    case AiHandling = 'ai_handling';
    case Offline    = 'offline';
    case Closed     = 'closed';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
