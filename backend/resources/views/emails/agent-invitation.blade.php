<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #4F46E5;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            background: #4F46E5;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>You're Invited!</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        
        <p>You've been invited to join <strong>{{ $project->name }}</strong> as a support agent on LinoChat.</p>
        
        <p>LinoChat is an AI-powered customer support platform that helps you manage customer conversations efficiently.</p>
        
        <div style="text-align: center;">
            <a href="{{ $inviteUrl }}" class="button">Accept Invitation</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{{ $inviteUrl }}</p>
        
        <p>This invitation will expire in 7 days.</p>
        
        <p>If you have any questions, please contact the person who invited you.</p>
        
        <p>Best regards,<br>The LinoChat Team</p>
    </div>
    
    <div class="footer">
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
</body>
</html>
