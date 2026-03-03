@extends('emails.layout')

@section('content')
  <h1>New Reply on Ticket #{{ $ticket->id }}</h1>
  <p><strong>{{ $replierName }}</strong> left a new reply on your ticket:</p>
  <p style="font-size:14px;color:#6b7280;"><strong>{{ $ticket->subject }}</strong></p>

  <div class="reply-box">
    <p>{{ $replyText }}</p>
  </div>

  <table class="meta-table">
    <tr><td>Ticket #</td><td>#{{ $ticket->id }}</td></tr>
    <tr><td>Subject</td><td>{{ $ticket->subject }}</td></tr>
    <tr>
      <td>Status</td>
      <td>
        <span class="badge badge-{{ $ticket->status }}">{{ ucfirst($ticket->status) }}</span>
      </td>
    </tr>
    <tr><td>Updated</td><td>{{ $ticket->updated_at->format('M d, Y · H:i') }}</td></tr>
  </table>

  <p style="text-align:center;">
    <a href="{{ config('app.url') }}/admin/tickets/{{ $ticket->id }}" class="btn">View Full Conversation →</a>
  </p>

  <hr class="divider" />
  <p style="font-size:13px;color:#6b7280;">
    You're receiving this because you are associated with ticket #{{ $ticket->id }}.
  </p>
@endsection
