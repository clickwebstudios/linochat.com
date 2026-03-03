@extends('emails.layout')

@section('content')
  <h1>You've been invited to LinoChat</h1>
  <p>
    <strong>{{ $inviterName }}</strong> has invited you to join <strong>{{ $companyName }}</strong>'s support team on LinoChat as a <strong>{{ $role }}</strong>.
  </p>

  <table class="meta-table">
    <tr><td>Company</td><td>{{ $companyName }}</td></tr>
    <tr><td>Role</td><td>{{ $role }}</td></tr>
    <tr><td>Invited by</td><td>{{ $inviterName }}</td></tr>
    <tr><td>Expires</td><td>{{ now()->addDays(7)->format('M d, Y') }}</td></tr>
  </table>

  <p>Click the button below to accept the invitation and set up your account. This link expires in <strong>7 days</strong>.</p>

  <p style="text-align:center;">
    <a href="{{ config('app.url') }}/signup?invite={{ $inviteToken }}" class="btn">Accept Invitation →</a>
  </p>

  <hr class="divider" />
  <p style="font-size:13px;color:#6b7280;">
    If you weren't expecting this invitation, you can safely ignore this email.<br>
    This invite was sent by {{ $inviterName }} from {{ $companyName }}.
  </p>
@endsection
