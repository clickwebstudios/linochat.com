<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class WidgetLoaderController extends Controller
{
    /**
     * Serve full widget JavaScript. Single script: widget.js?id=WIDGET_ID
     */
    public function widget(Request $request)
    {
        $widgetId = $request->input('id') ?? $request->input('i');
        if (empty($widgetId)) {
            return response('// LinoChat: id parameter required. Use widget.js?id=YOUR_WIDGET_ID', 400)
                ->header('Content-Type', 'application/javascript; charset=utf-8')
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Cross-Origin-Resource-Policy', 'cross-origin');
        }
        // Use X-Forwarded-Proto when behind proxy (Cloudflare Tunnel, nginx, etc.) to avoid mixed-content
        $proto = $request->header('X-Forwarded-Proto');
        $scheme = $proto ? strtolower(trim(explode(',', $proto)[0])) : $request->getScheme();
        $host = $request->header('X-Forwarded-Host') ?: $request->getHost();
        $requestBase = rtrim($scheme . '://' . $host, '/');
        // Use config() — env() returns null when config is cached (config:cache)
        $apiUrl = rtrim(config('widget.api_url', config('app.url', $requestBase)), '/');
        
        // WebSocket config: Reverb (local) or Pusher (cloud)
        $broadcastDriver = config('broadcasting.default', 'null');
        $wsKey = '';
        $wsCluster = 'us3';
        $wsHost = '';
        $wsPort = '443';
        $wsScheme = 'https';
        if ($broadcastDriver === 'reverb') {
            $wsKey = config('broadcasting.connections.reverb.key', '');
            $reverbHost = config('broadcasting.connections.reverb.options.host', env('REVERB_HOST', 'localhost'));
            $wsHost = (str_contains($reverbHost, 'localhost') || str_contains($reverbHost, '127.0.0.1')) ? $host : $reverbHost;
            $isLocal = str_contains($apiUrl, 'localhost') || str_contains($apiUrl, '127.0.0.1');
            $wsPort = $isLocal ? (string) (config('broadcasting.connections.reverb.options.port') ?: env('REVERB_PORT', 8080)) : '443';
            $wsScheme = $isLocal ? 'http' : ($proto ?: 'https');
        } else {
            $wsKey = config('broadcasting.connections.pusher.key', '');
            $wsCluster = config('broadcasting.connections.pusher.options.cluster', 'us3');
        }
        
        // When .env has localhost (dev values), use request host for production embedding
        if (str_contains($apiUrl, 'localhost') || str_contains($apiUrl, '127.0.0.1')) {
            $apiUrl = $requestBase;
        }
        $widgetIdJson = json_encode($widgetId);
        $apiUrlJson = json_encode($apiUrl);
        $wsKeyJson = json_encode($wsKey);
        $wsClusterJson = json_encode($wsCluster);
        $wsHostJson = json_encode($wsHost);
        $wsPortJson = json_encode($wsPort);
        $wsSchemeJson = json_encode($wsScheme);
        $js = <<<JS
// Load Pusher SDK
(function() {
    var script = document.createElement('script');
    script.src = 'https://js.pusher.com/8.2.0/pusher.min.js';
    script.async = true;
    document.head.appendChild(script);
})();

(function() {
    'use strict';
    
    var WIDGET_ID = {$widgetIdJson};
    var API_URL = {$apiUrlJson};
    var WS_KEY = {$wsKeyJson};
    var WS_CLUSTER = {$wsClusterJson};
    var WS_HOST = {$wsHostJson};
    var WS_PORT = {$wsPortJson};
    var WS_SCHEME = {$wsSchemeJson};
    var PUSHER = null;
    var PUSHER_CHANNEL = null;
    
    var CONFIG = null;
    var CHAT_ID = null;
    var CHAT_STATUS = 'active';
    var CUSTOMER_ID = localStorage.getItem('linochat_customer_id') || null;
    var MESSAGES = [];
    var WIDGET_ELEMENT = null;
    var SETTINGS_CHECK_INTERVAL = null;
    var LAST_SETTINGS_UPDATE = null;
    var ADDED_MESSAGE_IDS = {};
    var POLL_CHAT_INTERVAL = null;
    var POLL_MESSAGES_INTERVAL = null;
    var CUSTOMER_TYPING_TIMEOUT = null;
    var CUSTOMER_TYPING_SENT = false;
    var CHAT_INITIALIZED = false;
    var CHAT_INIT_PROMISE = null;
    var HEARTBEAT_INTERVAL = null;

    // Default button icon (MessageSquare SVG)
    var DEFAULT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"><\/path><\/svg>';
    var HEADER_ICON  = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"><\/path><\/svg>';

    // Headers for fetch - only add ngrok bypass when using ngrok (avoids CORS preflight for Cloudflare)
    var FETCH_HEADERS = API_URL.indexOf('ngrok') !== -1 ? { 'ngrok-skip-browser-warning': '1' } : {};
    
    // Position styles mapping
    var POSITION_STYLES = {
        'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' },
        'bottom-left': { bottom: '20px', left: '20px', top: 'auto', right: 'auto' },
        'top-right': { top: '20px', right: '20px', bottom: 'auto', left: 'auto' },
        'top-left': { top: '20px', left: '20px', bottom: 'auto', right: 'auto' }
    };
    
    // No external CSS - all styles inline. Try injecting style tag for pseudo-selectors; if blocked by CSP, widget still works.
    // Uses var(--linochat-color) so createWidget/updateWidgetAppearance can set the configured color.
    function injectStyles() {
        if (document.getElementById('linochat-inline-styles')) return;
        try {
            var s = document.createElement('style');
            s.id = 'linochat-inline-styles';
            s.textContent = '#linochat-widget *{box-sizing:border-box}#linochat-messages::-webkit-scrollbar{width:6px}#linochat-messages::-webkit-scrollbar-track{background:transparent}#linochat-messages::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}#linochat-input:focus{border-color:var(--linochat-color,#4F46E5)!important}@media(max-width:480px){#linochat-window{width:100%!important;height:100%!important;bottom:0!important;right:0!important;left:0!important;top:0!important;border-radius:0!important}#linochat-button{bottom:20px!important;right:20px!important}}'
            + '@keyframes lc-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}'
            + '@keyframes lc-pulse{0%,100%{box-shadow:0 0 0 0 currentColor}50%{box-shadow:0 0 0 12px transparent}}'
            + '@keyframes lc-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}'
            + '@keyframes lc-wobble{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}'
            + '@keyframes lc-tada{0%,100%{transform:scale(1) rotate(0)}10%,20%{transform:scale(0.9) rotate(-3deg)}30%,50%,70%,90%{transform:scale(1.1) rotate(3deg)}40%,60%,80%{transform:scale(1.1) rotate(-3deg)}}'
            + '@keyframes lc-heartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.15)}28%{transform:scale(1)}42%{transform:scale(1.15)}70%{transform:scale(1)}}'
            + '@keyframes lc-rubber-band{0%,100%{transform:scaleX(1)}30%{transform:scaleX(1.25) scaleY(0.75)}40%{transform:scaleX(0.75) scaleY(1.25)}50%{transform:scaleX(1.15) scaleY(0.85)}65%{transform:scaleX(0.95) scaleY(1.05)}75%{transform:scaleX(1.05) scaleY(0.95)}}'
            + '@keyframes lc-swing{20%{transform:rotate(15deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(5deg)}80%{transform:rotate(-5deg)}100%{transform:rotate(0)}}'
            + '@keyframes lc-jello{0%,100%{transform:skewX(0) skewY(0)}22%{transform:skewX(-12.5deg) skewY(-12.5deg)}33%{transform:skewX(6.25deg) skewY(6.25deg)}44%{transform:skewX(-3.125deg) skewY(-3.125deg)}55%{transform:skewX(1.5625deg) skewY(1.5625deg)}66%{transform:skewX(-0.78125deg) skewY(-0.78125deg)}}'
            + '@keyframes lc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}';
            document.head.appendChild(s);
        } catch (e) {}
    }
    
    // Load widget config - try fetch first (works with CORS), fallback to JSONP (bypasses strict CSP)
    function loadConfig() {
        return fetch(API_URL + '/api/widget/' + WIDGET_ID + '/config', { headers: FETCH_HEADERS, cache: 'no-store' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    CONFIG = data.data;
                    LAST_SETTINGS_UPDATE = CONFIG.settings_updated_at;
                    return CONFIG;
                }
                throw new Error(data.message || 'Failed to load config');
            })
            .catch(function() {
                return loadConfigJsonp();
            });
    }
    
    function loadConfigJsonp() {
        return new Promise(function(resolve, reject) {
            var cb = 'linochat_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            var script = document.createElement('script');
            var done = false;
            function finish(err, data) {
                if (done) return;
                done = true;
                delete window[cb];
                if (script.parentNode) script.parentNode.removeChild(script);
                if (err) reject(err);
                else if (data && data.success) {
                    CONFIG = data.data;
                    LAST_SETTINGS_UPDATE = CONFIG.settings_updated_at;
                    resolve(CONFIG);
                } else {
                    reject(new Error((data && data.message) || 'Failed to load config'));
                }
            }
            window[cb] = function(data) { finish(null, data); };
            script.onerror = function() { finish(new Error('Config script failed to load')); };
            script.onload = function() {
                if (!done) finish(new Error('Config callback never fired'));
            };
            script.src = API_URL + '/api/widget/' + WIDGET_ID + '/config?callback=' + encodeURIComponent(cb) + '&_=' + Date.now();
            document.head.appendChild(script);
        });
    }
    
    // Connect to WebSocket (Reverb or Pusher)
    function connectWebSocket() {
        if (!CHAT_ID || !WS_KEY || !window.Pusher) {
            if (!window.Pusher) setTimeout(connectWebSocket, 1000);
            return;
        }
        if (PUSHER) PUSHER.disconnect();
        try {
            var opts = { forceTLS: WS_SCHEME === 'https' };
            if (WS_HOST) {
                opts.wsHost = WS_HOST;
                opts.wsPort = parseInt(WS_PORT, 10);
                opts.wssPort = parseInt(WS_PORT, 10);
                opts.disableStats = true;
            } else {
                opts.cluster = WS_CLUSTER;
            }
            PUSHER = new window.Pusher(WS_KEY, opts);
            
            PUSHER.connection.bind('connected', function() {
                console.log('LinoChat: Pusher connected');
            });
            
            PUSHER.connection.bind('disconnected', function() {
                console.log('LinoChat: Pusher disconnected');
            });
            
            PUSHER.connection.bind('error', function(err) {
                console.error('LinoChat: Pusher error', err);
            });
            
            // Subscribe to chat channel
            PUSHER_CHANNEL = PUSHER.subscribe('chat.' + CHAT_ID);
            
            // Bind to events
            PUSHER_CHANNEL.bind('message.sent', function(data) {
                handleWebSocketMessage({ event: 'message.sent', data: data });
            });
            
            PUSHER_CHANNEL.bind('chat.status', function(data) {
                handleWebSocketMessage({ event: 'chat.status', data: data });
            });
            
            PUSHER_CHANNEL.bind('agent.typing', function(data) {
                handleWebSocketMessage({ event: 'agent.typing', data: data });
            });
            PUSHER_CHANNEL.bind('ai.typing', function(data) {
                handleWebSocketMessage({ event: 'ai.typing', data: data });
            });
            PUSHER_CHANNEL.bind('ai.typing.stop', function(data) {
                handleWebSocketMessage({ event: 'ai.typing.stop', data: data });
            });
            
        } catch (e) {
            console.error('LinoChat: Failed to connect Pusher', e);
        }
    }
    
    // Play notification sound for new incoming messages (only when chat window is closed)
    function playNotificationSound() {
        var win = document.getElementById('linochat-window');
        if (win && win.style.display === 'flex') return;
        playIncomingMessageSound();
    }
    
    // Play sound for incoming agent/AI messages (always, even when chat is open)
    function playIncomingMessageSound() {
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            var ctx = new Ctx();
            if (ctx.state === 'suspended') ctx.resume();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
    }
    
    // Handle incoming WebSocket messages
    function handleWebSocketMessage(data) {
        if (data.event === 'message.sent') {
            var msg = data.data;
            // Don't add if it's our own message (already added)
            if (msg.sender_type !== 'customer') {
                // Skip if already added from HTTP response (avoid duplicate)
                if (msg.id && ADDED_MESSAGE_IDS[msg.id]) return;
                // Skip "X has joined the chat" if already shown via chat.status (arrives first)
                if (msg.sender_type === 'system' && / has joined the chat\.$/.test(msg.content) && ADDED_MESSAGE_IDS['agent-joined']) return;
                var msgType = msg.sender_type === 'system' ? 'system' : (msg.sender_type === 'ai' ? 'ai' : 'agent');
                if (msg.sender_type === 'system' && / has joined the chat\.$/.test(msg.content)) ADDED_MESSAGE_IDS['agent-joined'] = true;
                addMessage(msg.content, msgType, msg.id, msgType !== 'system', msg.metadata);
            }
        } else if (data.event === 'chat.status') {
            CHAT_STATUS = data.data.status;
            updateChatStatus(data.data);
            if (data.data.status === 'waiting') {
                addMessage('Transferring to human agent...', 'system');
                startPollingWhenWaiting();
            } else if (data.data.status === 'active' && data.data.agent_name && !ADDED_MESSAGE_IDS['agent-joined']) {
                ADDED_MESSAGE_IDS['agent-joined'] = true;
                addMessage(data.data.agent_name + ' has joined the chat.', 'system');
            }
        } else if (data.event === 'agent.typing') {
            showTypingIndicator(data.data);
        } else if (data.event === 'ai.typing' && data.data.is_typing) {
            showAiTypingIndicator(true);
        } else if (data.event === 'ai.typing.stop') {
            showAiTypingIndicator(false);
        }
    }
    
    // Update chat status in UI
    function updateChatStatus(data) {
        var statusEl = document.getElementById('linochat-status');
        if (statusEl) {
            statusEl.textContent = data.status === 'waiting' ? 'Waiting for agent...' : 
                                   data.agent_name ? 'Chat with ' + data.agent_name : "We're online";
        }
    }
    
    // Show typing indicator
    function showTypingIndicator(data) {
        var container = document.getElementById('linochat-messages');
        var existing = document.getElementById('linochat-typing');
        
        if (data.is_typing) {
            if (!existing) {
                var typing = document.createElement('div');
                typing.id = 'linochat-typing';
                typing.style.cssText = 'align-self:flex-start;background:#f3f4f6;padding:8px 12px;border-radius:12px;font-size:12px;color:#6b7280;font-style:italic';
                typing.innerHTML = '<span>' + data.agent_name + ' is typing...</span>';
                container.appendChild(typing);
                container.scrollTop = container.scrollHeight;
            }
        } else {
            if (existing) existing.remove();
        }
    }
    
    function showAiTypingIndicator(show) {
        var container = document.getElementById('linochat-messages');
        var existing = document.getElementById('linochat-ai-typing');
        if (show && !existing) {
            var el = document.createElement('div');
            el.id = 'linochat-ai-typing';
            el.style.cssText = 'align-self:flex-start;background:#f3f4f6;padding:8px 12px;border-radius:12px;font-size:12px;color:#6b7280;font-style:italic';
            el.innerHTML = '<span>AI is thinking...</span>';
            container.appendChild(el);
            container.scrollTop = container.scrollHeight;
        } else if (!show && existing) {
            existing.remove();
        }
    }
    
    // Poll for chat updates when waiting for agent (fallback when WebSocket fails)
    var NOTIFIED_MSG_IDS = {};

    function processPollData(data) {
        if (!data || !data.success || !data.data) return;
        var d = data.data;
        CHAT_STATUS = d.status || CHAT_STATUS;
        updateChatStatus({ status: d.status, agent_name: d.agent_name });
        if (d.status === 'active' && d.agent_name && !ADDED_MESSAGE_IDS['agent-joined']) {
            ADDED_MESSAGE_IDS['agent-joined'] = true;
            addMessage(d.agent_name + ' has joined the chat.', 'system');
            if (POLL_CHAT_INTERVAL) { clearInterval(POLL_CHAT_INTERVAL); POLL_CHAT_INTERVAL = null; }
        }
        var msgs = d.messages || [];
        var newAgentMsg = null;
        msgs.forEach(function(m) {
            // Track all message IDs to prevent future duplicates
            if (m.id && ADDED_MESSAGE_IDS[m.id]) return;
            // Skip customer messages — already rendered optimistically
            if (m.sender_type === 'customer') {
                if (m.id) ADDED_MESSAGE_IDS[m.id] = true;
                return;
            }
            if (m.sender_type === 'system' && / has joined the chat\.$/.test(m.content)) {
                if (ADDED_MESSAGE_IDS['agent-joined']) return;
                ADDED_MESSAGE_IDS['agent-joined'] = true;
            }
            var type = m.sender_type === 'system' ? 'system' : m.sender_type === 'ai' ? 'ai' : 'agent';
            addMessage(m.content, type, m.id, type !== 'system', m.metadata);
            // Track for notification (only agent/ai, not system)
            if (m.id && !NOTIFIED_MSG_IDS[m.id] && type !== 'system') {
                NOTIFIED_MSG_IDS[m.id] = true;
                newAgentMsg = m;
            }
        });
        // Show notification bubble if widget is closed and there's a new agent/AI message
        if (newAgentMsg) {
            var win = document.getElementById('linochat-window');
            var isClosed = !win || win.style.display === 'none';
            if (isClosed) {
                playIncomingMessageSound();
                showUnreadBubble(newAgentMsg.content || 'New message');
            }
        }
    }

    function showUnreadBubble(text) {
        // Hide greeting bubble
        // Hide greeting and popover
        var greeting = document.getElementById('linochat-greeting');
        if (greeting) greeting.remove();
        var popover = document.getElementById('linochat-popover');
        if (popover) popover.remove();
        var btn = document.getElementById('linochat-button');
        if (!btn) return;
        // Ensure button is visible
        btn.style.display = '';
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        var pos = CONFIG && CONFIG.position === 'bottom-left' ? 'left' : 'right';
        // Limit to 3 stacked bubbles — remove oldest if more
        var existingBubbles = document.querySelectorAll('.linochat-unread-bubble');
        if (existingBubbles.length >= 3) {
            existingBubbles[0].remove();
        }
        // Position new bubble just above the current topmost bubble
        var remainingBubbles = document.querySelectorAll('.linochat-unread-bubble');
        var stackOffset = 90;
        if (remainingBubbles.length > 0) {
            var topBubble = remainingBubbles[remainingBubbles.length - 1];
            stackOffset = (parseInt(topBubble.style.bottom) || 90) + topBubble.offsetHeight + 8;
        }
        var bubble = document.createElement('div');
        bubble.className = 'linochat-unread-bubble';
        var preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
        bubble.innerHTML = '<div style="font-size:13px;color:#111;line-height:1.4">' + preview.replace(/</g, '&lt;') + '</div>';
        bubble.style.cssText = 'position:fixed;bottom:' + stackOffset + 'px;' + pos + ':20px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:12px 36px 12px 14px;max-width:260px;z-index:2147483646;cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s';
        var close = document.createElement('span');
        close.innerHTML = '&times;';
        close.style.cssText = 'position:absolute;top:6px;right:10px;cursor:pointer;font-size:16px;color:#9ca3af;line-height:1';
        close.onclick = function(e) { e.stopPropagation(); bubble.remove(); };
        bubble.appendChild(close);
        bubble.onclick = function() {
            // Remove all notification bubbles
            document.querySelectorAll('.linochat-unread-bubble').forEach(function(b) { b.remove(); });
            var b = document.getElementById('linochat-button'); if (b) b.click();
        };
        document.body.appendChild(bubble);
        // Add unread badge to button
        var badge = document.getElementById('linochat-unread-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'linochat-unread-badge';
            badge.style.cssText = 'position:absolute;top:-2px;right:-2px;width:16px;height:16px;background:#ef4444;border-radius:50%;border:2px solid white;z-index:1';
            btn.style.position = 'relative';
            btn.appendChild(badge);
        }
        setTimeout(function() { bubble.style.opacity = '1'; bubble.style.transform = 'translateY(0)'; }, 50);
    }

    function pollChatState() {
        if (!CHAT_ID || !CUSTOMER_ID) return;
        var cb = 'lc_p_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        var url = API_URL + '/api/widget/' + WIDGET_ID + '/messages?chat_id=' + encodeURIComponent(CHAT_ID) + '&customer_id=' + encodeURIComponent(CUSTOMER_ID) + '&_=' + Date.now() + '&callback=' + encodeURIComponent(cb);
        var script = document.createElement('script');
        var done = false;
        window[cb] = function(data) {
            done = true;
            delete window[cb];
            if (script.parentNode) script.parentNode.removeChild(script);
            processPollData(data);
        };
        script.onerror = function(e) {
            if (!done) { delete window[cb]; }
            if (script.parentNode) script.parentNode.removeChild(script);
        };
        setTimeout(function() {
            if (!done) {
                delete window[cb];
                if (script.parentNode) script.parentNode.removeChild(script);
            }
        }, 10000);
        script.src = url;
        document.head.appendChild(script);
    }
    
    function startPollingWhenWaiting() {
        if (POLL_CHAT_INTERVAL) return;
        POLL_CHAT_INTERVAL = setInterval(function() {
            if (CHAT_STATUS === 'waiting') pollChatState();
            else if (CHAT_STATUS === 'active' && POLL_CHAT_INTERVAL) {
                clearInterval(POLL_CHAT_INTERVAL);
                POLL_CHAT_INTERVAL = null;
            }
        }, 5000);
    }
    
    // Poll for new messages when chat is active (fallback when WebSocket fails to deliver agent messages)
    function startPollingMessages() {
        if (POLL_MESSAGES_INTERVAL) return;
        POLL_MESSAGES_INTERVAL = setInterval(pollChatState, 5000);
    }
    
    // Send heartbeat to signal customer is still online
    var LAST_TRACKED_URL = '';

    function sendHeartbeat() {
        if (!CHAT_ID || !CUSTOMER_ID) return;
        fetch(API_URL + '/api/widget/' + WIDGET_ID + '/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
            body: JSON.stringify({ chat_id: CHAT_ID, customer_id: CUSTOMER_ID, current_page: window.location.href })
        }).catch(function() {});
        // Also poll for new messages on each heartbeat
        pollChatState();
    }

    function sendPageView(url) {
        if (!CHAT_ID || !CUSTOMER_ID || !url) return;
        fetch(API_URL + '/api/widget/' + WIDGET_ID + '/page-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
            body: JSON.stringify({ chat_id: CHAT_ID, customer_id: CUSTOMER_ID, page_url: url, page_title: document.title || '' })
        }).catch(function() {});
    }

    function trackPageChanges() {
        LAST_TRACKED_URL = window.location.href;
        // SPA navigation events
        window.addEventListener('popstate', checkPageChange);
        window.addEventListener('hashchange', checkPageChange);
        // Poll for URL changes (covers pushState which has no event)
        setInterval(checkPageChange, 3000);
    }

    function checkPageChange() {
        var current = window.location.href;
        if (current !== LAST_TRACKED_URL) {
            LAST_TRACKED_URL = current;
            sendPageView(current);
        }
    }

    function startHeartbeat() {
        if (HEARTBEAT_INTERVAL) return;
        sendHeartbeat();
        HEARTBEAT_INTERVAL = setInterval(sendHeartbeat, 15000);
        trackPageChanges();
    }

    function stopHeartbeat() {
        if (HEARTBEAT_INTERVAL) {
            clearInterval(HEARTBEAT_INTERVAL);
            HEARTBEAT_INTERVAL = null;
        }
    }

    // Check for settings updates
    function checkSettingsUpdate() {
        fetch(API_URL + '/api/widget/' + WIDGET_ID + '/config', { headers: FETCH_HEADERS, cache: 'no-store' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success && data.data.settings_updated_at !== LAST_SETTINGS_UPDATE) {
                    console.log('LinoChat: Settings updated, full reload...');
                    CONFIG = data.data;
                    LAST_SETTINGS_UPDATE = CONFIG.settings_updated_at;
                    // Full reload: remove widget and recreate with new settings
                    var el = document.getElementById('linochat-widget');
                    if (el) el.remove();
                    window.__linochat_init_done = false;
                    ADDED_MESSAGE_IDS = {};
                    init();
                }
            })
            .catch(function(e) {
                console.error('LinoChat: Failed to check settings', e);
            });
    }
    
    // Update widget appearance without full reload
    function updateWidgetAppearance() {
        var button = document.getElementById('linochat-button');
        var window_ = document.getElementById('linochat-window');
        var header = document.getElementById('linochat-header');
        var sendBtn = document.getElementById('linochat-send');
        
        var color = CONFIG.color || '#4F46E5';
        var position = CONFIG.position || 'bottom-right';
        var posStyles = POSITION_STYLES[position] || POSITION_STYLES['bottom-right'];
        
        if (WIDGET_ELEMENT) {
            WIDGET_ELEMENT.style.setProperty('--linochat-color', color);
        }
        if (button) {
            if (CONFIG.design !== 'gradient') button.style.background = color;
            else button.style.background = CONFIG.gradient || 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)';
            button.style.bottom = posStyles.bottom;
            button.style.right = posStyles.right;
            button.style.top = posStyles.top;
            button.style.left = posStyles.left;
            button.innerHTML = DEFAULT_ICON;
            // Apply animation
            var anim = CONFIG.animation || 'none';
            if (anim && anim !== 'none') {
                var animMap = {bounce:'lc-bounce',pulse:'lc-pulse',shake:'lc-shake',wobble:'lc-wobble',tada:'lc-tada',heartbeat:'lc-heartbeat','rubber-band':'lc-rubber-band',swing:'lc-swing',jello:'lc-jello',float:'lc-float'};
                var animName = animMap[anim];
                if (animName) {
                    var repeat = CONFIG.animation_repeat || 'infinite';
                    var delay = CONFIG.animation_delay || '0';
                    var duration = CONFIG.animation_duration || 'default';
                    var dur = duration === 'default' ? '1s' : duration + 's';
                    button.style.animation = animName + ' ' + dur + ' ease-in-out ' + (delay !== '0' ? delay + 's' : '0s') + ' ' + repeat;
                    var stopAfter = CONFIG.animation_stop_after;
                    if (stopAfter && stopAfter !== '0') {
                        setTimeout(function() { button.style.animation = 'none'; }, parseInt(stopAfter) * 1000);
                    }
                }
            } else {
                button.style.animation = 'none';
            }
        }
        
        if (window_) {
            window_.style.bottom = posStyles.bottom === '20px' ? '88px' : 'auto';
            window_.style.top = posStyles.top === '20px' ? '88px' : 'auto';
            window_.style.right = posStyles.right;
            window_.style.left = posStyles.left;
        }
        
        if (header) {
            var noColoredHeader = CONFIG.design === 'minimal' || CONFIG.design === 'professional' || CONFIG.design === 'gradient' || CONFIG.design === 'friendly';
            if (!noColoredHeader) header.style.background = color;
            var titleEl = document.getElementById('linochat-title');
            if (titleEl) titleEl.textContent = CONFIG.widget_title || CONFIG.company_name;
        }
        
        if (sendBtn) {
            sendBtn.style.background = (CONFIG.design === 'gradient' && CONFIG.gradient) ? CONFIG.gradient : color;
        }
    }
    
    function getSessionMetadata() {
        return {
            customer_id: CUSTOMER_ID,
            current_page: (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : '',
            referrer: (typeof document !== 'undefined' && document.referrer) ? document.referrer : '',
            user_agent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : ''
        };
    }
    
    // Initialize or get chat - use JSONP (bypasses CSP fetch), fallback to fetch
    function initChat() {
        var sessionMeta = getSessionMetadata();
        return initChatJsonp().catch(function() {
            var body = Object.assign({}, sessionMeta);
            body.customer_id = body.customer_id || CUSTOMER_ID;
            return fetch(API_URL + '/api/widget/' + WIDGET_ID + '/init', {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, FETCH_HEADERS),
                body: JSON.stringify(body)
            })
            .then(function(r) { return r.json(); })
            .then(processInitResponse);
        });
    }
    
    function processInitResponse(data) {
        if (data.success) {
            CHAT_ID = data.data.chat_id;
            CHAT_STATUS = data.data.status;
            CUSTOMER_ID = data.data.customer_id;
            localStorage.setItem('linochat_customer_id', CUSTOMER_ID);
            MESSAGES = data.data.messages || [];
            connectWebSocket();
            startPollingMessages();
            return data.data;
        }
        throw new Error('Failed to init chat');
    }
    
    function initChatJsonp() {
        return new Promise(function(resolve, reject) {
            var cb = 'linochat_init_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            var script = document.createElement('script');
            var done = false;
            var meta = getSessionMetadata();
            var url = API_URL + '/api/widget/' + WIDGET_ID + '/init?callback=' + encodeURIComponent(cb) + '&customer_id=' + encodeURIComponent(meta.customer_id || CUSTOMER_ID || '');
            if (meta.current_page) url += '&current_page=' + encodeURIComponent(meta.current_page);
            if (meta.referrer) url += '&referrer=' + encodeURIComponent(meta.referrer);
            if (meta.user_agent) url += '&user_agent=' + encodeURIComponent(meta.user_agent.substring(0, 500));
            function finish(err, data) {
                if (done) return;
                done = true;
                delete window[cb];
                if (script.parentNode) script.parentNode.removeChild(script);
                if (err) reject(err);
                else resolve(processInitResponse(data));
            }
            window[cb] = function(data) { finish(null, data); };
            script.onerror = function() { finish(new Error('Init script failed to load')); };
            script.onload = function() {
                if (!done) finish(new Error('Init callback never fired'));
            };
            script.src = url;
            document.head.appendChild(script);
        });
    }
    
    // Send message - try fetch first, fallback to JSONP when CSP blocks fetch
    function sendMessage(content) {
        addMessage(content, 'customer');
        // Track sent content so poll can dedup (optimistic messages have no ID)
        if (!window._lcSentMsgs) window._lcSentMsgs = {};
        window._lcSentMsgs[content] = true;

        return sendMessageFetch(content).catch(function() {
            return sendMessageJsonp(content);
        }).catch(function() {
            addMessage('Sorry, we could not send your message. Please check your connection and try again.', 'system');
        });
    }
    
    function processSendResponse(data) {
        if (data.success && data.data) {
            // Track the customer message and AI response IDs so poll skips them
            if (data.data.message && data.data.message.id) {
                ADDED_MESSAGE_IDS[data.data.message.id] = true;
                NOTIFIED_MSG_IDS[data.data.message.id] = true;
            }
            if (data.data.ai_response) {
                if (data.data.ai_response.id) NOTIFIED_MSG_IDS[data.data.ai_response.id] = true;
                addMessage(data.data.ai_response.content, 'ai', data.data.ai_response.id, true);
            }
            return;
        }
        var errMsg = data.message || (data.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(' ') : null) || 'Sorry, something went wrong. Please try again.';
        addMessage(errMsg, 'system');
    }
    
    function sendMessageFetch(content) {
        return fetch(API_URL + '/api/widget/' + WIDGET_ID + '/message', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, FETCH_HEADERS),
            body: JSON.stringify({ chat_id: CHAT_ID, customer_id: CUSTOMER_ID, message: content })
        })
        .then(function(r) {
            if (!r.ok) console.warn('LinoChat: Send message returned', r.status, r.statusText);
            return r.json();
        })
        .then(function(data) {
            if (!data.success) console.warn('LinoChat: API error', data);
            processSendResponse(data);
            return data;
        })
        .catch(function(err) {
            console.error('LinoChat: Send message failed (trying fallback)', err);
            throw err;
        });
    }

    function sendMessageJsonp(content) {
        if (content.length > 500) {
            addMessage('Message too long for fallback mode. Please shorten your message.', 'ai');
            return Promise.resolve();
        }
        return new Promise(function(resolve, reject) {
            var cb = 'linochat_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            var script = document.createElement('script');
            var url = API_URL + '/api/widget/' + WIDGET_ID + '/message?callback=' + encodeURIComponent(cb) +
                '&chat_id=' + encodeURIComponent(CHAT_ID) + '&customer_id=' + encodeURIComponent(CUSTOMER_ID) +
                '&message=' + encodeURIComponent(content);
            var done = false;
            function finish(data) {
                if (done) return;
                done = true;
                delete window[cb];
                if (script.parentNode) script.parentNode.removeChild(script);
                processSendResponse(data || { success: false });
                resolve(data);
            }
            window[cb] = finish;
            script.onerror = function() {
                finish({ success: false, message: 'Failed to send message' });
            };
            script.src = url;
            document.head.appendChild(script);
        });
    }
    
    function getCfgFontSize() { return (CONFIG && CONFIG.font_size ? CONFIG.font_size : 14) + 'px'; }

    function getMsgStyles() {
        var c = CONFIG ? (CONFIG.color || '#155dfc') : '#155dfc';
        // Use gradient for customer bubbles if gradient design is active
        var customerBg = (CONFIG && CONFIG.design === 'gradient' && CONFIG.gradient) ? CONFIG.gradient : c;
        var fs = getCfgFontSize();
        return {
            base: 'max-width:80%;min-width:60px;padding:10px 14px;border-radius:12px;word-wrap:break-word;font-size:' + fs + ';line-height:1.4;display:flex;flex-direction:column',
            customer: 'background:' + customerBg + ';color:white;align-self:flex-end;border-bottom-right-radius:4px',
            ai: 'background:#faf5ff;color:#111827;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.1);border:1px solid #f3e8ff',
            agent: 'background:white;color:#111827;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.1)',
            system: 'background:#f3f4f6;color:#6b7280;align-self:center;font-size:12px;font-style:italic'
        };
    }
    
    function addMessage(content, type, messageId, playSound, metadata) {
        var container = document.getElementById('linochat-messages');
        if (!container) return;
        
        var welcomeEl = document.getElementById('linochat-welcome');
        if (welcomeEl) welcomeEl.remove();
        
        // Skip if already added (avoids duplicate from API response + WebSocket arriving in either order)
        if (messageId && ADDED_MESSAGE_IDS[messageId]) return;
        if (messageId) ADDED_MESSAGE_IDS[messageId] = true;
        if (playSound && (type === 'ai' || type === 'agent')) playIncomingMessageSound();
        
        var typing = document.getElementById('linochat-typing');
        if (typing) typing.remove();
        var aiTyping = document.getElementById('linochat-ai-typing');
        if (aiTyping) aiTyping.remove();
        
        if (type === 'system') {
            var wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex;justify-content:center;align-items:center;margin:8px 0';
            var pill = document.createElement('span');
            pill.style.cssText = 'font-size:12px;color:#6a7282;background:#f3f4f6;padding:4px 12px;border-radius:9999px';
            pill.textContent = content;
            wrapper.appendChild(pill);
            container.appendChild(wrapper);
            container.scrollTop = container.scrollHeight;
            return;
        }
        
        var msg = document.createElement('div');
        var styles = getMsgStyles();
        var typeStyle = styles[type] || styles.ai;
        msg.style.cssText = styles.base + ';' + typeStyle;
        
        if (type === 'ai' || type === 'agent') {
            var name = document.createElement('div');
            name.textContent = type === 'ai' ? ((CONFIG && CONFIG.ai_name) || 'Lino') : 'Agent';
            name.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:4px';
            msg.appendChild(name);
        }
        
        var text = document.createElement('div');
        text.textContent = content;
        msg.appendChild(text);

        // Feedback buttons for AI messages
        if (type === 'ai' && messageId) {
            var fbWrap = document.createElement('div');
            fbWrap.style.cssText = 'display:flex;gap:4px;margin-top:6px';
            ['👍', '👎'].forEach(function(emoji, idx) {
                var fb = document.createElement('button');
                fb.textContent = emoji;
                fb.style.cssText = 'background:none;border:1px solid #e5e7eb;border-radius:4px;padding:2px 8px;font-size:12px;cursor:pointer;opacity:0.6;transition:opacity 0.2s';
                fb.onmouseover = function() { fb.style.opacity = '1'; };
                fb.onmouseout = function() { fb.style.opacity = '0.6'; };
                fb.onclick = function() {
                    var feedbackType = idx === 0 ? 'positive' : 'negative';
                    fetch(API_URL + '/api/widget/' + WIDGET_ID + '/message-feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message_id: messageId, customer_id: CUSTOMER_ID, feedback: feedbackType })
                    }).catch(function() {});
                    fbWrap.innerHTML = '<span style="font-size:11px;color:#9ca3af;">Thanks!</span>';
                };
                fbWrap.appendChild(fb);
            });
            msg.appendChild(fbWrap);
        }

        var atts = (metadata && metadata.attachments) ? metadata.attachments : [];
        if (atts.length > 0) {
            var attWrap = document.createElement('div');
            attWrap.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:6px';
            atts.forEach(function(a) {
                var link = document.createElement('a');
                link.href = a.url || '#';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'View: ' + (a.name || 'attachment');
                link.style.cssText = 'font-size:12px;color:#4F46E5;text-decoration:underline;cursor:pointer';
                attWrap.appendChild(link);
            });
            msg.appendChild(attWrap);
        }
        
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }
    
    // Update initial button with config (color, position, text, design shape) - called when config preload completes
    function updateButtonAppearance() {
        var button = document.getElementById('linochat-button');
        if (!button || !CONFIG) return;
        var color = CONFIG.color || '#4F46E5';
        var design = CONFIG.design || 'modern';
        var position = CONFIG.position || 'bottom-right';
        var posStyles = POSITION_STYLES[position] || POSITION_STYLES['bottom-right'];
        // Apply design-specific button shape
        if (design === 'gradient') {
            button.style.background = CONFIG.gradient || 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)';
            button.style.width = '67px'; button.style.height = '67px'; button.style.borderRadius = '9999px';
            button.innerHTML = DEFAULT_ICON;
        } else if (design === 'friendly') {
            button.style.background = color;
            button.style.width = '77px'; button.style.height = '77px'; button.style.borderRadius = '16px';
            button.style.flexDirection = 'column';
            button.style.fontSize = '20px';
            button.innerHTML = DEFAULT_ICON + '<span style="font-size:9px;display:block;margin-top:2px;font-weight:500;">Help</span>';
        } else if (design === 'bubble') {
            button.style.background = color;
            button.style.width = '77px'; button.style.height = '77px'; button.style.borderRadius = '9999px';
            button.style.border = '4px solid white';
            button.innerHTML = DEFAULT_ICON;
        } else if (design === 'classic') {
            button.style.background = color;
            button.style.width = '96px'; button.style.height = '53px'; button.style.borderRadius = '4px';
            button.style.fontSize = '14px';
            button.innerHTML = DEFAULT_ICON + ' Chat';
        } else if (design === 'compact') {
            button.style.background = color;
            button.style.width = '53px'; button.style.height = '53px'; button.style.borderRadius = '10px';
            button.innerHTML = DEFAULT_ICON;
        } else if (design === 'minimal') {
            button.style.background = color;
            button.style.width = '58px'; button.style.height = '58px'; button.style.borderRadius = '9999px';
            button.innerHTML = DEFAULT_ICON;
        } else {
            // modern, professional
            button.style.background = color;
            button.style.width = '67px'; button.style.height = '67px'; button.style.borderRadius = '9999px';
            button.innerHTML = DEFAULT_ICON;
        }
        button.style.bottom = posStyles.bottom;
        button.style.right = posStyles.right;
        button.style.top = posStyles.top;
        button.style.left = posStyles.left;
        if (WIDGET_ELEMENT) WIDGET_ELEMENT.style.setProperty('--linochat-color', color);
    }
    
    // Create lightweight button only (shown before user clicks - no config/chat loaded)
    function createButtonOnly() {
        var existing = document.getElementById('linochat-widget');
        if (existing) existing.remove();
        var pos = POSITION_STYLES['bottom-right'];
        var posStr = Object.keys(pos).map(function(k) { return k + ':' + pos[k]; }).join(';');
        var div = document.createElement('div');
        div.id = 'linochat-widget';
        div.style.cssText = 'box-sizing:border-box';
        div.innerHTML = '<div id="linochat-button" style="box-sizing:border-box;position:fixed;width:67px;height:67px;border-radius:9999px;background:#4F46E5;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);z-index:2147483647;font-size:24px;' + posStr + ';transition:transform 0.2s ease,box-shadow 0.2s ease"><\/div>';
        document.body.appendChild(div);
        WIDGET_ELEMENT = div;
        var btn = document.getElementById('linochat-button');
        btn.innerHTML = DEFAULT_ICON;
        btn.addEventListener('mouseenter', function() { btn.style.transform = 'scale(1.1)'; });
        btn.addEventListener('mouseleave', function() { btn.style.transform = 'scale(1)'; });
        btn.addEventListener('click', function onFirstClick() {
            if (CHAT_INITIALIZED) return;
            var greetBubble = document.getElementById('linochat-greeting');
            if (greetBubble) greetBubble.remove();
            btn.style.pointerEvents = 'none';

            var doOpen = function() {
                createWidget(true);
                CHAT_INITIALIZED = true;
                SETTINGS_CHECK_INTERVAL = setInterval(checkSettingsUpdate, 30000);
                startHeartbeat();
            };

            var onError = function(err) {
                console.error('LinoChat Widget Error:', err);
                btn.innerHTML = DEFAULT_ICON;
                btn.style.pointerEvents = 'auto';
            };

            if (CHAT_INIT_PROMISE) {
                // Chat is already being initialized in background — open as soon as it resolves
                CHAT_INIT_PROMISE.then(doOpen).catch(function() {
                    // Pre-init failed, try again
                    initChat().then(doOpen).catch(onError);
                });
            } else {
                // Fallback: config didn't load yet, do full init now
                btn.textContent = '...';
                loadConfig()
                    .then(function() { return initChat(); })
                    .then(doOpen)
                    .catch(onError);
            }
        });
    }
    
    // Create widget HTML (openImmediately: open chat window right after creation, e.g. when user clicked to init)
    function createWidget(openImmediately) {
        var existing = document.getElementById('linochat-widget');
        if (existing) existing.remove();

        var color = CONFIG.color || '#4F46E5';
        var position = CONFIG.position || 'bottom-right';
        var design = CONFIG.design || 'modern';
        var posStyles = POSITION_STYLES[position] || POSITION_STYLES['bottom-right'];
        var buttonText = CONFIG.button_text || DEFAULT_ICON;
        var title = CONFIG.widget_title || CONFIG.company_name;

        var posStr = Object.keys(posStyles).map(function(k) { return k + ':' + posStyles[k]; }).join(';');
        var winBottom = posStyles.bottom !== 'auto' ? 'bottom:88px;' : 'top:88px;';
        var winSide = posStyles.right !== 'auto' ? 'right:' + posStyles.right + ';' : 'left:' + posStyles.left + ';';

        // Design-specific variables
        var btnW = 67, btnH = 67, btnRadius = '9999px', btnFontSize = '22px';
        var btnBorder = '', btnContent = DEFAULT_ICON, btnBg = color;
        var winW = 320, winRadius = '8px', msgBg = '#f9fafb';
        var headerHTML = '';

        if (design === 'minimal') {
            btnW = 58; btnH = 58;
            winW = 288; winRadius = '4px'; msgBg = '#ffffff';
            headerHTML = '<div id="linochat-header" style="background:white;color:#111827;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb;">'
                + '<span id="linochat-title" style="font-size:14px;font-weight:500;">' + title + '</span>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:18px;color:#9ca3af;line-height:1;">×</span>'
                + '<span id="linochat-status" style="display:none;"></span>'
                + '</div>';
        } else if (design === 'classic') {
            btnW = 96; btnH = 53; btnRadius = '4px'; btnFontSize = '14px'; btnContent = DEFAULT_ICON + ' Chat';
            winW = 320; winRadius = '0px'; msgBg = '#f9fafb';
            headerHTML = '<div id="linochat-header" style="background:' + color + ';color:white;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">'
                + '<div style="display:flex;align-items:center;gap:8px;">'
                + '<div style="width:8px;height:8px;border-radius:50%;background:#4ade80;flex-shrink:0;"></div>'
                + '<span id="linochat-title" style="font-size:14px;font-weight:500;">Support Chat</span>'
                + '</div>'
                + '<div style="display:flex;align-items:center;gap:8px;">'
                + '<span id="linochat-status" style="font-size:11px;opacity:0.85;"></span>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:20px;opacity:0.8;line-height:1;">×</span>'
                + '</div></div>';
        } else if (design === 'bubble') {
            btnW = 77; btnH = 77; btnBorder = 'border:4px solid white;';
            winW = 320; winRadius = '24px'; msgBg = '#f9fafb';
            headerHTML = '<div id="linochat-header" style="background:' + color + ';color:white;padding:20px 16px;border-radius:24px 24px 0 0;">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;">'
                + '<div style="display:flex;align-items:center;gap:12px;">'
                + '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;">' + HEADER_ICON + '</div>'
                + '<div><div id="linochat-title" style="font-weight:500;font-size:15px;">' + title + '</div><div id="linochat-status" style="font-size:12px;opacity:0.9;">Always here to help</div></div>'
                + '</div>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:22px;opacity:0.8;line-height:1;">×</span>'
                + '</div></div>';
        } else if (design === 'compact') {
            btnW = 53; btnH = 53; btnRadius = '10px'; btnFontSize = '20px';
            winW = 256; winRadius = '8px'; msgBg = '#f9fafb';
            headerHTML = '<div id="linochat-header" style="background:' + color + ';color:white;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">'
                + '<div><span id="linochat-title" style="font-size:12px;font-weight:500;">Chat Support</span><span id="linochat-status" style="font-size:11px;opacity:0.85;margin-left:6px;"></span></div>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:16px;opacity:0.8;line-height:1;">×</span>'
                + '</div>';
        } else if (design === 'professional') {
            winW = 352; winRadius = '4px'; msgBg = '#ffffff';
            headerHTML = '<div id="linochat-header" style="background:#f9fafb;color:#111827;padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb;">'
                + '<div style="display:flex;align-items:center;gap:12px;">'
                + '<div style="width:36px;height:36px;border-radius:4px;background:' + color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + HEADER_ICON + '</div>'
                + '<div><div id="linochat-title" style="font-weight:600;font-size:14px;">' + title + '</div><div id="linochat-status" style="font-size:12px;color:#6b7280;">Typical response: &lt;2 min</div></div>'
                + '</div>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:20px;color:#9ca3af;line-height:1;">×</span>'
                + '</div>';
        } else if (design === 'friendly') {
            btnW = 77; btnH = 77; btnRadius = '16px'; btnFontSize = '20px';
            btnContent = DEFAULT_ICON + '<span style="font-size:9px;display:block;margin-top:2px;font-weight:500;">Help</span>';
            winW = 320; winRadius = '24px'; msgBg = '#f0f6ff';
            headerHTML = '<div id="linochat-header" style="background:' + color + ';color:white;padding:16px;position:relative;overflow:hidden;border-radius:24px 24px 0 0;">'
                + '<div style="position:absolute;top:0;right:0;width:128px;height:128px;background:rgba(255,255,255,0.1);border-radius:50%;margin-right:-64px;margin-top:-64px;"></div>'
                + '<div style="position:relative;display:flex;align-items:center;justify-content:space-between;">'
                + '<div style="display:flex;align-items:center;gap:12px;">'
                + '<div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">' + HEADER_ICON + '</div>'
                + '<div><div id="linochat-title" style="font-weight:600;font-size:15px;">Welcome!</div><div id="linochat-status" style="font-size:12px;opacity:0.9;">We\'re here to help</div></div>'
                + '</div>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:22px;opacity:0.8;line-height:1;">×</span>'
                + '</div></div>';
        } else if (design === 'gradient') {
            var grad = CONFIG.gradient || 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)';
            btnBg = grad;
            winW = 320; winRadius = '12px'; msgBg = 'linear-gradient(135deg,rgba(239,246,255,0.8),rgba(245,243,255,0.8),rgba(253,242,248,0.8))';
            headerHTML = '<div id="linochat-header" style="background:' + grad + ';color:white;padding:16px;">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;">'
                + '<div style="display:flex;align-items:center;gap:10px;">'
                + '<div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;">' + HEADER_ICON + '</div>'
                + '<div><div id="linochat-title" style="font-weight:600;font-size:14px;">' + title + '</div><div id="linochat-status" style="font-size:12px;opacity:0.9;">Online now</div></div>'
                + '</div>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:20px;opacity:0.9;line-height:1;">×</span>'
                + '</div></div>';
        } else {
            // modern (default)
            headerHTML = '<div id="linochat-header" style="background:' + color + ';color:white;padding:16px;display:flex;justify-content:space-between;align-items:center;border-radius:8px 8px 0 0;">'
                + '<div style="display:flex;align-items:center;gap:8px;">'
                + '<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">' + HEADER_ICON + '</div>'
                + '<div><div id="linochat-title" style="font-weight:500;font-size:14px;">' + title + '</div>'
                + '<div id="linochat-status" style="font-size:12px;opacity:0.9;">We\'re online</div></div>'
                + '</div>'
                + '<span id="linochat-close" style="cursor:pointer;font-size:20px;opacity:0.8;line-height:1;">×</span>'
                + '</div>';
        }

        var btnStyle = 'position:fixed;width:' + btnW + 'px;height:' + btnH + 'px;border-radius:' + btnRadius
            + ';background:' + btnBg + ';color:white;display:flex;align-items:center;justify-content:center;cursor:pointer'
            + ';box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);z-index:2147483647'
            + ';font-size:' + btnFontSize + ';' + posStr + ';transition:transform 0.2s ease,box-shadow 0.2s ease;' + btnBorder + 'gap:4px;font-weight:500;box-sizing:border-box;';

        var div = document.createElement('div');
        div.id = 'linochat-widget';
        div.style.cssText = 'box-sizing:border-box;--linochat-color:' + color;
        div.innerHTML = '<div id="linochat-button" style="' + btnStyle + '">' + btnContent + '</div>'
            + '<div id="linochat-window" style="box-sizing:border-box;position:fixed;width:' + winW + 'px;height:480px;background:white;border-radius:' + winRadius
            + ';box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);border:1px solid #e5e7eb;z-index:2147483647'
            + ';display:none;flex-direction:column;overflow:hidden'
            + ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;' + winBottom + winSide + '">'
            + headerHTML
            + '<div id="linochat-messages" style="box-sizing:border-box;flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:' + msgBg + ';"></div>'
            + '<div style="padding:12px;border-top:1px solid #e5e7eb;display:flex;gap:8px;background:white;">'
            + '<input type="text" id="linochat-input" placeholder="Type a message..." style="flex:1;padding:8px 12px;border:1px solid var(--linochat-color,#d1d5db);border-radius:8px;outline:none;font-size:12px;">'
            + '<button id="linochat-send" style="background:' + color + ';color:white;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;">Send</button>'
            + '</div>'
            + '</div>';
        document.body.appendChild(div);
        WIDGET_ELEMENT = div;
        
        var button = document.getElementById('linochat-button');
        var window_ = document.getElementById('linochat-window');
        var closeBtn = document.getElementById('linochat-close');
        var input = document.getElementById('linochat-input');
        var sendBtn = document.getElementById('linochat-send');
        
        function toggleWindow() {
            var isOpen = window_.style.display === 'flex';
            window_.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
                input.focus();
                // Clear all notification bubbles and badge
                document.querySelectorAll('.linochat-unread-bubble').forEach(function(b) { b.remove(); });
                var badge = document.getElementById('linochat-unread-badge');
                if (badge) badge.remove();
            }
        }
        
        button.addEventListener('click', toggleWindow);
        if (openImmediately) {
            window_.style.display = 'flex';
            input.focus();
        }
        closeBtn.addEventListener('click', toggleWindow);
        button.addEventListener('mouseenter', function() { button.style.transform = 'scale(1.1)'; });
        button.addEventListener('mouseleave', function() { button.style.transform = 'scale(1)'; });
        
        // Customer typing indicator - send to backend so agent sees "Customer is typing..."
        function sendCustomerTyping(isTyping) {
            if (!CHAT_ID || !CUSTOMER_ID) return;
            fetch(API_URL + '/api/widget/' + WIDGET_ID + '/typing', {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, FETCH_HEADERS),
                body: JSON.stringify({ chat_id: CHAT_ID, customer_id: CUSTOMER_ID, is_typing: isTyping })
            }).catch(function() {});
            CUSTOMER_TYPING_SENT = isTyping;
        }
        function handleSend() {
            var text = input.value.trim();
            if (!text) return;
            input.value = '';
            if (CUSTOMER_TYPING_SENT) sendCustomerTyping(false);
            sendMessage(text);
        }
        sendBtn.addEventListener('click', handleSend);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSend();
        });
        input.addEventListener('input', function() {
            if (CUSTOMER_TYPING_TIMEOUT) clearTimeout(CUSTOMER_TYPING_TIMEOUT);
            if (!CUSTOMER_TYPING_SENT) sendCustomerTyping(true);
            CUSTOMER_TYPING_TIMEOUT = setTimeout(function() {
                sendCustomerTyping(false);
                CUSTOMER_TYPING_TIMEOUT = null;
            }, 2000);
        });
        input.addEventListener('blur', function() {
            if (CUSTOMER_TYPING_TIMEOUT) { clearTimeout(CUSTOMER_TYPING_TIMEOUT); CUSTOMER_TYPING_TIMEOUT = null; }
            if (CUSTOMER_TYPING_SENT) sendCustomerTyping(false);
        });
        
        MESSAGES.forEach(function(m) {
            var type = m.sender_type === 'customer' ? 'customer' :
                      m.sender_type === 'system' ? 'system' :
                      m.sender_type === 'ai' ? 'ai' : 'agent';
            if (m.sender_type === 'system' && / has joined the chat\.$/.test(m.content)) ADDED_MESSAGE_IDS['agent-joined'] = true;
            if (m.id) NOTIFIED_MSG_IDS[m.id] = true;
            addMessage(m.content, type, m.id, false, m.metadata);
        });
        
        if (MESSAGES.length === 0) {
            var welcomeMsg = CONFIG.welcome_message || "Hi! How can we help you today?";
            var welcomeEl = document.createElement('div');
            welcomeEl.id = 'linochat-welcome';
            welcomeEl.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin-bottom:12px';
            welcomeEl.innerHTML = '<div style="width:24px;height:24px;border-radius:9999px;background:#d1d5db;flex-shrink:0"><\/div><div style="background:white;border-radius:8px;border-top-left-radius:0;padding:12px;max-width:80%;box-shadow:0 1px 2px rgba(0,0,0,0.05);font-size:' + getCfgFontSize() + ';line-height:1.4;color:#111827">' + welcomeMsg.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '<\/div>';
            document.getElementById('linochat-messages').appendChild(welcomeEl);
        }
        
        if (!openImmediately && CONFIG.auto_open && !localStorage.getItem('linochat_auto_opened')) {
            setTimeout(function() {
                window_.style.display = 'flex';
                localStorage.setItem('linochat_auto_opened', 'true');
            }, (CONFIG.auto_open_delay || 5) * 1000);
        }
        
        // Start polling when waiting for agent (fallback when WebSocket fails to deliver "X has joined")
        if (CHAT_STATUS === 'waiting') startPollingWhenWaiting();
        // Poll for new messages (agent, AI) when chat is active - fallback when WebSocket fails
        startPollingMessages();
        
        // Check if we need to collect contact info for ticket
        setTimeout(checkAndRequestTicket, 60000); // Check after 1 minute
    }
    
    // Check if agents are busy and request ticket creation
    function checkAndRequestTicket() {
        if (!CHAT_ID || CHAT_STATUS !== 'waiting') return;
        
        fetch(API_URL + '/api/widget/' + WIDGET_ID + '/check-ticket-needed', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, FETCH_HEADERS),
            body: JSON.stringify({
                chat_id: CHAT_ID,
                customer_id: CUSTOMER_ID
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success && data.data.create_ticket) {
                showContactForm();
            }
        })
        .catch(function(e) {
            console.error('LinoChat: Failed to check ticket needed', e);
        });
    }
    
    // Show contact form for ticket creation
    function showContactForm() {
        var container = document.getElementById('linochat-messages');
        if (!container) return;
        
        // Add AI message explaining the situation
        var msg = document.createElement('div');
        var s = getMsgStyles();
        msg.style.cssText = s.base + ';' + s.ai;
        var aiLabel = (CONFIG && CONFIG.ai_name) || 'Lino';
        msg.innerHTML = '<div style="font-size:12px;color:#6b7280;margin-bottom:4px">' + aiLabel + '</div><div>All our agents are currently busy. To ensure your request is handled promptly, please leave your contact information and we\'ll get back to you via email.</div>';
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        
        // Create contact form
        var form = document.createElement('div');
        form.id = 'linochat-contact-form';
        form.style.cssText = 'background: #f9fafb; padding: 16px; border-radius: 12px; margin: 12px 0;';
        form.innerHTML = `
            <div style="margin-bottom: 12px;">
                <input type="email" id="linochat-email" placeholder="Your email address" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 8px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 12px;">
                <input type="text" id="linochat-name" placeholder="Your name (optional)" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
            </div>
            <button id="linochat-submit-ticket" style="background: \${CONFIG.color || '#4F46E5'}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%;">Submit Request</button>
        `;
        container.appendChild(form);
        container.scrollTop = container.scrollHeight;
        
        // Handle form submission
        document.getElementById('linochat-submit-ticket').addEventListener('click', function() {
            var email = document.getElementById('linochat-email').value.trim();
            var name = document.getElementById('linochat-name').value.trim();
            
            if (!email) {
                alert('Please enter your email address');
                return;
            }
            
            submitTicketRequest(email, name);
        });
    }
    
    // Submit ticket request
    function submitTicketRequest(email, name) {
        fetch(API_URL + '/api/widget/' + WIDGET_ID + '/create-ticket', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, FETCH_HEADERS),
            body: JSON.stringify({
                chat_id: CHAT_ID,
                customer_id: CUSTOMER_ID,
                email: email,
                name: name
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                // Remove form
                var form = document.getElementById('linochat-contact-form');
                if (form) form.remove();
                
                // Show confirmation
                addMessage(data.data.ai_response.content, 'ai');
                
                // Disable input
                var input = document.getElementById('linochat-input');
                var sendBtn = document.getElementById('linochat-send');
                if (input) input.disabled = true;
                if (sendBtn) sendBtn.disabled = true;
            }
        })
        .catch(function(e) {
            console.error('LinoChat: Failed to create ticket', e);
            alert('Failed to submit request. Please try again.');
        });
    }
    
    // Show greeting bubble above the chat button
    function showGreeting() {
        if (!CONFIG || !CONFIG.greeting_enabled || !CONFIG.greeting_message) return;
        var delay = (CONFIG.greeting_delay || 0) * 1000;
        setTimeout(function() {
            if (CHAT_INITIALIZED) return;
            var btn = document.getElementById('linochat-button');
            if (!btn) return;
            var existing = document.getElementById('linochat-greeting');
            if (existing) return;

            var bubble = document.createElement('div');
            bubble.id = 'linochat-greeting';
            var posStyles = POSITION_STYLES[CONFIG.position || 'bottom-right'] || POSITION_STYLES['bottom-right'];
            var isLeft = posStyles.left !== 'auto';
            var isTop = posStyles.top !== 'auto';
            var sideStyle = isLeft ? 'left:' + (posStyles.left || '20px') + ';' : 'right:' + (posStyles.right || '20px') + ';';
            var vertStyle = isTop ? 'top:' + (parseInt(posStyles.top || '20') + 74) + 'px;' : 'bottom:' + (parseInt(posStyles.bottom || '20') + 74) + 'px;';
            var arrowSide = isLeft ? 'left:20px' : 'right:20px';

            bubble.style.cssText = 'position:fixed;' + sideStyle + vertStyle + 'background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:12px 32px 12px 14px;width:220px;font-size:' + getCfgFontSize() + ';line-height:1.5;color:#111;z-index:2147483646;cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;';
            bubble.innerHTML = '<span>' + CONFIG.greeting_message + '<\/span>' +
                '<button id="linochat-greeting-close" style="position:absolute;top:6px;right:8px;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;line-height:1;padding:0;" aria-label="Close">\u00d7<\/button>' +
                '<div style="position:absolute;' + (isTop ? 'top:-6px;' : 'bottom:-6px;') + arrowSide + ';width:12px;height:12px;background:#fff;transform:rotate(45deg);box-shadow:' + (isTop ? '-2px -2px 4px' : '2px 2px 4px') + ' rgba(0,0,0,.08);"><\/div>';

            document.body.appendChild(bubble);

            requestAnimationFrame(function() {
                bubble.style.opacity = '1';
                bubble.style.transform = 'translateY(0)';
            });

            document.getElementById('linochat-greeting-close').addEventListener('click', function(e) {
                e.stopPropagation();
                bubble.remove();
            });
            bubble.addEventListener('click', function() {
                bubble.remove();
                var btn2 = document.getElementById('linochat-button');
                if (btn2) btn2.click();
            });
        }, delay);
    }

    // Open chat from popover or greeting
    function openChat() {
        var btn = document.getElementById('linochat-button');
        if (btn) btn.click();
    }

    // Popover system
    function showPopover() {
        if (!CONFIG || !CONFIG.popover || !CONFIG.popover.enabled) return;
        var po = CONFIG.popover;
        var SK = 'linochat_popover_shown';
        var maxDisplays = po.max_displays_per_session || 1;
        var shown = parseInt(sessionStorage.getItem(SK) || '0', 10);
        if (shown >= maxDisplays) return;
        // Page targeting
        if (po.show_on_pages === 'specific' && po.page_urls && po.page_urls.length > 0) {
            var path = window.location.pathname;
            var match = po.page_urls.some(function(u) { return path.indexOf(u) !== -1; });
            if (!match) return;
        }
        // Overlay style from config
        var overlayType = po.overlay || 'dark';
        var overlayBg = overlayType === 'dark' ? 'rgba(0,0,0,0.3)' : overlayType === 'light' ? 'rgba(255,255,255,0.5)' : 'transparent';
        var overlayBlur = po.overlay_blur ? 'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);' : '';
        function render() {
            if (document.getElementById('linochat-popover')) return;
            var overlay = document.createElement('div');
            overlay.id = 'linochat-popover';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:' + overlayBg + ';' + overlayBlur;
            var color = CONFIG.color || '#4F46E5';
            var html = buildPopoverHTML(po, color);
            overlay.innerHTML = html;
            document.body.appendChild(overlay);
            sessionStorage.setItem(SK, String(shown + 1));
            // Close handlers
            overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopover(); });
            var closeBtn = overlay.querySelector('[data-popover-close]');
            if (closeBtn) closeBtn.addEventListener('click', closePopover);
            // Button handlers
            var btns = overlay.querySelectorAll('[data-popover-action]');
            for (var i = 0; i < btns.length; i++) {
                (function(btn) {
                    btn.addEventListener('click', function() {
                        var action = btn.getAttribute('data-popover-action');
                        var url = btn.getAttribute('data-popover-url');
                        closePopover();
                        if (action === 'open_chat') { openChat(); }
                        else if (action === 'url' && url) { window.open(url, '_blank'); }
                    });
                })(btns[i]);
            }
        }
        function closePopover() {
            var el = document.getElementById('linochat-popover');
            if (el) el.remove();
        }
        var trigger = po.trigger || 'delay';
        if (trigger === 'immediate') { render(); }
        else if (trigger === 'delay') { setTimeout(render, (po.trigger_delay || 3) * 1000); }
        else if (trigger === 'scroll') {
            var fired = false;
            window.addEventListener('scroll', function() {
                if (fired) return;
                var pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                if (pct >= (po.trigger_scroll_percent || 50)) { fired = true; render(); }
            });
        } else if (trigger === 'exit_intent') {
            document.addEventListener('mouseout', function(e) {
                if (e.clientY < 5 && !document.getElementById('linochat-popover')) { render(); }
            });
        }
    }
    function buildPopoverHTML(po, color) {
        var h = po.heading || ''; var d = po.description || '';
        var p1 = po.primary_button || {}; var p2 = po.secondary_button || {};
        var badge = po.badge_text || 'SUPPORT ONLINE';
        var status = po.show_online_status !== false ? po.online_status_text || 'Support Online' : '';
        var closeX = '<button data-popover-close style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:18px;cursor:pointer;color:#999;line-height:1;">&times;</button>';
        var p1Btn = p1.action !== 'none' ? '<button data-popover-action="' + (p1.action||'open_chat') + '" data-popover-url="' + (p1.url||'') + '" style="STYLE_P1">' + (p1.text||'') + '</button>' : '';
        var p2Btn = p2.action !== 'none' ? '<button data-popover-action="' + (p2.action||'open_chat') + '" data-popover-url="' + (p2.url||'') + '" style="STYLE_P2">' + (p2.text||'') + '</button>' : '';
        var statusHTML = status ? '<div style="STYLE_STATUS"><span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50;margin-right:6px;"></span>' + status + '</div>' : '';
        var design = po.design || 'modern';
        if (design === 'urgent') {
            p1Btn = p1Btn.replace('STYLE_P1', 'width:100%;padding:12px;background:'+color+';color:white;border:none;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;text-transform:uppercase;');
            p2Btn = p2Btn.replace('STYLE_P2', 'width:100%;padding:12px;background:white;color:#333;border:1px solid #ddd;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;text-transform:uppercase;');
            statusHTML = statusHTML.replace('STYLE_STATUS', 'text-align:center;padding:10px;border-top:1px solid #eee;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;');
            return '<div style="position:relative;width:380px;background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;border-top:4px solid #f59e0b;">' + closeX + '<div style="padding:24px;">' + '<div style="margin-bottom:12px;"><span style="background:#fef3c7;color:#d97706;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">⚡ ' + badge + '</span></div>' + '<h3 style="font-size:18px;font-weight:800;color:#111;margin:0 0 6px;text-transform:uppercase;">' + h + '</h3>' + '<p style="font-size:14px;color:#666;margin:0 0 16px;">' + d + '</p>' + '<div style="display:flex;flex-direction:column;gap:8px;">' + p1Btn + p2Btn + '</div></div>' + statusHTML + '</div>';
        }
        if (design === 'luxury') {
            p1Btn = p1Btn.replace('STYLE_P1', 'width:100%;padding:16px;background:white;color:#444;border:1px solid #ccc;font-size:11px;font-weight:600;cursor:pointer;text-transform:uppercase;letter-spacing:2px;');
            p2Btn = p2Btn.replace('STYLE_P2', 'width:100%;padding:16px;background:#1a1a2e;color:white;border:none;font-size:11px;font-weight:600;cursor:pointer;text-transform:uppercase;letter-spacing:2px;');
            return '<div style="position:relative;width:420px;background:#faf9f6;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;border-top:3px solid #b8860b;">' + closeX + '<div style="padding:40px;text-align:center;">' + '<div style="font-size:28px;margin-bottom:16px;">🏠</div>' + '<h3 style="font-size:24px;color:#333;margin:0 0 12px;font-family:Georgia,serif;font-style:italic;">' + h + '</h3>' + '<div style="width:48px;height:1px;background:#ccc;margin:0 auto 12px;"></div>' + '<p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px;">' + d + '</p>' + '<div style="display:flex;flex-direction:column;gap:12px;">' + p1Btn + p2Btn + '</div>' + '<div style="margin-top:20px;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:2px;">Exclusivity Guaranteed</div></div></div>';
        }
        if (design === 'bold') {
            p1Btn = p1Btn.replace('STYLE_P1', 'width:100%;padding:18px;background:'+color+';color:white;border:none;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px;');
            p2Btn = p2Btn.replace('STYLE_P2', 'width:100%;padding:18px;background:white;color:'+color+';border:2px solid '+color+';font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px;');
            statusHTML = statusHTML.replace('STYLE_STATUS', 'text-align:center;margin-top:8px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;');
            return '<div style="position:relative;width:380px;background:white;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;border:3px solid '+color+';">' + closeX + '<div style="padding:36px;text-align:center;">' + '<h3 style="font-size:26px;font-weight:800;color:'+color+';margin:0 0 20px;">' + h + '</h3>' + '<div style="display:flex;flex-direction:column;gap:12px;">' + p1Btn + p2Btn + '</div>' + statusHTML + '</div></div>';
        }
        if (design === 'minimal') {
            p1Btn = p1Btn.replace('STYLE_P1', 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;background:white;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#374151;cursor:pointer;text-align:left;');
            p2Btn = p2Btn.replace('STYLE_P2', 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;background:white;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#374151;cursor:pointer;text-align:left;');
            var badgeHTML = (po.show_online_status !== false) ? '<div style="text-align:center;margin-bottom:8px;"><span style="display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;color:#16a34a;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:500;border:1px solid #bbf7d0;"><span style="width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block;"></span>' + badge + '</span></div>' : '';
            return '<div style="position:relative;width:360px;background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.12);overflow:hidden;border:1px solid #e5e7eb;">' + closeX + '<div style="padding:24px;">' + badgeHTML + '<h3 style="font-size:18px;font-weight:600;color:#111;margin:0 0 6px;text-align:center;">' + h + '</h3>' + '<p style="font-size:13px;color:#6b7280;margin:0 0 16px;text-align:center;">' + d + '</p>' + '<div style="display:flex;flex-direction:column;gap:8px;">' + (p1.action !== 'none' ? '<button data-popover-action="'+(p1.action||'open_chat')+'" data-popover-url="'+(p1.url||'')+'" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;background:white;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#374151;cursor:pointer;text-align:left;"><span>📅 '+(p1.text||'')+'</span><span style="color:#9ca3af;">›</span></button>' : '') + (p2.action !== 'none' ? '<button data-popover-action="'+(p2.action||'open_chat')+'" data-popover-url="'+(p2.url||'')+'" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;background:white;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#374151;cursor:pointer;text-align:left;"><span>❓ '+(p2.text||'')+'</span><span style="color:#9ca3af;">›</span></button>' : '') + '</div></div></div>';
        }
        // modern (default)
        p1Btn = p1Btn.replace('STYLE_P1', 'width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:white;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;text-align:left;font-size:14px;color:#111;');
        p2Btn = p2Btn.replace('STYLE_P2', 'width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:white;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;text-align:left;font-size:14px;color:#111;');
        statusHTML = statusHTML.replace('STYLE_STATUS', 'display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:12px 24px;border-top:1px solid #f3f4f6;font-size:12px;color:#22c55e;font-weight:500;');
        return '<div style="position:relative;width:400px;background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;border-top:4px solid '+color+';">' + closeX + '<div style="padding:24px;">' + '<h3 style="font-size:20px;font-weight:600;color:#111;margin:0 0 6px;">' + h + '</h3>' + '<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">' + d + '</p>' + '<div style="display:flex;flex-direction:column;gap:8px;">' + (p1.action !== 'none' ? '<button data-popover-action="'+(p1.action||'open_chat')+'" data-popover-url="'+(p1.url||'')+'" style="width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:white;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;text-align:left;"><span style="width:36px;height:36px;border-radius:8px;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:16px;color:white;">📅</span><div><div style="font-size:14px;font-weight:600;color:#111;">'+(p1.text||'')+'</div><div style="font-size:12px;color:#6b7280;">Book a pro when the job needs extra hands.</div></div><span style="margin-left:auto;color:#9ca3af;">›</span></button>' : '') + (p2.action !== 'none' ? '<button data-popover-action="'+(p2.action||'open_chat')+'" data-popover-url="'+(p2.url||'')+'" style="width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:white;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;text-align:left;"><span style="width:36px;height:36px;border-radius:8px;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:16px;color:white;">💬</span><div><div style="font-size:14px;font-weight:600;color:#111;">'+(p2.text||'')+'</div><div style="font-size:12px;color:#6b7280;">Quick advice for those tricky moments.</div></div><span style="margin-left:auto;color:#9ca3af;">›</span></button>' : '') + '</div></div>' + statusHTML + '</div>';
    }

    // Initialize (guard against duplicate script loads) - only show button; full init on first click
    function init() {
        if (window.__linochat_init_done) return;
        window.__linochat_init_done = true;
        injectStyles();
        // Load config first so the button appears with correct design/color immediately (no flash of default)
        loadConfig()
            .then(function() {
                if (CONFIG && CONFIG.widget_active === false) return; // Widget disabled by owner
                // Offline handling based on schedule
                if (CONFIG && CONFIG.is_online === false) {
                    var ob = CONFIG.offline_behavior || 'hide';
                    if (ob === 'hide') return; // Don't render widget at all
                    // For other offline behaviors, show button with offline indicator
                    createButtonOnly();
                    updateButtonAppearance();
                    // Add offline indicator dot to button
                    var btn = document.getElementById('linochat-button');
                    if (btn) {
                        var dot = document.createElement('span');
                        dot.style.cssText = 'position:absolute;top:4px;right:4px;width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid white;';
                        btn.style.position = 'relative';
                        btn.appendChild(dot);
                    }
                    return;
                }
                createButtonOnly();
                updateButtonAppearance();
                showGreeting();
                showPopover();
                // Pre-initialize chat in background so clicking opens instantly
                CHAT_INIT_PROMISE = initChat().catch(function() { CHAT_INIT_PROMISE = null; });
            })
            .catch(function() { createButtonOnly(); });
    }
    
    // Cleanup
    window.addEventListener('beforeunload', function() {
        if (SETTINGS_CHECK_INTERVAL) clearInterval(SETTINGS_CHECK_INTERVAL);
        stopHeartbeat();
        if (PUSHER) PUSHER.disconnect();
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
JS;

        return $this->widgetScriptResponse($js, 0);
    }
    
    /**
     * Serve widget CSS
     */
    public function style()
    {
        $css = <<<CSS
/* LinoChat Widget Styles */
#linochat-widget * {
    box-sizing: border-box;
}

#linochat-button:hover {
    transform: scale(1.1);
}

.linochat-message {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 12px;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
}

.linochat-message-customer {
    background: #155dfc;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}

.linochat-message-ai,
.linochat-message-agent {
    background: white;
    color: #111827;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.linochat-message-system {
    background: #f3f4f6;
    color: #6b7280;
    align-self: center;
    font-size: 12px;
    font-style: italic;
}

.linochat-typing-indicator {
    align-self: flex-start;
    background: #f3f4f6;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
}

#linochat-messages::-webkit-scrollbar {
    width: 6px;
}

#linochat-messages::-webkit-scrollbar-track {
    background: transparent;
}

#linochat-messages::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

#linochat-input:focus {
    border-color: #155dfc;
}

@media (max-width: 480px) {
    #linochat-window {
        width: 100% !important;
        height: 100% !important;
        bottom: 0 !important;
        right: 0 !important;
        left: 0 !important;
        top: 0 !important;
        border-radius: 0 !important;
    }
    
    #linochat-button {
        bottom: 20px !important;
        right: 20px !important;
    }
}
CSS;

        return response($css)
            ->header('Content-Type', 'text/css; charset=utf-8')
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('Cross-Origin-Resource-Policy', 'cross-origin')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache');
    }

    /**
     * Build response for widget JS with ORB-safe headers.
     * Required for cross-origin script embedding (e.g. on customer sites).
     */
    private function widgetScriptResponse(string $js, int $maxAge = 3600)
    {
        return response($js, 200)
            ->header('Content-Type', 'application/javascript; charset=utf-8')
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('Cross-Origin-Resource-Policy', 'cross-origin')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Max-Age', '86400')
            ->header('Vary', 'Origin')
            ->header('Cache-Control', $maxAge > 0 ? 'public, max-age=' . $maxAge : 'no-cache, no-store, must-revalidate');
    }
}
