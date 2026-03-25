@extends('emails.layout', ['subject' => '[' . ($ticket->ticket_number ?? 'TKT-' . $ticket->id) . '] Support Ticket Created'])

@section('content')
<h1>Support Ticket Created</h1>
<p class="greeting">Hello {{ $ticket->customer_name ?? 'there' }},</p>

<p>Thank you for contacting us. We've received your request and created a support ticket.</p>

<div class="info-box-accent">
  <table class="meta-table">
    <tr><td>Ticket ID</td><td><strong>{{ $ticket->ticket_number ?? ('TKT-' . $ticket->id) }}</strong></td></tr>
    <tr><td>Subject</td><td>{{ $ticket->subject }}</td></tr>
    <tr><td>Priority</td><td><span class="badge badge-{{ strtolower($ticket->priority) }}">{{ ucfirst($ticket->priority) }}</span></td></tr>
    <tr><td>Status</td><td><span class="badge badge-open">{{ ucfirst($ticket->status) }}</span></td></tr>
  </table>
</div>

<p>Our support team will review your request and get back to you as soon as possible.</p>

<div style="text-align: center;">
  <a href="{{ $ticketUrl }}" class="btn">View Ticket</a>
</div>
@endsection
