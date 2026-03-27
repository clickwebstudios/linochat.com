@extends('emails.layout', ['subject' => 'Ticket Resolved: ' . $ticket->subject])

@section('content')
<h1>Ticket Resolved ✅</h1>
<p class="greeting">Hello {{ $ticket->customer_name ?? 'there' }},</p>

<p>Great news! Your support ticket has been marked as <strong>resolved</strong>.</p>

<table class="meta-table">
  <tr><td>Ticket</td><td><strong>{{ $ticket->ticket_number ?? '#' . $ticket->id }}</strong></td></tr>
  <tr><td>Subject</td><td>{{ $ticket->subject }}</td></tr>
  @if($ticket->assignedTo)
  <tr><td>Resolved by</td><td>{{ $ticket->assignedTo->name }}</td></tr>
  @endif
  <tr><td>Closed at</td><td>{{ now()->format('M d, Y · H:i') }}</td></tr>
</table>

<p>If your issue is not fully resolved, you can reopen this ticket or contact us again.</p>

<hr class="divider" />
<p style="font-size: 13px; color: #9ca3af;">Was your issue fully resolved? We'd love to hear your feedback — just reply to this email.</p>
@endsection
