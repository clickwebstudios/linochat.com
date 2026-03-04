<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
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
        .code-box {
            background: #ffffff;
            border: 2px dashed #4F46E5;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #4F46E5;
            font-family: monospace;
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
        <h1>Verify Your Email</h1>
    </div>
    <div class="content">
        <p>Hello,</p>

        <p>Thank you for signing up for LinoChat! Please use the verification code below to confirm your email address:</p>

        <div class="code-box">
            <div class="code">{{ $code }}</div>
        </div>

        <p>This code will expire in <strong>15 minutes</strong>.</p>

        <p>If you didn't create a LinoChat account, you can safely ignore this email.</p>

        <p>Best regards,<br>The LinoChat Team</p>
    </div>

    <div class="footer">
        <p>&copy; {{ date('Y') }} LinoChat. All rights reserved.</p>
    </div>
</body>
</html>
