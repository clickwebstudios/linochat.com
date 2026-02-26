<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Support Ticket</title>
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
        .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4F46E5;
        }
        .ticket-id {
            font-family: monospace;
            background: #e5e7eb;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
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
        <h1>New Support Ticket Created</h1>
    </div>
    <div class="content">
        <p>Hello {{ $ticket->customer_name ?? 'there' }},</p>
        
        <p>Thank you for contacting us. We've received your request and created a support ticket.</p>
        
        <div class="ticket-info">
            <h3>Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> <span class="ticket-id">#{{ $ticket->id }}</span></p>
            <p><strong>Subject:</strong> {{ $ticket->subject }}</p>
            <p><strong>Priority:</strong> {{ ucfirst($ticket->priority) }}</p>
            <p><strong>Status:</strong> {{ ucfirst($ticket->status) }}</p>
        </div>
        
        <p>Our support team will review your request and get back to you as soon as possible.</p>
        
        <div style="text-align: center;">
            <a href="{{ $ticketUrl }}" class="button">View Ticket</a>
        </div>
        
        <p>You can reply to this email to add more information to your ticket.</p>
        
        <p>Best regards,<br>The {{ $projectName }} Support Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email unless you want to add information to your ticket.</p>
    </div>
</body>
</html>
