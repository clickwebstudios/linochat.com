@extends('emails.layout', ['subject' => 'Verify Your Email'])

@section('content')
<h1>Verify Your Email</h1>
<p class="greeting">Hello,</p>

<p>Thank you for signing up for LinoChat! Enter the verification code below to confirm your email address:</p>

<div class="code-box">
  <div class="code">{{ $code }}</div>
</div>

<p style="font-size: 13px; color: #9ca3af;">This code will expire in <strong>15 minutes</strong>. If you didn't create a LinoChat account, you can safely ignore this email.</p>
@endsection
