<?php
namespace App\Events;
use App\Models\Ticket;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusUpdated implements ShouldBroadcast {
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Ticket $ticket) {}

    public function broadcastOn(): array {
        return [new PrivateChannel('tickets')];
    }

    public function broadcastWith(): array {
        return [
            'ticket_id' => $this->ticket->id,
            'status' => $this->ticket->status,
            'priority' => $this->ticket->priority,
        ];
    }
}
