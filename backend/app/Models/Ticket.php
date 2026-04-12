<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'chat_id',
        'assigned_to',
        'customer_email',
        'customer_name',
        'subject',
        'description',
        'status',
        'priority',
        'category',
        'resolved_at',
        'ticket_number',
        'access_token',
        'customer_phone',
        'service_address',
        'source',
    ];

    protected static function booted(): void
    {
        static::created(function (Ticket $ticket) {
            $updates = [];
            if (empty($ticket->ticket_number)) {
                $year = now()->year;
                $updates['ticket_number'] = 'TKT-' . $year . '-' . str_pad($ticket->id, 5, '0', STR_PAD_LEFT);
            }
            if (empty($ticket->access_token)) {
                $updates['access_token'] = Str::random(48);
            }
            if (!empty($updates)) {
                $ticket->updateQuietly($updates);
            }
        });
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class);
    }
}
