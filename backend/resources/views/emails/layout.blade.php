<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ $subject ?? 'LinoChat' }}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e; }
    .wrapper { max-width: 600px; margin: 40px auto; padding: 0 16px 40px; }
    .header { background: #2563eb; border-radius: 12px 12px 0 0; padding: 28px 40px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
    .header-icon { background: #fff; color: #2563eb; font-weight: 700; font-size: 18px; width: 40px; height: 40px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
    .header-name { color: #fff; font-size: 20px; font-weight: 700; }
    .card { background: #ffffff; border-radius: 0 0 12px 12px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #111827; }
    p { font-size: 15px; line-height: 1.65; color: #374151; margin-bottom: 16px; }
    .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0 20px; }
    .btn-outline { display: inline-block; border: 2px solid #2563eb; color: #2563eb !important; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0 20px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    .meta-table td { padding: 10px 14px; border: 1px solid #e5e7eb; }
    .meta-table td:first-child { background: #f9fafb; font-weight: 600; color: #6b7280; width: 38%; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
    .badge-high   { background: #fee2e2; color: #dc2626; }
    .badge-medium { background: #fef9c3; color: #ca8a04; }
    .badge-low    { background: #dcfce7; color: #16a34a; }
    .badge-open   { background: #dbeafe; color: #2563eb; }
    .badge-pending{ background: #f3e8ff; color: #9333ea; }
    .badge-closed { background: #d1fae5; color: #059669; }
    .reply-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
    .reply-box p { margin-bottom: 0; }
    .footer { margin-top: 28px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.7; }
    .footer a { color: #6b7280; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">
        <span class="header-icon">LC</span>
        <span class="header-name">LinoChat</span>
      </div>
    </div>
    <div class="card">
      @yield('content')
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} LinoChat. All rights reserved.</p>
      <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a> · <a href="#">Help Center</a></p>
    </div>
  </div>
</body>
</html>
