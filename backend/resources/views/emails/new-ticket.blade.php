@extends('emails.layout')

@section('content')
  <h1>New Support Ticket</h1>
  <p>A new ticket has been submitted{!! $ticket->project ? ' for project <strong>' . e($ticket->project->name) . '</strong>' : '' !!}.</p>

  <table class="meta-table">
    <tr><td>Ticket #</td><td><strong>#{{ $ticket->id }}</strong></td></tr>
    <tr><td>Subject</td><td>{{ $ticket->subject }}</td></tr>
    <tr>
      <td>Priority</td>
      <td>
        <span class="badge badge-{{ $ticket->priority ?? 'medium' }}">
          {{ ucfirst($ticket->priority ?? 'medium') }}
        </span>
      </td>
    </tr>
    <tr>
      <td>Status</td>
      <td>
        <span class="badge badge-{{ $ticket->status ?? 'open' }}">
          {{ ucfirst($ticket->status ?? 'open') }}
        </span>
      </td>
    </tr>
    @if($ticket->customer_name)
    <tr><td>Customer</td><td>{{ $ticket->customer_name }}{{ $ticket->customer_email ? ' (' . $ticket->customer_email . ')' : '' }}</td></tr>
    @endif
    @if($ticket->assignedTo)
    <tr><td>Assigned To</td><td>{{ $ticket->assignedTo->name }}</td></tr>
    @endif
    <tr><td>Created</td><td>{{ $ticket->created_at->format('M d, Y · H:i') }}</td></tr>
  </table>

  @if($ticket->description)
  <p><strong>Description:</strong></p>
  <div class="reply-box">
    <p>{!! nl2br(e($ticket->description)) !!}</p>
  </div>
  @endif

  <p style="text-align:center;">
    <a href="{{ config('app.url') }}/admin/tickets/{{ $ticket->id }}" class="btn">View Ticket →</a>
  </p>
@endsection
