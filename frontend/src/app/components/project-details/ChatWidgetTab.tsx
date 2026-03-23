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
import { Switch } from '../ui/switch';
// Tabs imports removed — using custom sidebar nav like AI Settings
import {
  Copy,
  MessageSquare,
  X,
  Loader2,
  Paintbrush,
  HandMetal,
  Code,
  Sparkles,
  Clock,
  Plus,
  Trash2,
  Globe,
  CalendarOff,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../api/client';

// --- Schedule Types & Constants ---
interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface ScheduleException {
  id: string;
  date: string;
  label: string;
  all_day_off: boolean;
  offline_behavior_override?: string;
  offline_message_override?: string;
}

interface WidgetSchedule {
  mode: 'always' | 'business_hours' | 'agent_availability';
  timezone: string;
  weekly: Record<string, DaySchedule>;
  offline_behavior: string;
  offline_message: string;
  offline_redirect_url: string;
  offline_redirect_label: string;
  offline_form_enabled: boolean;
  exceptions: ScheduleException[];
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const DEFAULT_SCHEDULE: WidgetSchedule = {
  mode: 'always',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  weekly: Object.fromEntries(
    DAYS.map(d => [d, {
      enabled: !['saturday', 'sunday'].includes(d),
      slots: [{ start: '09:00', end: '17:00' }],
    }])
  ),
  offline_behavior: 'show_message',
  offline_message: "We're currently offline. We'll be back {next_available}.",
  offline_redirect_url: '',
  offline_redirect_label: 'Email us',
  offline_form_enabled: false,
  exceptions: [],
};

const OFFLINE_MESSAGE_TEMPLATES = [
  "We're currently offline. We'll be back {next_available}.",
  "Thanks for reaching out! Our team at {company_name} is available during business hours.",
  "We're away right now. Drop us a line at {support_email} for urgent matters.",
  "Our team is currently offline. Please leave a message and we'll respond as soon as we're back.",
  "Hi! We're not available right now, but we'll be back {next_available}. Thanks for your patience!",
];

const TIMEZONES = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST)' },
  { value: 'America/Denver', label: 'Mountain Time (MST)' },
  { value: 'America/Chicago', label: 'Central Time (CST)' },
  { value: 'America/New_York', label: 'Eastern Time (EST)' },
  { value: 'America/Halifax', label: 'Atlantic (AST)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia (BRT)' },
  { value: 'Atlantic/Reykjavik', label: 'GMT / Iceland' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET)' },
  { value: 'Europe/Helsinki', label: 'Eastern Europe (EET)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Gulf (GST)' },
  { value: 'Asia/Karachi', label: 'Pakistan (PKT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh (BST)' },
  { value: 'Asia/Bangkok', label: 'Indochina (ICT)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Seoul', label: 'Korea (KST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
];

// --- Popover Types & Constants ---
interface PopoverButtonConfig {
  text: string;
  url: string;
  action: 'url' | 'open_chat' | 'none';
}

interface PopoverConfig {
  enabled: boolean;
  design: string;
  heading: string;
  description: string;
  badge_text: string;
  primary_button: PopoverButtonConfig;
  secondary_button: PopoverButtonConfig;
  show_online_status: boolean;
  online_status_text: string;
  trigger: string;
  trigger_delay: number;
  trigger_scroll_percent: number;
  show_once_per_session: boolean;
  show_on_pages: string;
  page_urls: string[];
}

const DEFAULT_POPOVER: PopoverConfig = {
  enabled: false,
  design: 'modern',
  heading: 'How can we help you today?',
  description: 'Our team is ready to assist with your needs.',
  badge_text: 'SUPPORT ONLINE',
  primary_button: { text: 'Schedule Service', url: '', action: 'open_chat' },
  secondary_button: { text: 'Ask a Question', url: '', action: 'open_chat' },
  show_online_status: true,
  online_status_text: 'Support Online',
  trigger: 'delay',
  trigger_delay: 3,
  trigger_scroll_percent: 50,
  show_once_per_session: true,
  show_on_pages: 'all',
  page_urls: [],
};

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
  widgetId: string;
  copiedWidgetId: boolean;
  onCopyWidgetId: () => void;
}

type WidgetSection = 'appearance' | 'greeting' | 'animations' | 'schedule' | 'embed';

const WIDGET_NAV = [
  { id: 'appearance' as WidgetSection, label: 'Appearance', icon: Paintbrush },
  { id: 'greeting' as WidgetSection, label: 'Greeting', icon: HandMetal },
  { id: 'animations' as WidgetSection, label: 'Animations', icon: Sparkles },
  { id: 'schedule' as WidgetSection, label: 'Schedule', icon: Clock },
  { id: 'embed' as WidgetSection, label: 'Embed Code', icon: Code },
];

const WIDGET_ANIMATIONS = [
  { id: 'none', label: 'None', description: 'No animation' },
  { id: 'bounce', label: 'Bounce', description: 'Playful bounce effect' },
  { id: 'pulse', label: 'Pulse', description: 'Gentle pulsing glow' },
  { id: 'shake', label: 'Shake', description: 'Attention-grabbing shake' },
  { id: 'wobble', label: 'Wobble', description: 'Soft wobble rotation' },
  { id: 'tada', label: 'Tada', description: 'Celebratory pop' },
  { id: 'heartbeat', label: 'Heartbeat', description: 'Rhythmic scale pulse' },
  { id: 'rubber-band', label: 'Rubber Band', description: 'Elastic stretch snap' },
  { id: 'swing', label: 'Swing', description: 'Pendulum swing' },
  { id: 'jello', label: 'Jello', description: 'Wobbly jello skew' },
  { id: 'float', label: 'Float', description: 'Gentle up-and-down float' },
] as const;

export function ChatWidgetTab({ project, widgetId }: ChatWidgetTabProps) {
  const [activeSection, setActiveSection] = useState<WidgetSection>('appearance');
  const [widgetDesign, setWidgetDesign] = useState('modern');
  const [widgetAnimation, setWidgetAnimation] = useState('none');
  const [widgetGradient, setWidgetGradient] = useState('linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)');
  const [animRepeat, setAnimRepeat] = useState('infinite');
  const [animDelay, setAnimDelay] = useState('0');
  const [animDuration, setAnimDuration] = useState('default');
  const [animStopAfter, setAnimStopAfter] = useState('0');
  const [previewingAnimation, setPreviewingAnimation] = useState<string | null>(null);
  const [widgetColor, setWidgetColor] = useState(project?.color || '#3B82F6');
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetTitle, setWidgetTitle] = useState(project?.name || 'LinoChat Widget');
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can we help you today?");
  const [buttonText, setButtonText] = useState('💬');
  const [schedule, setSchedule] = useState<WidgetSchedule>(DEFAULT_SCHEDULE);
  const [showOfflinePreview, setShowOfflinePreview] = useState(false);

  // Derive offline fields from schedule for WidgetPreview backward compat
  const offlineBehavior = schedule.offline_behavior;
  const offlineMessage = schedule.offline_message;
  const [widgetActive, setWidgetActive] = useState(true);
  const [greetingEnabled, setGreetingEnabled] = useState(false);
  const [greetingDelay, setGreetingDelay] = useState('3');
  const [greetingMessage, setGreetingMessage] = useState('👋 Hi there! How can we help you today?');
  const [fontSize, setFontSize] = useState('14');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load widget settings from API when project is available
  useEffect(() => {
    if (!project?.id) return;
    const loadSettings = async () => {
      try {
        const response = await api.get<{ color?: string; position?: string; widget_title?: string; welcome_message?: string; button_text?: string; design?: string; font_size?: number }>(`/projects/${project.id}/widget-settings`);
        if (response.success && response.data) {
          const d = response.data;
          if (d.color) setWidgetColor(d.color);
          if (d.position) setWidgetPosition(d.position);
          if (d.widget_title) setWidgetTitle(d.widget_title);
          if (d.welcome_message) setWelcomeMessage(d.welcome_message);
          if (d.button_text) setButtonText(d.button_text);
          if (d.design) setWidgetDesign(d.design);
          setWidgetActive(d.widget_active !== false);
          setGreetingEnabled(d.greeting_enabled ?? false);
          setGreetingDelay(String(d.greeting_delay ?? 3));
          setGreetingMessage(d.greeting_message || '👋 Hi there! How can we help you today?');
          if (d.font_size) setFontSize(String(d.font_size));
          if (d.animation) setWidgetAnimation(d.animation);
          if (d.animation_repeat) setAnimRepeat(d.animation_repeat);
          if (d.animation_delay) setAnimDelay(d.animation_delay);
          if (d.animation_duration) setAnimDuration(d.animation_duration);
          if (d.animation_stop_after) setAnimStopAfter(d.animation_stop_after);
          if (d.gradient) setWidgetGradient(d.gradient);
          // Hydrate schedule (with backward compat for old flat fields)
          if (d.schedule) {
            setSchedule(prev => ({
              ...prev,
              ...d.schedule,
              weekly: d.schedule.weekly ?? prev.weekly,
              exceptions: d.schedule.exceptions ?? [],
            }));
          } else {
            // Backward compat: populate schedule from flat fields
            if (d.offline_behavior || d.offline_message) {
              setSchedule(prev => ({
                ...prev,
                offline_behavior: d.offline_behavior ?? prev.offline_behavior,
                offline_message: d.offline_message ?? prev.offline_message,
              }));
            }
          }
        }
      } catch {
        // Use project defaults if API fails
        if (project?.color) setWidgetColor(project.color);
      }
    };
    loadSettings();
  }, [project?.id]);

  const handleSaveSettings = async () => {
    if (!project?.id) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await api.put(`/projects/${project.id}/widget-settings`, {
        color: widgetColor,
        position: widgetPosition,
        widget_title: widgetTitle,
        welcome_message: welcomeMessage,
        button_text: buttonText,
        design: widgetDesign,
        widget_active: widgetActive,
        greeting_enabled: greetingEnabled,
        greeting_delay: parseInt(greetingDelay),
        greeting_message: greetingMessage,
        font_size: parseInt(fontSize),
        animation: widgetAnimation,
        animation_repeat: animRepeat,
        animation_delay: animDelay,
        animation_duration: animDuration,
        animation_stop_after: animStopAfter,
        gradient: widgetGradient,
        offline_behavior: schedule.offline_behavior,
        offline_message: schedule.offline_message,
        schedule,
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

  if (!widgetActive) {
    return (
      <WidgetDesignShowcase
        color={widgetColor}
        title={widgetTitle}
        welcomeMessage={welcomeMessage}
        onActivate={() => setWidgetActive(true)}
        onSelectDesign={setWidgetDesign}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-16">
            {/* Sidebar */}
            <aside className="w-full lg:w-48 shrink-0">
              <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
                <span className="text-sm font-medium">Enabled</span>
                <Switch checked={widgetActive} onCheckedChange={setWidgetActive} />
              </div>
              <nav className="space-y-1">
                {WIDGET_NAV.map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </aside>
            <div className="flex-1 min-w-0">

            {/* ── Appearance ── */}
            {activeSection === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Appearance</h3>
                  <p className="text-sm text-muted-foreground mt-1">Customize how the chat widget looks on your website.</p>
                </div>
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
                  <Label>Widget Design</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'modern', label: 'Modern', desc: 'Round, shadow' },
                      { id: 'minimal', label: 'Minimal', desc: 'Clean, light' },
                      { id: 'classic', label: 'Classic', desc: 'Square, solid' },
                      { id: 'bubble', label: 'Bubble', desc: 'Large, border' },
                      { id: 'compact', label: 'Compact', desc: 'Small, tight' },
                      { id: 'professional', label: 'Professional', desc: 'Sharp, formal' },
                      { id: 'friendly', label: 'Friendly', desc: 'Rounded, warm' },
                      { id: 'gradient', label: 'Gradient', desc: 'Colorful blend' },
                    ].map(d => (
                      <button
                        key={d.id}
                        onClick={() => setWidgetDesign(d.id)}
                        className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                          widgetDesign === d.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 shrink-0 flex items-center justify-center text-white ${
                              d.id === 'bubble' ? 'rounded-full border-2 border-white shadow' :
                              d.id === 'compact' ? 'rounded-md scale-90' :
                              d.id === 'classic' ? 'rounded-sm' :
                              d.id === 'professional' ? 'rounded-none' :
                              d.id === 'friendly' ? 'rounded-2xl' :
                              d.id === 'gradient' ? 'rounded-full' :
                              'rounded-full'
                            }`}
                            style={d.id === 'gradient' ? { background: widgetGradient } : { backgroundColor: widgetColor }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-medium truncate ${widgetDesign === d.id ? 'text-primary' : ''}`}>{d.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{d.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {widgetDesign === 'gradient' ? (
                  <div className="grid gap-2">
                    <Label>Gradient Color</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { id: 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)', label: 'Aurora' },
                        { id: 'linear-gradient(135deg, #f43f5e, #ef4444, #f97316)', label: 'Sunset' },
                        { id: 'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)', label: 'Ocean' },
                        { id: 'linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6)', label: 'Indigo' },
                        { id: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)', label: 'Fire' },
                        { id: 'linear-gradient(135deg, #ec4899, #d946ef, #9333ea)', label: 'Berry' },
                        { id: 'linear-gradient(135deg, #06b6d4, #3b82f6, #4f46e5)', label: 'Sky' },
                        { id: 'linear-gradient(135deg, #84cc16, #10b981, #0d9488)', label: 'Forest' },
                        { id: 'linear-gradient(135deg, #facc15, #f59e0b, #ea580c)', label: 'Gold' },
                        { id: 'linear-gradient(135deg, #334155, #1f2937, #18181b)', label: 'Charcoal' },
                      ].map(g => (
                        <button
                          key={g.id}
                          onClick={() => setWidgetGradient(g.id)}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                            widgetGradient === g.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full" style={{ background: g.id }} />
                          <span className="text-[10px] font-medium text-muted-foreground">{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}

                <div className="grid gap-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger id="font-size">
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Small (12px)</SelectItem>
                      <SelectItem value="13">Medium-Small (13px)</SelectItem>
                      <SelectItem value="14">Medium (14px)</SelectItem>
                      <SelectItem value="15">Medium-Large (15px)</SelectItem>
                      <SelectItem value="16">Large (16px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>
            )}

            {/* ── Greeting ── */}
            {activeSection === 'greeting' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Greeting</h3>
                  <p className="text-sm text-muted-foreground mt-1">Set up an automatic greeting bubble to engage visitors.</p>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Enable Greeting Bubble</p>
                    <p className="text-sm text-muted-foreground">Automatically show a greeting message to visitors</p>
                  </div>
                  <Switch checked={greetingEnabled} onCheckedChange={setGreetingEnabled} />
                </div>

                {greetingEnabled && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Show greeting after</Label>
                      <Select value={greetingDelay} onValueChange={setGreetingDelay}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Immediately on page load</SelectItem>
                          <SelectItem value="3">3 seconds after page load</SelectItem>
                          <SelectItem value="5">5 seconds after page load</SelectItem>
                          <SelectItem value="10">10 seconds after page load</SelectItem>
                          <SelectItem value="15">15 seconds after page load</SelectItem>
                          <SelectItem value="30">30 seconds after page load</SelectItem>
                          <SelectItem value="60">1 minute after page load</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="greeting-msg">Greeting Message</Label>
                      <Textarea
                        id="greeting-msg"
                        value={greetingMessage}
                        onChange={e => setGreetingMessage(e.target.value)}
                        placeholder="👋 Hi there! How can we help you today?"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">{greetingMessage.length}/500 characters</p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Quick Templates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          '👋 Hi there! How can we help you today?',
                          '💬 Got questions? We\'re here to chat!',
                          '🎉 Welcome! Let us know if you need anything.',
                          '🚀 Need help getting started? Ask away!',
                          '😊 Hey! We\'re online and ready to help.',
                          '🛒 Looking for something? We can help you find it!',
                        ].map(tpl => (
                          <button
                            key={tpl}
                            onClick={() => setGreetingMessage(tpl)}
                            className={`text-left text-sm px-3 py-2 rounded-lg border transition-all ${
                              greetingMessage === tpl
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            {tpl}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}



            {/* ── Animations ── */}
            {activeSection === 'animations' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Button Animation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose an animation for the chat widget button to draw visitor attention.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {WIDGET_ANIMATIONS.map(anim => {
                    const isSelected = widgetAnimation === anim.id;
                    const isPreviewing = previewingAnimation === anim.id;
                    return (
                      <button
                        key={anim.id}
                        onClick={() => setWidgetAnimation(anim.id)}
                        onMouseEnter={() => setPreviewingAnimation(anim.id)}
                        onMouseLeave={() => setPreviewingAnimation(null)}
                        className={`text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{anim.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{anim.description}</p>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                              isPreviewing || isSelected ? `animate-widget-${anim.id}` : ''
                            }`}
                            style={{ backgroundColor: widgetColor }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {widgetAnimation !== 'none' && (
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h4 className="text-sm font-medium">Animation Parameters</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Repeat</Label>
                        <Select value={animRepeat} onValueChange={setAnimRepeat}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Once</SelectItem>
                            <SelectItem value="2">2 times</SelectItem>
                            <SelectItem value="3">3 times</SelectItem>
                            <SelectItem value="5">5 times</SelectItem>
                            <SelectItem value="10">10 times</SelectItem>
                            <SelectItem value="infinite">Infinite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Start Delay</Label>
                        <Select value={animDelay} onValueChange={setAnimDelay}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Immediately</SelectItem>
                            <SelectItem value="1">After 1s</SelectItem>
                            <SelectItem value="2">After 2s</SelectItem>
                            <SelectItem value="3">After 3s</SelectItem>
                            <SelectItem value="5">After 5s</SelectItem>
                            <SelectItem value="10">After 10s</SelectItem>
                            <SelectItem value="30">After 30s</SelectItem>
                            <SelectItem value="60">After 1 min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Speed</Label>
                        <Select value={animDuration} onValueChange={setAnimDuration}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="0.5">Fast (0.5s)</SelectItem>
                            <SelectItem value="1">Normal (1s)</SelectItem>
                            <SelectItem value="1.5">Slow (1.5s)</SelectItem>
                            <SelectItem value="2">Very slow (2s)</SelectItem>
                            <SelectItem value="3">Extra slow (3s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Stop After</Label>
                        <Select value={animStopAfter} onValueChange={setAnimStopAfter}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Never (keep going)</SelectItem>
                            <SelectItem value="5">5 seconds</SelectItem>
                            <SelectItem value="10">10 seconds</SelectItem>
                            <SelectItem value="30">30 seconds</SelectItem>
                            <SelectItem value="60">1 minute</SelectItem>
                            <SelectItem value="300">5 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Animation will {animDelay !== '0' ? `start after ${animDelay}s` : 'start immediately'},
                      play {animRepeat === 'infinite' ? 'indefinitely' : `${animRepeat} time${animRepeat !== '1' ? 's' : ''}`}
                      {animStopAfter !== '0' ? `, and stop after ${animStopAfter}s` : ''}.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* ── Schedule ── */}
            {activeSection === 'schedule' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Widget Schedule</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control when the widget is displayed to visitors.
                  </p>
                </div>
                <WidgetScheduleConfig
                  schedule={schedule}
                  setSchedule={setSchedule}
                  showOfflinePreview={showOfflinePreview}
                  setShowOfflinePreview={setShowOfflinePreview}
                />
              </div>
            )}

            {/* ── Embed Code ── */}
            {activeSection === 'embed' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Embed Code</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy the snippet below and paste it before the closing <code className="bg-muted px-1 rounded text-xs">&lt;/body&gt;</code> tag on every page where you want the widget to appear.
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <Label className="text-xs font-medium text-foreground mb-2 block">
                    Installation snippet
                  </Label>
                  <pre className="text-xs whitespace-pre-wrap break-all bg-foreground text-green-400 p-3 rounded">
{`<script>
  (window.requestIdleCallback || function(fn){ setTimeout(fn, 1) })(function() {
    var script = document.createElement('script');
    script.src = '${getWidgetBaseUrl()}/widget?id=${project?.widget_id || widgetId}';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  });
</script>`}
                  </pre>
                  {getWidgetBaseUrl().startsWith('http://') && (
                    <p className="text-xs text-amber-600 mt-2">
                      Note: HTTP URLs are blocked on HTTPS sites (mixed content). Use a URL starting with https:// for production.
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const code = `<script>
  (window.requestIdleCallback || function(fn){ setTimeout(fn, 1) })(function() {
    var script = document.createElement('script');
    script.src = '${getWidgetBaseUrl()}/widget?id=${project?.widget_id || widgetId}';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  });
</script>`;
                        navigator.clipboard.writeText(code);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <VerifyInstallButton projectId={project?.id} />
                  </div>
                </div>
              </div>
            )}

            </div>

            {/* ── Live Preview (always visible) ── */}
            <div className="hidden xl:block w-[750px] shrink-0">
              <div className="sticky top-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Live Preview</p>
                <div className="rounded-lg border border-border relative overflow-hidden" style={{ minHeight: '500px' }}>
                    {/* Fake website background */}
                    <div className="absolute inset-0 bg-white p-6 space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="w-8 h-8 rounded bg-blue-600" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="ml-auto flex gap-4">
                          <div className="h-3 w-14 bg-gray-200 rounded" />
                          <div className="h-3 w-14 bg-gray-200 rounded" />
                          <div className="h-3 w-14 bg-gray-200 rounded" />
                          <div className="h-3 w-14 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="pt-8 space-y-3 max-w-md">
                        <div className="h-8 w-72 bg-gray-100 rounded" />
                        <div className="h-4 w-full bg-gray-100 rounded" />
                        <div className="h-4 w-5/6 bg-gray-100 rounded" />
                        <div className="h-4 w-2/3 bg-gray-100 rounded" />
                      </div>
                      <div className="pt-4 flex gap-3">
                        <div className="h-10 w-32 bg-blue-100 rounded-lg" />
                        <div className="h-10 w-28 bg-gray-100 rounded-lg" />
                      </div>
                      <div className="pt-8 grid grid-cols-3 gap-4">
                        <div className="h-28 bg-gray-50 rounded-lg border" />
                        <div className="h-28 bg-gray-50 rounded-lg border" />
                        <div className="h-28 bg-gray-50 rounded-lg border" />
                      </div>
                      <div className="pt-4 space-y-2">
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-4/5 bg-gray-100 rounded" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className={`absolute ${
                      widgetPosition === 'bottom-right' ? 'bottom-4 right-4' :
                      widgetPosition === 'bottom-left' ? 'bottom-4 left-4' :
                      widgetPosition === 'top-right' ? 'top-4 right-4' :
                      'top-4 left-4'
                    } ${widgetAnimation && widgetAnimation !== 'none' ? `animate-widget-${widgetAnimation}` : ''}`}
                    style={widgetAnimation && widgetAnimation !== 'none' ? {
                      animationIterationCount: animRepeat === 'infinite' ? 'infinite' : animRepeat,
                      animationDelay: animDelay !== '0' ? `${animDelay}s` : undefined,
                      ...(animDuration !== 'default' ? { animationDuration: `${animDuration}s` } : {}),
                    } as React.CSSProperties : undefined}>
                      <WidgetPreview
                        design={widgetDesign}
                        color={widgetColor}
                        position={widgetPosition}
                        title={widgetTitle}
                        welcomeMessage={welcomeMessage}
                        buttonText={buttonText}
                        showOfflinePreview={showOfflinePreview}
                        offlineBehavior={offlineBehavior}
                        offlineMessage={offlineMessage}
                        greetingEnabled={greetingEnabled}
                        greetingMessage={greetingMessage}
                        fontSize={fontSize}
                        gradient={widgetGradient}
                      />
                    </div>
                </div>
              </div>
            </div>

          {/* Fixed save bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t px-6 py-3 z-50 flex items-center gap-3">
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Widget Settings
            </Button>
            {saveSuccess && <span className="text-sm text-green-600">Saved!</span>}
          </div>
          </div>
  );
}

// --- Sub-components ---

function WidgetScheduleConfig({
  schedule,
  setSchedule,
  showOfflinePreview,
  setShowOfflinePreview,
}: {
  schedule: WidgetSchedule;
  setSchedule: React.Dispatch<React.SetStateAction<WidgetSchedule>>;
  showOfflinePreview: boolean;
  setShowOfflinePreview: (v: boolean) => void;
}) {
  const updateSchedule = (patch: Partial<WidgetSchedule>) => setSchedule(prev => ({ ...prev, ...patch }));
  const updateDay = (day: string, patch: Partial<DaySchedule>) =>
    setSchedule(prev => ({
      ...prev,
      weekly: { ...prev.weekly, [day]: { ...prev.weekly[day], ...patch } },
    }));
  const updateSlot = (day: string, idx: number, patch: Partial<TimeSlot>) =>
    setSchedule(prev => {
      const slots = [...(prev.weekly[day]?.slots || [])];
      slots[idx] = { ...slots[idx], ...patch };
      return { ...prev, weekly: { ...prev.weekly, [day]: { ...prev.weekly[day], slots } } };
    });
  const addSlot = (day: string) =>
    setSchedule(prev => {
      const slots = [...(prev.weekly[day]?.slots || [])];
      if (slots.length >= 4) return prev;
      slots.push({ start: '13:00', end: '17:00' });
      return { ...prev, weekly: { ...prev.weekly, [day]: { ...prev.weekly[day], slots } } };
    });
  const removeSlot = (day: string, idx: number) =>
    setSchedule(prev => {
      const slots = (prev.weekly[day]?.slots || []).filter((_, i) => i !== idx);
      return { ...prev, weekly: { ...prev.weekly, [day]: { ...prev.weekly[day], slots: slots.length ? slots : [{ start: '09:00', end: '17:00' }] } } };
    });
  const copyMondayToWeekdays = () =>
    setSchedule(prev => {
      const monday = prev.weekly.monday;
      if (!monday) return prev;
      const weekly = { ...prev.weekly };
      for (const d of ['tuesday', 'wednesday', 'thursday', 'friday']) {
        weekly[d] = { enabled: monday.enabled, slots: monday.slots.map(s => ({ ...s })) };
      }
      return { ...prev, weekly };
    });
  const addException = () =>
    setSchedule(prev => ({
      ...prev,
      exceptions: [...prev.exceptions, { id: `exc_${Date.now()}`, date: '', label: '', all_day_off: true }],
    }));
  const removeException = (id: string) =>
    setSchedule(prev => ({ ...prev, exceptions: prev.exceptions.filter(e => e.id !== id) }));
  const updateException = (id: string, patch: Partial<ScheduleException>) =>
    setSchedule(prev => ({
      ...prev,
      exceptions: prev.exceptions.map(e => e.id === id ? { ...e, ...patch } : e),
    }));

  // Compute current online status client-side for the indicator
  const computeIsOnline = (): { online: boolean; nextAt?: string } => {
    if (schedule.mode === 'always') return { online: true };
    if (schedule.mode !== 'business_hours') return { online: true };
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: schedule.timezone, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
      const parts = fmt.formatToParts(now);
      const dayName = (parts.find(p => p.type === 'weekday')?.value || '').toLowerCase();
      const hour = parts.find(p => p.type === 'hour')?.value || '00';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const currentTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      const daySchedule = schedule.weekly[dayName];
      if (!daySchedule?.enabled) return { online: false };
      for (const slot of daySchedule.slots) {
        if (currentTime >= slot.start && currentTime < slot.end) return { online: true };
      }
      return { online: false };
    } catch {
      return { online: true };
    }
  };

  const status = computeIsOnline();

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Schedule Mode */}
      <div className="grid gap-3">
        <Label className="text-sm font-medium">Schedule Mode</Label>
        <div className="grid gap-2">
          {([
            { value: 'always' as const, label: 'Always Available', desc: 'Widget is always online' },
            { value: 'business_hours' as const, label: 'Business Hours', desc: 'Set weekly hours & timezone' },
            { value: 'agent_availability' as const, label: 'Agent Availability', desc: 'Coming soon', disabled: true },
          ] as const).map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                schedule.mode === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
              } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="schedule-mode"
                value={opt.value}
                checked={schedule.mode === opt.value}
                onChange={() => !opt.disabled && updateSchedule({ mode: opt.value })}
                disabled={opt.disabled}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {schedule.mode === 'business_hours' && (
        <>
          {/* 2. Status Indicator */}
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              Currently: {status.online ? 'Online' : 'Offline'}
            </span>
            <Button
              type="button"
              variant={showOfflinePreview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOfflinePreview(!showOfflinePreview)}
              className="ml-auto"
            >
              {showOfflinePreview ? 'Show Online' : 'Preview Offline'}
            </Button>
          </div>

          {/* 3. Timezone Selector */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Timezone
            </Label>
            <Select value={schedule.timezone} onValueChange={tz => updateSchedule({ timezone: tz })}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Weekly Schedule Grid */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Weekly Schedule</Label>
              <Button type="button" variant="ghost" size="sm" onClick={copyMondayToWeekdays} className="text-xs h-7">
                Copy Monday to all weekdays
              </Button>
            </div>
            {DAYS.map(day => {
              const ds = schedule.weekly[day] || { enabled: false, slots: [{ start: '09:00', end: '17:00' }] };
              return (
                <div key={day} className={`border rounded-lg p-3 space-y-2 ${ds.enabled ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={ds.enabled}
                      onCheckedChange={(v) => updateDay(day, { enabled: !!v })}
                    />
                    <label htmlFor={`day-${day}`} className="text-sm font-medium w-24">{DAY_LABELS[day]}</label>
                  </div>
                  {ds.enabled && (
                    <div className="space-y-2 pl-6">
                      {ds.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={e => updateSlot(day, idx, { start: e.target.value })}
                            className="w-28"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={e => updateSlot(day, idx, { end: e.target.value })}
                            className="w-28"
                          />
                          {ds.slots.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSlot(day, idx)} className="h-7 w-7 p-0">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {ds.slots.length < 4 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => addSlot(day)} className="text-xs h-7">
                          <Plus className="h-3 w-3 mr-1" /> Add time slot
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 5. Offline Behavior */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label className="text-sm font-medium">When Widget is Offline</Label>
              <p className="text-xs text-muted-foreground mt-1">Choose what visitors see outside business hours</p>
            </div>
            <div className="grid gap-2">
              {([
                { value: 'hide', label: 'Hide widget completely' },
                { value: 'show_message', label: 'Show offline message' },
                { value: 'ai_only', label: 'AI-only mode' },
                { value: 'contact_form', label: 'Show contact form' },
                { value: 'redirect', label: 'Redirect to URL' },
              ]).map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-sm ${
                    schedule.offline_behavior === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="offline-behavior"
                    value={opt.value}
                    checked={schedule.offline_behavior === opt.value}
                    onChange={() => updateSchedule({ offline_behavior: opt.value })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {schedule.offline_behavior === 'redirect' && (
              <div className="space-y-2 pl-2">
                <div className="grid gap-1">
                  <Label className="text-xs">Redirect URL</Label>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com/contact"
                      value={schedule.offline_redirect_url}
                      onChange={e => updateSchedule({ offline_redirect_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Button Label</Label>
                  <Input
                    placeholder="Email us"
                    value={schedule.offline_redirect_label}
                    onChange={e => updateSchedule({ offline_redirect_label: e.target.value })}
                  />
                </div>
              </div>
            )}

            {schedule.offline_behavior === 'contact_form' && (
              <p className="text-xs text-muted-foreground pl-2">
                Visitors can submit their name, email, and message when you're offline.
              </p>
            )}

            {schedule.offline_behavior === 'ai_only' && (
              <p className="text-xs text-muted-foreground pl-2">
                The AI assistant will handle conversations when no agents are available.
              </p>
            )}
          </div>

          {/* 6. Offline Message + Templates */}
          {schedule.offline_behavior !== 'hide' && (
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Offline Message</Label>
                <Textarea
                  placeholder="We're currently offline..."
                  value={schedule.offline_message}
                  onChange={e => updateSchedule({ offline_message: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: <code className="bg-muted px-1 rounded">{'{company_name}'}</code>{' '}
                  <code className="bg-muted px-1 rounded">{'{next_available}'}</code>{' '}
                  <code className="bg-muted px-1 rounded">{'{support_email}'}</code>
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Templates</Label>
                <div className="flex flex-wrap gap-1.5">
                  {OFFLINE_MESSAGE_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => updateSchedule({ offline_message: tpl })}
                      className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                        schedule.offline_message === tpl ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      {tpl.length > 50 ? tpl.slice(0, 50) + '...' : tpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. Holiday/Exception Dates */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5">
                  <CalendarOff className="h-3.5 w-3.5" />
                  Holiday / Exception Dates
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Override schedule for specific dates</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addException} className="text-xs h-7">
                <Plus className="h-3 w-3 mr-1" /> Add Date
              </Button>
            </div>
            {schedule.exceptions.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No exceptions configured.</p>
            )}
            {schedule.exceptions.map(exc => (
              <div key={exc.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={exc.date}
                    onChange={e => updateException(exc.id, { date: e.target.value })}
                    className="w-40"
                  />
                  <Input
                    placeholder="Label (e.g. Christmas)"
                    value={exc.label}
                    onChange={e => updateException(exc.id, { label: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeException(exc.id)} className="h-7 w-7 p-0">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 pl-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`exc-allday-${exc.id}`}
                      checked={exc.all_day_off}
                      onCheckedChange={v => updateException(exc.id, { all_day_off: !!v })}
                    />
                    <label htmlFor={`exc-allday-${exc.id}`} className="text-xs">All day off</label>
                  </div>
                </div>
                {exc.all_day_off && (
                  <div className="space-y-2 pl-1">
                    <Select
                      value={exc.offline_behavior_override || ''}
                      onValueChange={v => updateException(exc.id, { offline_behavior_override: v || undefined })}
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Use default offline behavior" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use default</SelectItem>
                        <SelectItem value="show_message">Show message</SelectItem>
                        <SelectItem value="hide">Hide widget</SelectItem>
                      </SelectContent>
                    </Select>
                    {exc.offline_behavior_override === 'show_message' && (
                      <Input
                        placeholder="Override message (e.g. Happy Holidays!)"
                        value={exc.offline_message_override || ''}
                        onChange={e => updateException(exc.id, { offline_message_override: e.target.value })}
                        className="text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Verify Installation Button ---
function VerifyInstallButton({ projectId }: { projectId?: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    if (!projectId) return;
    setStatus('loading');
    try {
      const res = await api.post<any>(`/projects/${projectId}/verify-widget`, {});
      if (res.success && res.data) {
        setStatus(res.data.installed ? 'success' : 'fail');
        setMessage(res.data.reason || '');
      }
    } catch {
      setStatus('fail');
      setMessage('Verification failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleVerify} disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {status === 'success' ? '✓ Verified' : status === 'fail' ? '✗ Not Found' : 'Verify Installation'}
      </Button>
      {message && (
        <span className={`text-xs ${status === 'success' ? 'text-green-600' : 'text-amber-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}

// --- Widget Design Showcase (when widget inactive) ---
const WIDGET_DESIGNS_SHOWCASE = [
  { id: 'modern', name: 'Modern', desc: 'Round shadow design with clean layout' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean and light with subtle borders' },
  { id: 'classic', name: 'Classic', desc: 'Square solid traditional look' },
  { id: 'bubble', name: 'Bubble', desc: 'Large rounded bubble style' },
  { id: 'compact', name: 'Compact', desc: 'Small tight layout' },
  { id: 'professional', name: 'Professional', desc: 'Sharp formal design' },
  { id: 'friendly', name: 'Friendly', desc: 'Rounded warm appearance' },
  { id: 'gradient', name: 'Gradient', desc: 'Colorful gradient blend' },
] as const;

function WidgetDesignShowcase({ color, title, welcomeMessage, onActivate, onSelectDesign }: {
  color: string; title: string; welcomeMessage: string;
  onActivate: () => void; onSelectDesign: (d: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % WIDGET_DESIGNS_SHOWCASE.length); setFading(false); }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => { if (i === idx) return; setFading(true); setTimeout(() => { setIdx(i); setFading(false); }, 300); };
  const current = WIDGET_DESIGNS_SHOWCASE[idx];

  return (
    <div className="flex flex-col items-center py-6 space-y-4 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Widget Designs</h3>
        <p className="text-sm text-muted-foreground">Preview available designs and activate your widget.</p>
        <Button size="sm" onClick={() => { onSelectDesign(current.id); onActivate(); }}>
          Activate Widget
        </Button>
      </div>
      <div className="flex items-center gap-3 w-full">
        <button onClick={() => goTo((idx - 1 + WIDGET_DESIGNS_SHOWCASE.length) % WIDGET_DESIGNS_SHOWCASE.length)} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted shrink-0">
          <span className="text-muted-foreground text-lg">‹</span>
        </button>
        <div className="flex-1 flex flex-col items-center gap-3">
          {/* Preview with website mockup background */}
          <div className="rounded-xl border overflow-hidden relative w-full" style={{ height: 340, opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}>
            <div className="absolute inset-0 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="w-6 h-6 rounded bg-blue-600" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="ml-auto flex gap-3">
                  <div className="h-2.5 w-12 bg-gray-200 rounded" />
                  <div className="h-2.5 w-12 bg-gray-200 rounded" />
                  <div className="h-2.5 w-12 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="pt-4 space-y-2 max-w-xs">
                <div className="h-6 w-56 bg-gray-100 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-4/5 bg-gray-100 rounded" />
              </div>
              <div className="pt-2 flex gap-2">
                <div className="h-8 w-24 bg-blue-100 rounded-lg" />
                <div className="h-8 w-20 bg-gray-100 rounded-lg" />
              </div>
              <div className="pt-4 grid grid-cols-3 gap-3">
                <div className="h-16 bg-gray-50 rounded border" />
                <div className="h-16 bg-gray-50 rounded border" />
                <div className="h-16 bg-gray-50 rounded border" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3">
              <WidgetPreview
                design={current.id}
                color={color}
                title={title}
                welcomeMessage={welcomeMessage}
                showOfflinePreview={false}
                offlineBehavior="hide"
                offlineMessage=""
              />
            </div>
          </div>
          <div className="text-center space-y-0.5" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}>
            <h4 className="text-sm font-semibold">{current.name}</h4>
            <p className="text-xs text-muted-foreground">{current.desc}</p>
          </div>
          <div className="flex gap-1.5">
            {WIDGET_DESIGNS_SHOWCASE.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>
        </div>
        <button onClick={() => goTo((idx + 1) % WIDGET_DESIGNS_SHOWCASE.length)} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted shrink-0">
          <span className="text-muted-foreground text-lg">›</span>
        </button>
      </div>
    </div>
  );
}

// Widget preview component rendering all design variants
function WidgetPreview({
  design,
  color,
  position = 'bottom-right',
  title,
  welcomeMessage,
  buttonText: _buttonText = '💬',
  showOfflinePreview,
  offlineBehavior,
  offlineMessage,
  greetingEnabled = false,
  greetingMessage = '',
  fontSize = '14',
  gradient = 'from-blue-500 via-purple-500 to-pink-500',
}: {
  design: string;
  color: string;
  position?: string;
  title: string;
  welcomeMessage: string;
  buttonText?: string;
  showOfflinePreview: boolean;
  offlineBehavior: string;
  offlineMessage: string;
  greetingEnabled?: boolean;
  greetingMessage?: string;
  fontSize?: string;
  gradient?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

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

  const showPanel = isOpen;

  const fontSizePx = `${fontSize}px`;

  const greetingBubble = greetingEnabled && greetingMessage && !isOpen ? (
    <div className="absolute bottom-[72px] right-0 bg-white rounded-xl shadow-lg border px-4 py-3 w-72 leading-relaxed text-gray-800" style={{ fontSize: fontSizePx }}>
      {greetingMessage}
      <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white border-b border-r rotate-45" />
    </div>
  ) : null;

  switch (design) {
    case 'modern':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-6 w-6" />
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-lg shadow-xl border overflow-hidden`}>
            <div className="p-4 text-white" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "We're offline" : "We're online"}</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></button>
              </div>
            </div>
            {showOfflinePreview ? offlineContent : (
              <>
                <div className="p-4 space-y-3 bg-gray-50 h-48">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[80%]">
                      <p style={{ fontSize: fontSizePx }}>{welcomeMessage}</p>
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
          )}
        </div>
      );

    case 'minimal':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-5 w-5" />
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-72 bg-white rounded shadow-lg border overflow-hidden`}>
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{showOfflinePreview ? "Chat - Offline" : "Chat"}</p>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></button>
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
                      <p className="text-gray-700" style={{ fontSize: fontSizePx }}>{welcomeMessage}</p>
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
          )}
        </div>
      );

    case 'classic':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-16 h-12 rounded shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-5 w-5" /><span className="ml-1 text-xs">Chat</span>
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-none shadow-xl border-2 overflow-hidden`} style={{ borderColor: color }}>
            <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: color }}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${showOfflinePreview ? 'bg-red-400' : 'bg-green-400'}`}></div>
                <p className="text-sm font-medium">{showOfflinePreview ? "Support Chat - Offline" : "Support Chat"}</p>
              </div>
              <button className="text-white/80 hover:text-white" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></button>
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
                    <div className="bg-white rounded p-2.5 shadow-sm border max-w-[80%]"><p style={{ fontSize: fontSizePx }}>{welcomeMessage}</p></div>
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
          )}
        </div>
      );

    case 'bubble':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-white" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-7 w-7" />
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-3xl shadow-2xl overflow-hidden`}>
            <div className="p-5 text-white rounded-t-3xl" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center"><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "Currently offline" : "Always here to help"}</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white" onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
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
                    <div className="bg-white rounded-3xl rounded-tl-sm p-3 shadow-md max-w-[80%]"><p style={{ fontSize: fontSizePx }}>{welcomeMessage}</p></div>
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
          )}
        </div>
      );

    case 'compact':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-11 h-11 rounded-lg shadow-md flex items-center justify-center text-white" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-5 w-5" />
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-64 bg-white rounded-lg shadow-lg border overflow-hidden`}>
            <div className="p-2.5 text-white text-xs font-medium" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <span>{showOfflinePreview ? "Offline" : "Chat Support"}</span>
                <button className="text-white/80 hover:text-white" onClick={() => setIsOpen(false)}><X className="h-3.5 w-3.5" /></button>
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
                    <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm max-w-[85%]"><p style={{ fontSize: fontSizePx }}>{welcomeMessage}</p></div>
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
          )}
        </div>
      );

    case 'professional':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-14 h-14 rounded-sm shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-6 w-6" />
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-96 bg-white rounded-sm shadow-2xl border overflow-hidden`}>
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center text-white" style={{ backgroundColor: color }}><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">{showOfflinePreview ? "Currently Offline" : "Typical response time: < 2 min"}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
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
                      <div className="bg-gray-100 rounded-sm p-3 max-w-[85%]"><p className="text-gray-800" style={{ fontSize: fontSizePx }}>{welcomeMessage}</p></div>
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
          )}
        </div>
      );

    case 'friendly':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-16 h-16 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white" style={{ backgroundColor: color }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-6 w-6" /><span className="text-xs mt-0.5">Help</span>
          </button>
          {showPanel && (
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
                <button className="text-white/80 hover:text-white" onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
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
                    <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-md max-w-[80%] border border-gray-100"><p style={{ fontSize: fontSizePx }}>{welcomeMessage}</p></div>
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
          )}
        </div>
      );

    case 'gradient':
      return (
        <div className="relative">
          {greetingBubble}
          <button className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white" style={{ background: gradient }} onClick={() => setIsOpen(true)}>
            <MessageSquare className="h-6 w-6" />
          </button>
          {showPanel && (
          <div className={`absolute ${chatVertical} ${chatHorizontal} w-80 bg-white rounded-xl shadow-2xl overflow-hidden`}>
            <div className="p-4 text-white" style={{ background: gradient }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs opacity-90">{showOfflinePreview ? "Currently Offline" : "Online now"}</p>
                  </div>
                </div>
                <button className="text-white/90 hover:text-white" onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
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
                      <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium" style={{ fontSize: fontSizePx }}>{welcomeMessage}</p>
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
          )}
        </div>
      );

    default:
      return null;
  }
}
