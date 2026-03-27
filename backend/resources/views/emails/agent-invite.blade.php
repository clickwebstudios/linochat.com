@extends('emails.layout', ['subject' => "You've been invited to join " . $companyName])

@section('content')
<h1>You're Invited! 🤝</h1>
<p class="greeting">Hello,</p>

<p><strong>{{ $inviterName }}</strong> has invited you to join <strong>{{ $companyName }}</strong>'s support team on LinoChat as a <strong>{{ $role }}</strong>.</p>

<table class="meta-table">
  <tr><td>Company</td><td>{{ $companyName }}</td></tr>
  <tr><td>Role</td><td>{{ $role }}</td></tr>
  <tr><td>Invited by</td><td>{{ $inviterName }}</td></tr>
  <tr><td>Expires</td><td>{{ now()->addDays(7)->format('M d, Y') }}</td></tr>
</table>

<div style="text-align: center;">
  <a href="{{ config('app.frontend_url', 'https://linochat.com') }}/signup?invite={{ $inviteToken }}" class="btn">Accept Invitation</a>
</div>

<p style="font-size: 13px; color: #9ca3af;">This link expires in <strong>7 days</strong>. If you didn't expect this invitation, you can safely ignore this email.</p>
@endsection
