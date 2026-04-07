@extends('emails.layout', ['subject' => 'Subscription Reactivated'])

@section('content')
<h1>Welcome back! 🎉</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

<p>Your <strong>{{ $planName }} plan</strong> subscription has been reactivated. All your features are restored and ready to use.</p>

<div class="info-box-accent">
  <h3>Your plan is active</h3>
  @if($subscription->plan && is_array($subscription->plan->features))
  <ul class="feature-list" style="margin-top: 12px;">
    @foreach(array_slice($subscription->plan->features, 0, 5) as $feature)
      <li>{{ $feature }}</li>
    @endforeach
  </ul>
  @endif
</div>

<p>Any agents or resources that were deactivated during your Free period have been restored.</p>

<div style="text-align: center; margin: 24px 0;">
  <a href="{{ $billingUrl }}" class="btn">Go to Billing</a>
</div>

<p>Thank you for continuing with LinoChat. We're glad to have you back!</p>
@endsection
