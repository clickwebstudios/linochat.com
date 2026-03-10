/**
 * LinoChat Widget v1.0
 * Embed a live chat on any website.
 */
(function () {
  'use strict';

  // ── Resolve API base from this script's own src ──────────────────────────
  var scriptEl = document.getElementById('lc') ||
    (function () {
      var tags = document.getElementsByTagName('script');
      return tags[tags.length - 1];
    })();

  var BASE_URL = scriptEl.src.replace(/\/widget\.js.*$/, '');

  // ── Collect queued lc() calls ────────────────────────────────────────────
  var queue = (window.lc && window.lc.q) ? window.lc.q : [];
  var widgetId = null;

  queue.forEach(function (args) {
    if (args[0] === 'init' && args[1] && args[1].widgetId) {
      widgetId = args[1].widgetId;
    }
  });

  if (!widgetId) return;

  // ── State ────────────────────────────────────────────────────────────────
  var chatId        = null;
  var customerId    = null;
  var lastId        = 0;
  var polling       = null;
  var isOpen        = false;
  var primaryColor  = '#3B82F6';
  var welcomeMsg    = 'Hi! How can we help you today?';

  // ── Inject CSS ────────────────────────────────────────────────────────────
  var css = [
    '#lc-widget{position:fixed;bottom:20px;right:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px}',
    '#lc-btn{width:56px;height:56px;border-radius:50%;background:var(--lc-color);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;outline:none}',
    '#lc-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.3)}',
    '#lc-btn svg{pointer-events:none}',
    '#lc-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px}',
    '#lc-panel{position:fixed;bottom:88px;right:20px;width:340px;height:500px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;transition:opacity .2s,transform .2s;opacity:0;transform:translateY(12px) scale(.97);pointer-events:none}',
    '#lc-panel.lc-open{opacity:1;transform:none;pointer-events:auto}',
    '#lc-head{padding:16px;color:#fff;background:var(--lc-color);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
    '#lc-head h4{margin:0;font-size:15px;font-weight:600}',
    '#lc-head p{margin:2px 0 0;font-size:12px;opacity:.85}',
    '#lc-close{background:none;border:none;color:#fff;cursor:pointer;opacity:.8;padding:4px;line-height:1;font-size:20px}',
    '#lc-close:hover{opacity:1}',
    '#lc-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#f9fafb}',
    '.lc-msg{max-width:80%;padding:9px 13px;border-radius:12px;line-height:1.45;word-break:break-word;font-size:13px}',
    '.lc-msg.lc-agent{background:#fff;border:1px solid #e5e7eb;color:#111;align-self:flex-start;border-bottom-left-radius:3px}',
    '.lc-msg.lc-customer{background:var(--lc-color);color:#fff;align-self:flex-end;border-bottom-right-radius:3px}',
    '.lc-msg.lc-system{background:transparent;color:#9ca3af;font-size:11px;align-self:center;text-align:center;border:none;padding:2px 0}',
    '.lc-time{font-size:10px;opacity:.6;margin-top:3px}',
    '#lc-foot{padding:12px;border-top:1px solid #e5e7eb;background:#fff;display:flex;gap:8px;align-items:center;flex-shrink:0}',
    '#lc-input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:13px;outline:none;resize:none;font-family:inherit;height:38px;line-height:1.4;transition:border .15s}',
    '#lc-input:focus{border-color:var(--lc-color)}',
    '#lc-send{width:36px;height:36px;border-radius:8px;background:var(--lc-color);color:#fff;border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:opacity .15s}',
    '#lc-send:hover{opacity:.85}',
    '#lc-send:disabled{opacity:.4;cursor:default}',
    '#lc-name-screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:12px;background:#f9fafb}',
    '#lc-name-screen p{margin:0;color:#6b7280;font-size:13px;text-align:center}',
    '#lc-name-input{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;box-sizing:border-box;transition:border .15s}',
    '#lc-name-input:focus{border-color:var(--lc-color)}',
    '#lc-start-btn{width:100%;padding:10px;border-radius:8px;background:var(--lc-color);color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}',
    '#lc-start-btn:hover{opacity:.88}',
    '@media(max-width:400px){#lc-panel{right:0;bottom:80px;width:100vw;border-radius:16px 16px 0 0}}',
    '#lc-greeting{position:absolute;bottom:68px;right:0;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:12px 16px;max-width:260px;font-size:13px;line-height:1.45;color:#111;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none;cursor:pointer}',
    '#lc-greeting.lc-show{opacity:1;transform:none;pointer-events:auto}',
    '#lc-greeting-close{position:absolute;top:4px;right:8px;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;line-height:1;padding:2px}',
    '#lc-greeting-close:hover{color:#6b7280}',
    '#lc-greeting::after{content:"";position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:#fff;transform:rotate(45deg);box-shadow:2px 2px 4px rgba(0,0,0,.08)}',
  ].join('');

  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // ── Build DOM ─────────────────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'lc-widget';
  wrap.style.setProperty('--lc-color', primaryColor);

  wrap.innerHTML = [
    // Float button
    '<button id="lc-btn" aria-label="Open chat">',
    '  <span id="lc-badge"></span>',
    '  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
    '</button>',
    // Greeting bubble
    '<div id="lc-greeting"><span id="lc-greeting-text"></span><button id="lc-greeting-close" aria-label="Close greeting">&#x2715;</button></div>',
    // Panel
    '<div id="lc-panel" role="dialog" aria-label="Chat">',
    '  <div id="lc-head">',
    '    <div>',
    '      <h4 id="lc-title">Chat with us</h4>',
    '      <p>We typically reply in a few minutes</p>',
    '    </div>',
    '    <button id="lc-close" aria-label="Close">&#x2715;</button>',
    '  </div>',
    // Name collection screen (shown before chat starts)
    '  <div id="lc-name-screen">',
    '    <p>Before we start, what\'s your name?</p>',
    '    <input id="lc-name-input" type="text" placeholder="Your name (optional)" maxlength="80">',
    '    <button id="lc-start-btn">Start Chat</button>',
    '  </div>',
    // Messages area (hidden until chat started)
    '  <div id="lc-msgs" style="display:none"></div>',
    '  <div id="lc-foot" style="display:none">',
    '    <input id="lc-input" type="text" placeholder="Type a message…" maxlength="2000">',
    '    <button id="lc-send" aria-label="Send">',
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    '    </button>',
    '  </div>',
    '</div>',
  ].join('');

  // Hide until settings are applied (prevents FOUC)
  wrap.style.opacity    = '0';
  wrap.style.transition = 'opacity 0.25s ease';
  document.body.appendChild(wrap);

  // ── Refs ──────────────────────────────────────────────────────────────────
  var btn        = document.getElementById('lc-btn');
  var badge      = document.getElementById('lc-badge');
  var panel      = document.getElementById('lc-panel');
  var title      = document.getElementById('lc-title');
  var closeBtn   = document.getElementById('lc-close');
  var nameScreen = document.getElementById('lc-name-screen');
  var nameInput  = document.getElementById('lc-name-input');
  var startBtn   = document.getElementById('lc-start-btn');
  var msgs       = document.getElementById('lc-msgs');
  var foot       = document.getElementById('lc-foot');
  var input      = document.getElementById('lc-input');
  var sendBtn    = document.getElementById('lc-send');
  var greeting   = document.getElementById('lc-greeting');
  var greetText  = document.getElementById('lc-greeting-text');
  var greetClose = document.getElementById('lc-greeting-close');
  var greetTimer = null;

  // ── Apply position ────────────────────────────────────────────────────────
  function applyPosition(pos) {
    var isLeft   = pos === 'bottom-left'  || pos === 'top-left';
    var isTop    = pos === 'top-right'    || pos === 'top-left';
    var btnV     = isTop  ? '20px'  : '20px';
    var panelV   = isTop  ? '88px'  : '88px';

    // Button
    wrap.style.bottom = isTop  ? 'auto' : '20px';
    wrap.style.top    = isTop  ? '20px' : 'auto';
    wrap.style.right  = isLeft ? 'auto' : '20px';
    wrap.style.left   = isLeft ? '20px' : 'auto';

    // Panel
    panel.style.bottom = isTop  ? 'auto' : '88px';
    panel.style.top    = isTop  ? '88px' : 'auto';
    panel.style.right  = isLeft ? 'auto' : '20px';
    panel.style.left   = isLeft ? '20px' : 'auto';
  }

  // ── Apply design ──────────────────────────────────────────────────────────
  function applyDesign(design) {
    switch (design) {
      case 'minimal':
        panel.style.boxShadow = '0 2px 8px rgba(0,0,0,.12)';
        panel.style.borderRadius = '8px';
        btn.style.boxShadow = 'none';
        btn.style.border = '2px solid rgba(0,0,0,.1)';
        break;
      case 'classic':
        panel.style.borderRadius = '4px';
        btn.style.borderRadius = '4px';
        panel.style.boxShadow = '0 2px 12px rgba(0,0,0,.2)';
        break;
      case 'compact':
        btn.style.width = '44px';
        btn.style.height = '44px';
        panel.style.height = '420px';
        panel.style.width = '300px';
        break;
      case 'bubble':
        panel.style.borderRadius = '20px';
        btn.style.width = '60px';
        btn.style.height = '60px';
        panel.style.boxShadow = '0 12px 48px rgba(0,0,0,.22)';
        break;
      case 'professional':
        panel.style.borderRadius = '6px';
        btn.style.borderRadius = '6px';
        panel.style.boxShadow = '0 4px 20px rgba(0,0,0,.15)';
        break;
      case 'friendly':
        panel.style.borderRadius = '24px';
        btn.style.borderRadius = '50%';
        panel.style.boxShadow = '0 8px 32px rgba(0,0,0,.18)';
        break;
      case 'gradient':
        btn.style.background = 'linear-gradient(135deg, var(--lc-color), ' + primaryColor + 'cc)';
        panel.style.borderRadius = '16px';
        break;
      // 'modern' is the default CSS — no overrides needed
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function togglePanel() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('lc-open');
      badge.style.display = 'none';
      greeting.classList.remove('lc-show');
      if (greetTimer) { clearTimeout(greetTimer); greetTimer = null; }
      if (chatId) input.focus();
      else nameInput.focus();
    } else {
      panel.classList.remove('lc-open');
    }
  }

  function addMsg(text, sender, time) {
    var div = document.createElement('div');
    div.className = 'lc-msg lc-' + (sender === 'customer' ? 'customer' : sender === 'system' ? 'system' : 'agent');
    var t = document.createElement('div');
    t.textContent = text;
    div.appendChild(t);
    if (time && sender !== 'system') {
      var ts = document.createElement('div');
      ts.className = 'lc-time';
      ts.textContent = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      div.appendChild(ts);
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showChat() {
    nameScreen.style.display = 'none';
    msgs.style.display       = 'flex';
    foot.style.display       = 'flex';
    input.focus();
  }

  function api(method, path, body) {
    return fetch(BASE_URL + '/api/widget' + path, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json(); });
  }

  function startPolling() {
    if (polling) return;
    polling = setInterval(function () {
      if (!chatId) return;
      api('GET', '/' + widgetId + '/messages?chat_id=' + chatId + '&customer_id=' + encodeURIComponent(customerId))
        .then(function (data) {
          var d = data.data || data;
          var list = d.messages || (Array.isArray(d) ? d : []);
          list.forEach(function (m) {
            if (m.id > lastId) {
              if ((m.sender_type || m.sender) !== 'customer') {
                addMsg(m.content || m.text, m.sender_type || m.sender, m.created_at);
                if (!isOpen) {
                  badge.textContent = '+1';
                  badge.style.display = 'flex';
                }
              }
              lastId = m.id;
            }
          });
        })
        .catch(function () {});
    }, 3000);
  }

  function startChat() {
    startBtn.disabled = true;
    startBtn.textContent = 'Connecting…';
    var name = (nameInput.value || '').trim() || 'Visitor';

    api('POST', '/' + widgetId + '/init', { customer_name: name })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        var d = data.data || data;
        chatId = d.chat_id;
        customerId = d.customer_id;
        showChat();
        // Show existing messages or welcome message
        var existingMsgs = d.messages || [];
        if (existingMsgs.length > 0) {
          existingMsgs.forEach(function (m) {
            addMsg(m.content || m.text, m.sender_type || m.sender, m.created_at);
            if (m.id > lastId) lastId = m.id;
          });
        } else {
          addMsg(welcomeMsg, 'agent');
        }
        startPolling();
      })
      .catch(function (err) {
        startBtn.disabled = false;
        startBtn.textContent = 'Start Chat';
        addMsg('Could not connect. Please try again.', 'system');
      });
  }

  function sendMessage() {
    var text = (input.value || '').trim();
    if (!text || !chatId) return;
    input.value = '';
    sendBtn.disabled = true;

    var tempDiv = addMsg(text, 'customer');

    api('POST', '/' + widgetId + '/message', { chat_id: chatId, customer_id: customerId, message: text })
      .then(function (data) {
        var d = data.data || data;
        if (d.message && d.message.id && d.message.id > lastId) lastId = d.message.id;
        // Show AI response if present
        if (d.ai_response && d.ai_response.content) {
          addMsg(d.ai_response.content, 'agent', d.ai_response.created_at);
          if (d.ai_response.id && d.ai_response.id > lastId) lastId = d.ai_response.id;
        }
        sendBtn.disabled = false;
        input.focus();
      })
      .catch(function () {
        tempDiv.style.opacity = '0.5';
        sendBtn.disabled = false;
      });
  }

  // ── Events ────────────────────────────────────────────────────────────────
  btn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);

  startBtn.addEventListener('click', startChat);
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') startChat();
  });

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ── Greeting handlers ────────────────────────────────────────────────────
  greetClose.addEventListener('click', function (e) {
    e.stopPropagation();
    greeting.classList.remove('lc-show');
  });
  greeting.addEventListener('click', function () {
    greeting.classList.remove('lc-show');
    if (!isOpen) togglePanel();
  });

  function showGreeting(message, delay) {
    if (!message || isOpen) return;
    greetText.textContent = message;
    greetTimer = setTimeout(function () {
      if (!isOpen) greeting.classList.add('lc-show');
    }, (delay || 0) * 1000);
  }

  // ── Load project settings on init ─────────────────────────────────────────
  api('GET', '/' + widgetId + '/config')
    .then(function (data) {
      if (!data.error) {
        var d = data.data || data;
        primaryColor = d.color || d.project_color || primaryColor;
        welcomeMsg   = d.welcome_message || welcomeMsg;
        wrap.style.setProperty('--lc-color', primaryColor);
        title.textContent = d.widget_title || d.project_name || d.company_name || 'Chat with us';
        applyPosition(d.position || d.widget_position || 'bottom-right');
        applyDesign(d.design || d.widget_design || 'modern');

        // Show greeting bubble if enabled
        if (d.greeting_enabled && d.greeting_message) {
          showGreeting(d.greeting_message, d.greeting_delay || 0);
        }
      }
      wrap.style.opacity = '1';
    })
    .catch(function () {
      // Show widget even if settings fail
      wrap.style.opacity = '1';
    });

  // ── Expose public API ─────────────────────────────────────────────────────
  window.lc = function () {
    var args = Array.prototype.slice.call(arguments);
    if (args[0] === 'open')  { if (!isOpen) togglePanel(); }
    if (args[0] === 'close') { if (isOpen)  togglePanel(); }
  };
  window.lc.q = [];
})();
