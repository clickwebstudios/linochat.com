import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Copy,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';

/** Widget base URL: VITE_WIDGET_BASE_URL or derived from VITE_API_URL (backend must serve widget.js) */
function getWidgetBaseUrl(): string {
  const widgetBase = (import.meta as { env?: { VITE_WIDGET_BASE_URL?: string } }).env?.VITE_WIDGET_BASE_URL;
  if (widgetBase) return widgetBase.replace(/\/$/, '');
  const apiUrl = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '';
  if (apiUrl.startsWith('http')) {
    const base = apiUrl.replace(/\/api\/?$/, '');
    return base.replace(/\/$/, '');
  }
  return window.location.origin;
}

interface ChatWidgetTabProps {
  project: any;
  isSuperadmin: boolean;
  widgetId: string;
  copiedWidgetId: boolean;
  onCopyWidgetId: () => void;
}

export function ChatWidgetTab({ project, isSuperadmin, widgetId, copiedWidgetId, onCopyWidgetId }: ChatWidgetTabProps) {
  const [widgetDesign, setWidgetDesign] = useState('modern');
  const [widgetColor, setWidgetColor] = useState(project?.color || '#3B82F6');
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetTitle, setWidgetTitle] = useState(project?.name || 'LinoChat Widget');
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can we help you today?");
  const [buttonText, setButtonText] = useState('💬');
  const [offlineBehavior, setOfflineBehavior] = useState('hide');
  const [offlineMessage, setOfflineMessage] = useState("We're currently offline. Our team is available Mon-Fri, 9am-5pm EST.");
  const [showOfflinePreview, setShowOfflinePreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load widget settings from API when project is available
  useEffect(() => {
    if (!project?.id || isSuperadmin) return;
    const loadSettings = async () => {
      try {
        const response = await api.get(`/projects/${project.id}/widget-settings`);
        if (response.success && response.data) {
          const d = response.data;
          if (d.color) setWidgetColor(d.color);
          if (d.position) setWidgetPosition(d.position);
          if (d.widget_title) setWidgetTitle(d.widget_title);
          if (d.welcome_message) setWelcomeMessage(d.welcome_message);
          if (d.button_text) setButtonText(d.button_text);
        }
      } catch {
        // Use project defaults if API fails
        if (project?.color) setWidgetColor(project.color);
      }
    };
    loadSettings();
  }, [project?.id, isSuperadmin]);

  const handleSaveSettings = async () => {
    if (!project?.id || isSuperadmin) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await api.put(`/projects/${project.id}/widget-settings`, {
        color: widgetColor,
        position: widgetPosition,
        widget_title: widgetTitle,
        welcome_message: welcomeMessage,
        button_text: buttonText,
      });
      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save widget settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isSuperadmin) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chat Widget Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Widget ID</label>
                  <div className="flex items-center gap-2">
                    <Input value={widgetId} readOnly className="font-mono bg-gray-50" />
                    <Button variant="outline" size="icon" onClick={onCopyWidgetId}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {copiedWidgetId && <p className="text-xs text-green-600 mt-1">Copied!</p>}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Domain</label>
                  <Input value={project.website} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Widget Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: project.color }}></div>
                    <Input value={project.color} readOnly className="bg-gray-50 font-mono w-32" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Embed Code</label>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`<script>
  (function(w,d,s,o,f,js,fjs){
    w['LinoChat']=o;
    w[o]=w[o]||function(){
      (w[o].q=w[o].q||[]).push(arguments)
    };
    js=d.createElement(s);
    fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;
    fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script',
    'lc','https://cdn.linochat.com/widget.js'));
  lc('init', '${widgetId}');
</script>`}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Chat Widget Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="widget-name">Widget Title</Label>
                  <Input 
                    id="widget-name" 
                    value={widgetTitle}
                    onChange={(e) => setWidgetTitle(e.target.value)}
                    placeholder="Enter widget title"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Textarea 
                    id="welcome-message" 
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Enter welcome message"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="widget-position">Widget Position</Label>
                  <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                    <SelectTrigger id="widget-position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="widget-design">Widget Design</Label>
                  <Select value={widgetDesign} onValueChange={setWidgetDesign}>
                    <SelectTrigger id="widget-design">
                      <SelectValue placeholder="Select design" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="bubble">Bubble</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="widget-color">Widget Color</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="widget-color" 
                      type="color"
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input 
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="schedule">
                      <AccordionTrigger>
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm font-medium">Widget Schedule</span>
                          <span className="text-xs text-gray-500 font-normal">Control when the widget is displayed to visitors</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <WidgetScheduleConfig
                          offlineBehavior={offlineBehavior}
                          setOfflineBehavior={setOfflineBehavior}
                          offlineMessage={offlineMessage}
                          setOfflineMessage={setOfflineMessage}
                          showOfflinePreview={showOfflinePreview}
                          setShowOfflinePreview={setShowOfflinePreview}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <div className="flex gap-2 items-center">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Widget Settings
                  </Button>
                  {saveSuccess && (
                    <span className="text-sm text-green-600">Saved! Changes will appear on your website within 30 seconds.</span>
                  )}
                </div>
              </div>

                <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">Installation Code</h3>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Add this code before the closing &lt;/body&gt; tag
                  </Label>
                  <pre className="text-xs text-gray-800 overflow-x-auto bg-gray-900 text-green-400 p-3 rounded">
{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${getWidgetBaseUrl()}/widget?id=${project?.widget_id || widgetId}';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  })();
</script>`}
                  </pre>
                  {getWidgetBaseUrl().startsWith('http://') && (
                    <p className="text-xs text-amber-600 mt-2">
                      Note: HTTP URLs are blocked on HTTPS sites (mixed content). Use a URL starting with https:// for production.
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      const code = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${getWidgetBaseUrl()}/widget?id=${project?.widget_id || widgetId}';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  })();
</script>`;
                      navigator.clipboard.writeText(code);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <h3 className="text-sm font-medium mb-4">Widget Preview</h3>
                <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-200 min-h-[500px] relative">
                  {/* Preview Container - position matches widget setting */}
                  <div className={`absolute ${
                    widgetPosition === 'bottom-right' ? 'bottom-6 right-6' :
                    widgetPosition === 'bottom-left' ? 'bottom-6 left-6' :
                    widgetPosition === 'top-right' ? 'top-6 right-6' :
                    'top-6 left-6'
                  }`}>
                    <WidgetPreview
                      design={widgetDesign}
                      color={widgetColor}
                      position={widgetPosition}
                      showOfflinePreview={showOfflinePreview}
                      offlineBehavior={offlineBehavior}
                      offlineMessage={offlineMessage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Sub-components ---

function WidgetScheduleConfig({
  offlineBehavior,
  setOfflineBehavior,
  offlineMessage,
  setOfflineMessage,
  showOfflinePreview,
  setShowOfflinePreview,
}: {
  offlineBehavior: string;
  setOfflineBehavior: (v: string) => void;
  offlineMessage: string;
  setOfflineMessage: (v: string) => void;
  showOfflinePreview: boolean;
  setShowOfflinePreview: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid gap-2">
        <Label htmlFor="schedule-enabled">Enable Schedule</Label>
        <Select defaultValue="always">
          <SelectTrigger id="schedule-enabled">
            <SelectValue placeholder="Select schedule option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="always">Always Available</SelectItem>
            <SelectItem value="business-hours">Business Hours Only</SelectItem>
            <SelectItem value="custom">Custom Schedule</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <Label>Weekly Schedule</Label>
        {[
          { day: 'Monday', short: 'Mon', default: true },
          { day: 'Tuesday', short: 'Tue', default: true },
          { day: 'Wednesday', short: 'Wed', default: true },
          { day: 'Thursday', short: 'Thu', default: true },
          { day: 'Friday', short: 'Fri', default: true },
          { day: 'Saturday', short: 'Sat', default: false },
          { day: 'Sunday', short: 'Sun', default: false },
        ].map((dayInfo) => (
          <div key={dayInfo.day} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2 w-32">
              <Checkbox id={`day-${dayInfo.short}`} defaultChecked={dayInfo.default} />
              <label
                htmlFor={`day-${dayInfo.short}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {dayInfo.day}
              </label>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input type="time" defaultValue="09:00" className="flex-1" />
              <span className="text-xs text-gray-500">to</span>
              <Input type="time" defaultValue="17:00" className="flex-1" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select defaultValue="utc">
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="utc">UTC (GMT+0)</SelectItem>
            <SelectItem value="est">Eastern Time (GMT-5)</SelectItem>
            <SelectItem value="pst">Pacific Time (GMT-8)</SelectItem>
            <SelectItem value="cet">Central European Time (GMT+1)</SelectItem>
            <SelectItem value="ist">India Standard Time (GMT+5:30)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4 mt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <Label htmlFor="offline-behavior" className="text-sm font-medium">When Widget is Offline</Label>
            <p className="text-xs text-gray-500 mt-1">Choose what visitors see outside business hours</p>
          </div>
          <Button
            type="button"
            variant={showOfflinePreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOfflinePreview(!showOfflinePreview)}
            className="ml-2"
          >
            {showOfflinePreview ? "Show Online" : "View Offline"}
          </Button>
        </div>
        <Select defaultValue="hide" onValueChange={setOfflineBehavior}>
          <SelectTrigger id="offline-behavior">
            <SelectValue placeholder="Select offline behavior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hide">Hide widget completely</SelectItem>
            <SelectItem value="message">Show offline message</SelectItem>
            <SelectItem value="form">Show contact form</SelectItem>
            <SelectItem value="custom">Show custom message</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid gap-2">
          <Label htmlFor="offline-message">Offline Message</Label>
          <Textarea
            id="offline-message"
            placeholder="We're currently offline. Please leave a message and we'll get back to you soon!"
            value={offlineMessage}
            onChange={(e) => setOfflineMessage(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-gray-500">This message will be displayed when the widget is offline</p>
        </div>
      </div>
    </div>
  );
}

// Widget preview component rendering all design variants
function WidgetPreview({
  design,
  color,
  position = 'bottom-right',
  showOfflinePreview,
  offlineBehavior,
  offlineMessage,
}: {
  design: string;
  color: string;
  position?: string;
  showOfflinePreview: boolean;
  offlineBehavior: string;
  offlineMessage: string;
}) {
  const shouldShow = !showOfflinePreview || offlineBehavior !== 'hide';
  if (!shouldShow) return null;

  // Chat on right of button when widget is on left; on left of button when widget is on right
  const chatHorizontal = position?.includes('left') ? 'left-0' : 'right-0';
  // Chat above button when widget is at bottom; below button when widget is at top
  const chatVertical = position?.startsWith('top') ? 'top-full mt-2' : 'bottom-full mb-2';

  const offlineContent = (
    <>
      {showOfflinePreview && offlineBehavior === 'message' && (
        <div className="p-4 space-y-3 bg-gray-50 h-48 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-700">{offlineMessage}</p>
          </div>
        </div>
      )}
      {showOfflinePreview && offlineBehavior === 'form' && (
        <div className="p-4 space-y-3 bg-gray-50">
          <p className="text-xs text-gray-600 mb-3">{offlineMessage}</p>
          <input type="text" placeholder="Your name" className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1" disabled />
          <input type="email" placeholder="Your email" className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1" disabled />
          <textarea placeholder="Your message..." className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 resize-none" rows={3} disabled />
          <button className="w-full px-3 py-2 rounded-lg text-white text-xs" style={{ backgroundColor: color }} disabled>
            Send Message
          </button>
        </div>
      )}
      {showOfflinePreview && offlineBehavior === 'custom' && (
        <div className="p-4 space-y-3 bg-gray-50 h-48 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${color}20` }}>
              <MessageSquare className="h-6 w-6" style={{ color }} />
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{offlineMessage}</p>
          </div>
        </div>
      )}
    </>
  );

  switch (design) {
    case 'modern':
      return (
        <div className="relative">
          <button className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110" style={{ backgroundColor: color }}>
            <MessageSquare className="h-6 w-6" />
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-lg shadow-xl border overflow-hidden`}>
            <div className="p-4 text-white" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">LinoChat Widget</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "We're offline" : "We're online"}</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            {showOfflinePreview ? offlineContent : (
              <>
                <div className="p-4 space-y-3 bg-gray-50 h-48">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[80%]">
                      <p className="text-xs">Hi! How can we help you today?</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1" disabled />
                    <button className="px-3 py-2 rounded-lg text-white text-xs" style={{ backgroundColor: color }} disabled>Send</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'minimal':
      return (
        <div className="relative">
          <button className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white" style={{ backgroundColor: color }}>
            <MessageSquare className="h-5 w-5" />
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-72 bg-white rounded shadow-lg border overflow-hidden`}>
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{showOfflinePreview ? "Chat - Offline" : "Chat"}</p>
                <button className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && (
              <div className="p-4 bg-white h-48 flex items-center justify-center">
                <div className="text-center"><p className="text-xs text-gray-700">{offlineMessage}</p></div>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-3 space-y-2 bg-white">
                <p className="text-xs text-gray-600 mb-2">{offlineMessage}</p>
                <input type="text" placeholder="Name" className="w-full text-xs px-2 py-1.5 border rounded" disabled />
                <input type="email" placeholder="Email" className="w-full text-xs px-2 py-1.5 border rounded" disabled />
                <textarea placeholder="Message" className="w-full text-xs px-2 py-1.5 border rounded resize-none" rows={3} disabled />
                <button className="w-full px-2 py-1.5 rounded text-white text-xs" style={{ backgroundColor: color }} disabled>Send</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && (
              <div className="p-4 bg-white h-48 flex items-center justify-center">
                <p className="text-xs text-gray-700 text-center whitespace-pre-wrap">{offlineMessage}</p>
              </div>
            )}
            {!showOfflinePreview && (
              <>
                <div className="p-3 space-y-2 bg-white h-48">
                  <div className="flex gap-2">
                    <div className="bg-gray-100 rounded p-2 max-w-[80%]">
                      <p className="text-xs text-gray-700">Hi! How can we help you today?</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t bg-gray-50">
                  <div className="flex gap-1">
                    <input type="text" placeholder="Message..." className="flex-1 text-xs px-2 py-1.5 border rounded focus:outline-none" disabled />
                    <button className="px-2 py-1.5 rounded text-white text-xs" style={{ backgroundColor: color }} disabled>&rarr;</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'classic':
      return (
        <div className="relative">
          <button className="w-16 h-12 rounded shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
            <MessageSquare className="h-5 w-5" /><span className="ml-1 text-xs">Chat</span>
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-none shadow-xl border-2 overflow-hidden`} style={{ borderColor: color }}>
            <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: color }}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${showOfflinePreview ? 'bg-red-400' : 'bg-green-400'}`}></div>
                <p className="text-sm font-medium">{showOfflinePreview ? "Support Chat - Offline" : "Support Chat"}</p>
              </div>
              <button className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && <div className="p-4 bg-gray-50 h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center">{offlineMessage}</p></div>}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-4 space-y-3 bg-gray-50">
                <p className="text-xs text-gray-600">{offlineMessage}</p>
                <input type="text" placeholder="Your name" className="w-full text-xs px-3 py-2 border" disabled />
                <input type="email" placeholder="Your email" className="w-full text-xs px-3 py-2 border" disabled />
                <textarea placeholder="Your message" className="w-full text-xs px-3 py-2 border resize-none" rows={3} disabled />
                <button className="px-4 py-2 text-white text-xs font-medium w-full" style={{ backgroundColor: color }} disabled>SEND</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && <div className="p-4 bg-gray-50 h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center whitespace-pre-wrap">{offlineMessage}</p></div>}
            {!showOfflinePreview && (
              <>
                <div className="p-4 space-y-3 bg-gray-50 h-48">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded bg-gray-300 flex-shrink-0"></div>
                    <div className="bg-white rounded p-2.5 shadow-sm border max-w-[80%]"><p className="text-xs">Hi! How can we help you today?</p></div>
                  </div>
                </div>
                <div className="p-3 bg-white border-t-2" style={{ borderColor: color }}>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type your message..." className="flex-1 text-xs px-3 py-2 border focus:outline-none" disabled />
                    <button className="px-4 py-2 text-white text-xs font-medium" style={{ backgroundColor: color }} disabled>SEND</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'bubble':
      return (
        <div className="relative">
          <button className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-white" style={{ backgroundColor: color }}>
            <MessageSquare className="h-7 w-7" />
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-3xl shadow-2xl overflow-hidden`}>
            <div className="p-5 text-white rounded-t-3xl" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center"><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">LinoChat</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "Currently offline" : "Always here to help"}</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && <div className="p-4 bg-gradient-to-b from-gray-50 to-white h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4">{offlineMessage}</p></div>}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-4 space-y-3 bg-white">
                <p className="text-xs text-gray-600">{offlineMessage}</p>
                <input type="text" placeholder="Name" className="w-full text-xs px-4 py-3 border-2 rounded-full" disabled />
                <input type="email" placeholder="Email" className="w-full text-xs px-4 py-3 border-2 rounded-full" disabled />
                <textarea placeholder="Message" className="w-full text-xs px-4 py-3 border-2 rounded-2xl resize-none" rows={3} disabled />
                <button className="w-full py-3 rounded-full text-white text-xs shadow-lg" style={{ backgroundColor: color }} disabled>Send Message</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && <div className="p-4 bg-gradient-to-b from-gray-50 to-white h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4 whitespace-pre-wrap">{offlineMessage}</p></div>}
            {!showOfflinePreview && (
              <>
                <div className="p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white h-48">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0"></div>
                    <div className="bg-white rounded-3xl rounded-tl-sm p-3 shadow-md max-w-[80%]"><p className="text-xs">Hi! How can we help you today?</p></div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 text-xs px-4 py-3 border-2 rounded-full focus:outline-none focus:border-blue-300" disabled />
                    <button className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg" style={{ backgroundColor: color }} disabled>&rarr;</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'compact':
      return (
        <div className="relative">
          <button className="w-11 h-11 rounded-lg shadow-md flex items-center justify-center text-white" style={{ backgroundColor: color }}>
            <MessageSquare className="h-5 w-5" />
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-64 bg-white rounded-lg shadow-lg border overflow-hidden`}>
            <div className="p-2.5 text-white text-xs font-medium" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <span>{showOfflinePreview ? "Offline" : "Chat Support"}</span>
                <button className="text-white/80 hover:text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && <div className="p-3 bg-gray-50 h-40 flex items-center justify-center"><p className="text-xs text-gray-700 text-center">{offlineMessage}</p></div>}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-2.5 space-y-2 bg-gray-50">
                <p className="text-xs text-gray-600 mb-1">{offlineMessage}</p>
                <input type="text" placeholder="Name" className="w-full text-xs px-2 py-1.5 border rounded" disabled />
                <input type="email" placeholder="Email" className="w-full text-xs px-2 py-1.5 border rounded" disabled />
                <textarea placeholder="Message" className="w-full text-xs px-2 py-1.5 border rounded resize-none" rows={2} disabled />
                <button className="w-full px-2 py-1.5 rounded text-white text-xs" style={{ backgroundColor: color }} disabled>Send</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && <div className="p-3 bg-gray-50 h-40 flex items-center justify-center"><p className="text-xs text-gray-700 text-center whitespace-pre-wrap">{offlineMessage}</p></div>}
            {!showOfflinePreview && (
              <>
                <div className="p-2.5 space-y-2 bg-gray-50 h-40">
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm max-w-[85%]"><p className="text-xs">Hi! How can we help?</p></div>
                  </div>
                </div>
                <div className="p-2 bg-white border-t">
                  <div className="flex gap-1">
                    <input type="text" placeholder="Message..." className="flex-1 text-xs px-2 py-1.5 border rounded focus:outline-none" disabled />
                    <button className="px-2 py-1.5 rounded text-white text-xs" style={{ backgroundColor: color }} disabled>&uarr;</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'professional':
      return (
        <div className="relative">
          <button className="w-14 h-14 rounded-sm shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
            <MessageSquare className="h-6 w-6" />
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-96 bg-white rounded-sm shadow-2xl border overflow-hidden`}>
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center text-white" style={{ backgroundColor: color }}><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Customer Support</p>
                    <p className="text-xs text-gray-500">{showOfflinePreview ? "Currently Offline" : "Typical response time: < 2 min"}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && <div className="p-4 bg-white h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4">{offlineMessage}</p></div>}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-4 space-y-3 bg-white">
                <p className="text-xs text-gray-600">{offlineMessage}</p>
                <input type="text" placeholder="Your name" className="w-full text-xs px-3 py-2.5 border rounded-sm" disabled />
                <input type="email" placeholder="Your email" className="w-full text-xs px-3 py-2.5 border rounded-sm" disabled />
                <textarea placeholder="Your message" className="w-full text-xs px-3 py-2.5 border rounded-sm resize-none" rows={3} disabled />
                <button className="w-full px-4 py-2.5 rounded-sm text-white text-xs font-medium" style={{ backgroundColor: color }} disabled>Send Message</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && <div className="p-4 bg-white h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4 whitespace-pre-wrap">{offlineMessage}</p></div>}
            {!showOfflinePreview && (
              <>
                <div className="p-4 space-y-3 bg-white h-48">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-sm bg-gray-200 flex-shrink-0"></div>
                    <div>
                      <div className="bg-gray-100 rounded-sm p-3 max-w-[85%]"><p className="text-xs text-gray-800">Hi! How can we help you today?</p></div>
                      <p className="text-xs text-gray-400 mt-1">Support Agent &bull; Now</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type your message here..." className="flex-1 text-xs px-3 py-2.5 border rounded-sm focus:outline-none focus:border-gray-400" disabled />
                    <button className="px-4 py-2.5 rounded-sm text-white text-xs font-medium" style={{ backgroundColor: color }} disabled>Send</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'friendly':
      return (
        <div className="relative">
          <button className="w-16 h-16 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white" style={{ backgroundColor: color }}>
            <MessageSquare className="h-6 w-6" /><span className="text-xs mt-0.5">Help</span>
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border-2`} style={{ borderColor: color }}>
            <div className="p-4 text-white relative overflow-hidden" style={{ backgroundColor: color }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="text-xl">{showOfflinePreview ? "\uD83D\uDCA4" : "\uD83D\uDC4B"}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{showOfflinePreview ? "We're Away" : "Welcome!"}</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "But we'll be back soon!" : "We're here to help"}</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && <div className="p-4 bg-gradient-to-b from-blue-50/50 to-white h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4">{offlineMessage}</p></div>}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-4 space-y-3 bg-white">
                <p className="text-xs text-gray-600">{offlineMessage}</p>
                <input type="text" placeholder="Your name" className="w-full text-xs px-4 py-2.5 border-2 rounded-xl" disabled />
                <input type="email" placeholder="Your email" className="w-full text-xs px-4 py-2.5 border-2 rounded-xl" disabled />
                <textarea placeholder="Your message" className="w-full text-xs px-4 py-2.5 border-2 rounded-xl resize-none" rows={3} disabled />
                <button className="w-full px-3 py-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: color }} disabled>Send Message</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && <div className="p-4 bg-gradient-to-b from-blue-50/50 to-white h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4 whitespace-pre-wrap">{offlineMessage}</p></div>}
            {!showOfflinePreview && (
              <>
                <div className="p-4 space-y-3 bg-gradient-to-b from-blue-50/50 to-white h-48">
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center flex-shrink-0"><span>{"\uD83D\uDE0A"}</span></div>
                    <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-md max-w-[80%] border border-gray-100"><p className="text-xs">Hi! How can we help you today?</p></div>
                  </div>
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 text-xs px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-blue-300" disabled />
                    <button className="px-3 py-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: color }} disabled><span className="text-sm">{"\u2708\uFE0F"}</span></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'gradient':
      return (
        <div className="relative">
          <button className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <MessageSquare className="h-6 w-6" />
          </button>
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-xl shadow-2xl overflow-hidden`}>
            <div className="p-4 text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-sm">LinoChat Support</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "Currently Offline" : "Online now"}</p>
                  </div>
                </div>
                <button className="text-white/90 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {showOfflinePreview && offlineBehavior === 'message' && <div className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4">{offlineMessage}</p></div>}
            {showOfflinePreview && offlineBehavior === 'form' && (
              <div className="p-4 space-y-3 bg-white">
                <p className="text-xs text-gray-600">{offlineMessage}</p>
                <input type="text" placeholder="Your name" className="w-full text-xs px-3 py-2.5 border-2 border-purple-200 rounded-lg" disabled />
                <input type="email" placeholder="Your email" className="w-full text-xs px-3 py-2.5 border-2 border-purple-200 rounded-lg" disabled />
                <textarea placeholder="Your message" className="w-full text-xs px-3 py-2.5 border-2 border-purple-200 rounded-lg resize-none" rows={3} disabled />
                <button className="w-full px-4 py-2.5 rounded-lg text-white text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-md" disabled>Send Message</button>
              </div>
            )}
            {showOfflinePreview && offlineBehavior === 'custom' && <div className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 h-48 flex items-center justify-center"><p className="text-sm text-gray-700 text-center px-4 whitespace-pre-wrap">{offlineMessage}</p></div>}
            {!showOfflinePreview && (
              <>
                <div className="p-4 space-y-3 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 h-48">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0"></div>
                    <div className="bg-white rounded-xl rounded-tl-sm p-3 shadow-lg max-w-[80%] border border-purple-100">
                      <p className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">Hi! How can we help you today?</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white border-t border-purple-100">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 text-xs px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400" disabled />
                    <button className="px-4 py-2.5 rounded-lg text-white text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-md" disabled>Send</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}
