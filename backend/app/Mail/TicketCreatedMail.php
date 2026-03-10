<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $ticket;
    public $projectName;
    public $ticketUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Ticket $ticket, string $projectName, string $ticketUrl)
    {
        $this->ticket = $ticket;
        $this->projectName = $projectName;
        $this->ticketUrl = $ticketUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $ref      = $this->ticket->ticket_number ?? ('TKT-' . $this->ticket->id);
        $replyTo  = env('INBOUND_EMAIL_ADDRESS', 'linochat.tickets@gmail.com');
        return new Envelope(
            subject: "[{$ref}] Support Ticket Created - {$this->ticket->subject}",
            replyTo: [new Address($replyTo, $this->projectName . ' Support')],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket-created',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
