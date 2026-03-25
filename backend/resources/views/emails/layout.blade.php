<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>{{ $subject ?? 'LinoChat' }}</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 16px; }
    .header { background: #ffffff; border-radius: 16px 16px 0 0; padding: 28px 40px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .header img { max-width: 200px; height: auto; }
    .card { background: #ffffff; border-radius: 0 0 16px 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111827; }
    h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #111827; }
    p { font-size: 15px; line-height: 1.7; color: #4b5563; margin-bottom: 16px; }
    .greeting { font-size: 16px; color: #1f2937; font-weight: 500; margin-bottom: 16px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; margin: 8px 0 20px; transition: background 0.2s; }
    .btn-outline { display: inline-block; border: 2px solid #2563eb; color: #2563eb !important; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-size: 15px; font-weight: 600; margin: 8px 0 20px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .info-box { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    .info-box-accent { background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 20px 0; }
    .code-box { background: #f0f4ff; border: 2px dashed #93b4fd; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
    .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }
    .url-box { background: #f3f4f6; padding: 14px 18px; border-radius: 8px; font-family: monospace; font-size: 13px; word-break: break-all; color: #6b7280; margin: 12px 0; }
    .meta-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px; font-size: 14px; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; }
    .meta-table td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
    .meta-table tr:last-child td { border-bottom: none; }
    .meta-table td:first-child { background: #f9fafb; font-weight: 600; color: #6b7280; width: 38%; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
    .badge-high   { background: #fee2e2; color: #dc2626; }
    .badge-medium { background: #fef9c3; color: #ca8a04; }
    .badge-low    { background: #dcfce7; color: #16a34a; }
    .badge-open   { background: #dbeafe; color: #2563eb; }
    .badge-pending{ background: #f3e8ff; color: #9333ea; }
    .badge-closed { background: #d1fae5; color: #059669; }
    .reply-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
    .reply-box p { margin-bottom: 0; color: #374151; }
    .feature-list { list-style: none; padding: 0; margin: 16px 0; }
    .feature-list li { padding: 8px 0; font-size: 14px; color: #4b5563; }
    .feature-list li::before { content: "✓"; color: #2563eb; font-weight: 700; margin-right: 10px; }
    .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.8; padding: 0 20px; }
    .footer a { color: #6b7280; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .footer-brand { font-weight: 600; color: #6b7280; }
    .sign-off { color: #6b7280; font-size: 14px; margin-top: 8px; }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827 !important; color: #e5e7eb !important; }
      .header { background: #ffffff !important; border-color: #374151 !important; }
      .card { background: #1f2937 !important; box-shadow: 0 4px 24px rgba(0,0,0,0.3) !important; }
      h1, h3 { color: #f9fafb !important; }
      p { color: #d1d5db !important; }
      .greeting { color: #f3f4f6 !important; }
      .info-box, .info-box-accent { background: #374151 !important; border-color: #4b5563 !important; }
      .code-box { background: #1e3a5f !important; border-color: #3b82f6 !important; }
      .url-box { background: #374151 !important; color: #9ca3af !important; }
      .meta-table { border-color: #4b5563 !important; }
      .meta-table td { border-color: #4b5563 !important; }
      .meta-table td:first-child { background: #374151 !important; color: #9ca3af !important; }
      .reply-box { background: #374151 !important; }
      .reply-box p { color: #d1d5db !important; }
      .feature-list li { color: #d1d5db !important; }
      .sign-off { color: #9ca3af !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a href="https://linochat.com" style="text-decoration:none;">
        <img src="{{ rtrim(config('app.frontend_url', config('app.url', 'https://linochat.com')), '/') }}/images/email-logo@2x.png" alt="LinoChat — Talk. Convert. Grow." width="200" style="max-width:200px;height:auto;" />
      </a>
    </div>
    <div class="card">
      @yield('content')

      <p class="sign-off">
        Best regards,<br>
        <strong>The LinoChat Team</strong>
      </p>
    </div>
    <div class="footer">
      <p class="footer-brand">LinoChat — AI-Powered Customer Support</p>
      <p>&copy; {{ date('Y') }} LinoChat. All rights reserved.</p>
      <p>
        <a href="https://linochat.com">Website</a> &nbsp;·&nbsp;
        <a href="https://linochat.com/help">Help Center</a> &nbsp;·&nbsp;
        <a href="https://linochat.com/privacy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
