@extends('emails.layout', ['subject' => 'Account Paused'])

@section('content')
<h1>Your LinoChat account has been paused</h1>
<p class="greeting">Hello {{ $user->first_name }},</p>

<p>Your LinoChat account has been paused by an administrator. While your account is paused, the chat widget is disabled on all of your websites and your team cannot sign in to the dashboard.</p>

<div class="info-box" style="border-left: 4px solid #f59e0b; background: #fffbeb;">
  <p style="margin: 0; color: #92400e;"><strong>Your data is safe.</strong> Chats, tickets, and settings are preserved and will be available as soon as your account is reactivated.</p>
</div>

<p>To restore access, please contact the administrator.</p>
@endsection
