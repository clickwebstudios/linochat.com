@extends('emails.layout', ['subject' => 'Subscription Expiring Soon'])

@section('content')
<h1>Your subscription expires in 7 days</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

<p>This is a reminder that your <strong>{{ $planName }} plan</strong> subscription will expire on <strong>{{ $endsAt ? \Carbon\Carbon::parse($endsAt)->format('F j, Y') : 'soon' }}</strong>. After that, your account will be downgraded to the Free plan.</p>

<div class="info-box" style="border-left: 4px solid #f59e0b; background: #fffbeb;">
  <h3 style="color: #92400e;">What you'll lose on Free:</h3>
  <ul class="feature-list">
    @if($subscription->plan && is_array($subscription->plan->features))
      @foreach(array_slice($subscription->plan->features, 0, 5) as $feature)
        <li>{{ $feature }}</li>
      @endforeach
    @else
      <li>Additional agents beyond 1</li>
      <li>Unlimited chats & tickets</li>
      <li>Advanced analytics</li>
      <li>Priority support</li>
    @endif
  </ul>
</div>

<p>You can choose which agents, workspaces, and knowledge articles to keep before your subscription expires.</p>

<div style="text-align: center; margin: 24px 0;">
  <a href="{{ $selectionUrl }}" class="btn">Choose What to Keep</a>
</div>

<hr class="divider">

<p>Want to keep everything? Reactivate your subscription before <strong>{{ $endsAt ? \Carbon\Carbon::parse($endsAt)->format('F j, Y') : 'the expiry date' }}</strong>.</p>

<div style="text-align: center;">
  <a href="{{ $billingUrl }}" class="btn-outline">Reactivate Now</a>
</div>
@endsection
