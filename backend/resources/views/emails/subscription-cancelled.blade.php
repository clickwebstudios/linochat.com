@extends('emails.layout', ['subject' => 'Subscription Cancelled'])

@section('content')
<h1>Subscription Cancelled</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

<p>We've received your cancellation request. Your <strong>{{ $planName }} plan</strong> will remain fully active until your billing period ends.</p>

<div class="info-box-accent">
  <table class="meta-table" style="margin-bottom:0;">
    <tr>
      <td>Plan</td>
      <td>{{ $planName }}</td>
    </tr>
    <tr>
      <td>Active until</td>
      <td><strong>{{ $endsAt ? \Carbon\Carbon::parse($endsAt)->format('F j, Y') : 'end of billing period' }}</strong></td>
    </tr>
    <tr>
      <td>After that</td>
      <td>Downgraded to Free</td>
    </tr>
  </table>
</div>

<p>Before your subscription ends, you can choose which agents, workspaces, and knowledge articles to keep within the Free plan limits.</p>

<div style="text-align: center; margin: 24px 0;">
  <a href="{{ $selectionUrl }}" class="btn">Choose What to Keep</a>
</div>

<div class="info-box">
  <h3>Free plan includes:</h3>
  <ul class="feature-list">
    <li>1 agent</li>
    <li>100 AI tokens / month</li>
    <li>Basic chat widget</li>
    <li>Email support</li>
  </ul>
</div>

<hr class="divider">

<p>Changed your mind? You can reactivate your subscription at any time before the expiry date.</p>

<div style="text-align: center;">
  <a href="{{ $billingUrl }}" class="btn-outline">Reactivate Subscription</a>
</div>
@endsection
