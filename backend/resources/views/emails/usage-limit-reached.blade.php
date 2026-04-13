@extends('emails.layout', ['subject' => "You've " . ($threshold === 'reached' ? 'reached your' : 'used 80% of your') . ' ' . strtolower($limitLabel) . ' limit'])

@section('content')
<h1>{{ $threshold === 'reached' ? 'You\'ve hit your ' . $limitLabel . ' limit' : 'You\'re approaching your ' . $limitLabel . ' limit' }}</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

@if($threshold === 'reached')
<p>Your <strong>{{ ucfirst($company->plan) }} plan</strong> has reached its <strong>{{ $limitLabel }}</strong> limit. Some features may be restricted until your next billing cycle or until you upgrade your plan.</p>
@else
<p>You've used <strong>{{ $usageData['percentage'] }}%</strong> of your <strong>{{ $limitLabel }}</strong> allowance on the <strong>{{ ucfirst($company->plan) }} plan</strong>. Consider upgrading to avoid any disruption.</p>
@endif

<table class="meta-table">
  <tr>
    <td>Resource</td>
    <td>{{ $limitLabel }}</td>
  </tr>
  <tr>
    <td>Current usage</td>
    <td><strong>{{ number_format($usageData['current']) }}</strong> / {{ number_format($usageData['limit']) }}</td>
  </tr>
  <tr>
    <td>Plan</td>
    <td>{{ ucfirst($company->plan) }}</td>
  </tr>
  <tr>
    <td>Status</td>
    <td><span class="badge {{ $threshold === 'reached' ? 'badge-high' : 'badge-medium' }}">{{ $threshold === 'reached' ? 'Limit Reached' : 'Approaching Limit' }}</span></td>
  </tr>
</table>

<div style="text-align: center; margin: 24px 0;">
  <a href="{{ $billingUrl }}" class="btn">Upgrade Your Plan</a>
</div>

<hr class="divider">

<div class="info-box">
  <h3>What you get with {{ $nextPlanFeatures['plan'] }}:</h3>
  <ul class="feature-list">
    @foreach($nextPlanFeatures['features'] as $feature)
      <li>{{ $feature }}</li>
    @endforeach
  </ul>
</div>

<p style="font-size: 13px; color: #6b7280;">If you have questions about your plan or usage, visit your <a href="{{ $billingUrl }}" style="color: #2563eb;">billing dashboard</a> or contact our support team.</p>
@endsection
