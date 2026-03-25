@extends('emails.layout', ['subject' => 'Welcome to LinoChat'])

@section('content')
<h1>Welcome to LinoChat! 🎉</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

<p>Thank you for joining LinoChat! We're excited to help you provide exceptional customer support with AI-powered assistance.</p>

<div class="info-box">
  <h3>What's included:</h3>
  <ul class="feature-list">
    <li>AI-powered chat widget for your website</li>
    <li>Automatic website analysis & Knowledge Base</li>
    <li>Real-time messaging with WebSocket</li>
    <li>Agent dashboard for managing conversations</li>
    <li>Support ticket system with email integration</li>
    <li>Customizable widget appearance</li>
  </ul>
</div>

<div style="text-align: center;">
  <a href="{{ $dashboardUrl }}" class="btn">Go to Dashboard</a>
</div>

<p>Your project <strong>{{ $project->name }}</strong> has been created and your website has been analyzed. You can now customize your widget, get your embed code, and invite team members.</p>
@endsection
