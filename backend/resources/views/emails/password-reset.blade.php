@extends('emails.layout', ['subject' => 'Reset Your Password'])

@section('content')
<h1>Password Reset</h1>
<p class="greeting">Hello {{ $user->first_name ?? 'there' }},</p>

<p>We received a request to reset the password for your LinoChat account. Click the button below to create a new password:</p>

<div style="text-align: center;">
  <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
</div>

<p>Or copy and paste this link into your browser:</p>
<div class="url-box">{{ $resetUrl }}</div>

<hr class="divider" />

<p style="font-size: 13px; color: #9ca3af;">This link will expire in <strong>60 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
@endsection
