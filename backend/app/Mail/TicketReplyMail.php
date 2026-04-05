<?php
namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public string $replyText,
        public string $replierName,
        public string $replyToAddress = '',
        public string $fromName = 'Support Team',
    ) {
        if (empty($this->replyToAddress)) {
            $this->replyToAddress = env('INBOUND_EMAIL_ADDRESS', config('mail.from.address'));
        }
    }

    public function envelope(): Envelope
    {
        $ref = $this->ticket->ticket_number ?? ('TKT-' . $this->ticket->id);
        return new Envelope(
            subject: 'Re: [' . $ref . '] ' . $this->ticket->subject,
            replyTo: [new Address($this->replyToAddress, $this->fromName)],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket-reply',
        );
    }
}
