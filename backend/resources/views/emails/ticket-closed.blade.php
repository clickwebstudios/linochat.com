@extends('emails.layout')

@section('content')
  <h1>Ticket Resolved ✅</h1>
  <p>Great news! Your support ticket has been marked as <strong>resolved</strong>.</p>

  <table class="meta-table">
    <tr><td>Ticket #</td><td><strong>#{{ $ticket->id }}</strong></td></tr>
    <tr><td>Subject</td><td>{{ $ticket->subject }}</td></tr>
    @if($ticket->customer_name)
    <tr><td>Customer</td><td>{{ $ticket->customer_name }}</td></tr>
    @endif
    @if($ticket->assignedTo)
    <tr><td>Resolved by</td><td>{{ $ticket->assignedTo->name }}</td></tr>
    @endif
    <tr><td>Closed at</td><td>{{ now()->format('M d, Y · H:i') }}</td></tr>
  </table>

  <p>If your issue is not fully resolved, you can reopen this ticket or submit a new one.</p>

  <p style="text-align:center;margin-top:8px;">
    <a href="{{ config('app.url') }}/admin/tickets/{{ $ticket->id }}" class="btn">View Ticket</a>
    &nbsp;
    <a href="{{ config('app.url') }}/admin/tickets/new" class="btn-outline">Open New Ticket</a>
  </p>

  <hr class="divider" />
  <p style="font-size:13px;color:#6b7280;">
    Was your issue fully resolved? We'd love to hear your feedback. Reply to this email with any comments.
  </p>
@endsection
