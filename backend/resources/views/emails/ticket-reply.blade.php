@extends('emails.layout', ['subject' => 'Re: [' . ($ticket->ticket_number ?? '#' . $ticket->id) . '] ' . $ticket->subject])

@section('content')
<h1>New Reply on Your Ticket</h1>
<p class="greeting">Hello,</p>

<p><strong>{{ $replierName }}</strong> replied to your ticket:</p>

<div class="reply-box">
  <p>{{ $replyText }}</p>
</div>

<table class="meta-table">
  <tr><td>Ticket</td><td><strong>{{ $ticket->ticket_number ?? '#' . $ticket->id }}</strong></td></tr>
  <tr><td>Subject</td><td>{{ $ticket->subject }}</td></tr>
  <tr><td>Status</td><td><span class="badge badge-{{ $ticket->status }}">{{ ucfirst($ticket->status) }}</span></td></tr>
</table>

<div style="text-align: center;">
  <a href="{{ config('app.frontend_url', 'https://linochat.com') }}/ticket/{{ $ticket->access_token }}" class="btn">View Conversation</a>
</div>

<p style="font-size: 13px; color: #9ca3af;">You're receiving this because you are associated with this ticket.</p>
@endsection
