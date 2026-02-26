<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LinoChat</title>
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
        .features {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .features ul {
            margin: 0;
            padding-left: 20px;
        }
        .features li {
            margin: 10px 0;
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
        <h1>Welcome to LinoChat! 🎉</h1>
    </div>
    <div class="content">
        <p>Hello {{ $user->first_name }},</p>
        
        <p>Thank you for joining LinoChat! We're excited to help you provide exceptional customer support with AI-powered assistance.</p>
        
        <div class="features">
            <h3>What's included in your account:</h3>
            <ul>
                <li>✅ AI-powered chat widget for your website</li>
                <li>✅ Automatic website analysis and Knowledge Base generation</li>
                <li>✅ Real-time messaging with WebSocket</li>
                <li>✅ Agent dashboard for managing conversations</li>
                <li>✅ Support ticket system with email integration</li>
                <li>✅ Customizable widget appearance</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="{{ $dashboardUrl }}" class="button">Go to Dashboard</a>
        </div>
        
        <p>Your project <strong>{{ $project->name }}</strong> has been created and your website has been analyzed. You can now:</p>
        
        <ol>
            <li>Customize your chat widget in the dashboard</li>
            <li>Get your embed code and add it to your website</li>
            <li>Invite team members to help with support</li>
            <li>Review and edit the AI-generated Knowledge Base</li>
        </ol>
        
        <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        
        <p>Welcome aboard!<br>The LinoChat Team</p>
    </div>
    
    <div class="footer">
        <p>You're receiving this email because you created an account on LinoChat.</p>
        <p>{{ $project->website }}</p>
    </div>
</body>
</html>
