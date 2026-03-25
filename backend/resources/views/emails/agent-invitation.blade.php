@extends('emails.layout', ['subject' => "You're Invited to LinoChat"])

@section('content')
<h1>You're Invited! 🤝</h1>
<p class="greeting">Hello,</p>

<p>You've been invited to join <strong>{{ $project->name }}</strong> as a support agent on LinoChat.</p>

<p>LinoChat is an AI-powered customer support platform that helps you manage customer conversations efficiently.</p>

<div style="text-align: center;">
  <a href="{{ $inviteUrl }}" class="btn">Accept Invitation</a>
</div>

<p>Or copy and paste this link into your browser:</p>
<div class="url-box">{{ $inviteUrl }}</div>

<p style="font-size: 13px; color: #9ca3af;">This invitation will expire in <strong>7 days</strong>. If you didn't expect this invitation, you can safely ignore this email.</p>
@endsection
