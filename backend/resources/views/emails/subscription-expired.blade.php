@extends('emails.layout', ['subject' => 'Subscription Expired'])

@section('content')
<h1>Your subscription has expired</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

<p>Your LinoChat subscription has expired and your account has been downgraded to the <strong>Free plan</strong>.</p>

<div class="info-box">
  <h3>Your Free plan includes:</h3>
  <ul class="feature-list">
    <li>1 agent</li>
    <li>100 AI tokens / month</li>
    <li>Basic chat widget</li>
    <li>Email support</li>
    <li>7-day chat history</li>
  </ul>
</div>

<p>Your data is safe and will be retained. Agents and resources beyond the Free plan limits have been deactivated. They will be restored when you resubscribe.</p>

<hr class="divider">

<p>Ready to get back? Choose a plan that fits your needs and resume where you left off.</p>

<div style="text-align: center; margin: 24px 0;">
  <a href="{{ $billingUrl }}" class="btn">Resubscribe Now</a>
</div>

<p style="text-align: center; font-size: 13px; color: #9ca3af;">Questions? Reply to this email or visit our <a href="https://linochat.com/help" style="color: #2563eb;">Help Center</a>.</p>
@endsection
