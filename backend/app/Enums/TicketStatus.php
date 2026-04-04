<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open       = 'open';
    case InProgress = 'in_progress';
    case Waiting    = 'waiting';
    case Resolved   = 'resolved';
    case Closed     = 'closed';
    case Pending    = 'pending';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
