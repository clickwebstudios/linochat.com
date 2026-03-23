import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Loader2,
  X,
  Paintbrush,
  Type,
  MousePointerClick as PointerIcon,
  Globe,
  Eye,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../api/client';

// --- Types ---
interface PopoverButtonConfig {
  text: string;
  icon: string;
  url: string;
  action: 'url' | 'open_chat' | 'none';
}

interface PopoverConfig {
  enabled: boolean;
  design: string;
  size: 'small' | 'medium' | 'large';
  color: string;
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
  max_displays_per_session: number;
  overlay: 'dark' | 'light' | 'none';
  overlay_blur: boolean;
  show_on_pages: string;
  page_urls: string[];
}

const DEFAULT_POPOVER: PopoverConfig = {
  enabled: false,
  design: 'modern',
  size: 'medium',
  color: '',
  heading: 'How can we help you today?',
  description: 'Our team is ready to assist with your needs.',
  badge_text: 'SUPPORT ONLINE',
  primary_button: { text: 'Schedule Service', icon: '📅', url: '', action: 'open_chat' },
  secondary_button: { text: 'Ask a Question', icon: '💬', url: '', action: 'open_chat' },
  show_online_status: true,
  online_status_text: 'Support Online',
  overlay: 'dark',
  overlay_blur: false,
  trigger: 'delay',
  trigger_delay: 3,
  trigger_scroll_percent: 50,
  max_displays_per_session: 1,
  show_on_pages: 'all',
  page_urls: [],
};

const POPOVER_DESIGNS = [
  { id: 'urgent', name: 'Urgent', desc: 'Orange badge, bold CTA' },
  { id: 'luxury', name: 'Luxury', desc: 'Elegant serif style' },
  { id: 'modern', name: 'Modern', desc: 'Action cards with icons' },
  { id: 'bold', name: 'Bold', desc: 'Full-width bordered' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean pill badge' },
] as const;

// --- Sidebar Nav ---
type PopoverSection = 'design' | 'content' | 'buttons' | 'trigger' | 'targeting' | 'status';

const POPOVER_NAV = [
  { id: 'design' as PopoverSection, label: 'Design', icon: Paintbrush },
  { id: 'content' as PopoverSection, label: 'Content', icon: Type },
  { id: 'buttons' as PopoverSection, label: 'Buttons', icon: PointerIcon },
  { id: 'status' as PopoverSection, label: 'Online Status', icon: Eye },
  { id: 'trigger' as PopoverSection, label: 'Trigger', icon: Settings2 },
  { id: 'targeting' as PopoverSection, label: 'Page Targeting', icon: Globe },
];

// --- Main Component ---
interface PopoversTabProps {
  projectId: string;
}

export function PopoversTab({ projectId }: PopoversTabProps) {
  const [popover, setPopover] = useState<PopoverConfig>(DEFAULT_POPOVER);
  const [savedPopover, setSavedPopover] = useState<string>('');
  const [widgetColor, setWidgetColor] = useState('#4F46E5');
  const [activeSection, setActiveSection] = useState<PopoverSection>('design');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isDirty = JSON.stringify(popover) !== savedPopover;

  useEffect(() => {
    if (!projectId) return;
    api.get<any>(`/projects/${projectId}/widget-settings`).then(res => {
      if (res.success && res.data) {
        if (res.data.popover) {
          const merged = { ...DEFAULT_POPOVER, ...res.data.popover };
          setPopover(merged);
          setSavedPopover(JSON.stringify(merged));
        }
        if (res.data.color) setWidgetColor(res.data.color);
      }
    }).catch(() => {});
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.put(`/projects/${projectId}/widget-settings`, { popover });
      if (res.success) {
        setSavedPopover(JSON.stringify(popover));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save popover settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<PopoverConfig>) => setPopover(prev => ({ ...prev, ...patch }));
  const updateBtn = (key: 'primary_button' | 'secondary_button', patch: Partial<PopoverButtonConfig>) =>
    setPopover(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-16">
      {/* Sidebar — only shown when enabled */}
      {popover.enabled && (
      <aside className="w-full lg:w-48 shrink-0">
        <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
          <span className="text-sm font-medium">Enabled</span>
          <Switch checked={popover.enabled} onCheckedChange={v => update({ enabled: v })} />
        </div>

        <nav className="space-y-1">
            {POPOVER_NAV.map(item => {
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
      )}

      {/* Content + Preview */}
      {popover.enabled ? (
        <div className="flex-1 flex gap-6 min-w-0">
          {/* Settings Panel */}
          <div className="w-full lg:w-[400px] shrink-0 space-y-4">
            {/* Design */}
            {activeSection === 'design' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Popover Design</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose a visual style for your popover.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {POPOVER_DESIGNS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => update({ design: d.id })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        popover.design === d.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-medium">Size</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'small' as const, label: 'Small' },
                      { id: 'medium' as const, label: 'Medium' },
                      { id: 'large' as const, label: 'Large' },
                    ]).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => update({ size: s.id })}
                        className={`p-2.5 border rounded-lg text-center text-sm font-medium transition-colors ${
                          popover.size === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-medium">Color Theme</Label>
                  <p className="text-xs text-muted-foreground">Leave empty to use the widget color.</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '', label: 'Widget' },
                      { color: '#4F46E5', label: 'Indigo' },
                      { color: '#2563EB', label: 'Blue' },
                      { color: '#0891B2', label: 'Cyan' },
                      { color: '#059669', label: 'Green' },
                      { color: '#D97706', label: 'Amber' },
                      { color: '#DC2626', label: 'Red' },
                      { color: '#7C3AED', label: 'Purple' },
                      { color: '#DB2777', label: 'Pink' },
                      { color: '#1E293B', label: 'Slate' },
                    ].map(c => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => update({ color: c.color })}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors ${
                          popover.color === c.color ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <span
                          className="w-8 h-8 rounded-full border"
                          style={{ background: c.color || widgetColor }}
                        />
                        <span className="text-[10px] text-muted-foreground">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-medium">Background Overlay</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'dark' as const, label: 'Dark' },
                      { id: 'light' as const, label: 'Light' },
                      { id: 'none' as const, label: 'None' },
                    ]).map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => update({ overlay: o.id })}
                        className={`p-2.5 border rounded-lg text-center text-sm font-medium transition-colors ${
                          popover.overlay === o.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="po-blur" checked={popover.overlay_blur} onCheckedChange={v => update({ overlay_blur: !!v })} />
                    <label htmlFor="po-blur" className="text-sm">Apply background blur</label>
                  </div>
                </div>

              </div>
            )}

            {/* Content */}
            {activeSection === 'content' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Content</h3>
                  <p className="text-sm text-muted-foreground mt-1">Customize the text displayed in your popover.</p>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Heading</Label>
                    <Input value={popover.heading} onChange={e => update({ heading: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={popover.description} onChange={e => update({ description: e.target.value })} className="min-h-[80px] resize-none" />
                  </div>
                  {(popover.design === 'urgent' || popover.design === 'minimal') && (
                    <div className="grid gap-1">
                      <Label className="text-xs">Badge Text</Label>
                      <Input value={popover.badge_text} onChange={e => update({ badge_text: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            {activeSection === 'buttons' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Buttons</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure the call-to-action buttons.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Primary Button</Label>
                  <div className="grid gap-2">
                    <div className="flex gap-2">
                      <div className="w-16 shrink-0">
                        <Label className="text-xs">Icon</Label>
                        <Input value={popover.primary_button.icon} onChange={e => updateBtn('primary_button', { icon: e.target.value })} className="text-center text-lg" maxLength={2} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Text</Label>
                        <Input value={popover.primary_button.text} onChange={e => updateBtn('primary_button', { text: e.target.value })} placeholder="Button text" />
                      </div>
                    </div>
                    <Select value={popover.primary_button.action} onValueChange={v => updateBtn('primary_button', { action: v as PopoverButtonConfig['action'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open_chat">Open Chat</SelectItem>
                        <SelectItem value="url">Open URL</SelectItem>
                        <SelectItem value="none">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                    {popover.primary_button.action === 'url' && (
                      <Input value={popover.primary_button.url} onChange={e => updateBtn('primary_button', { url: e.target.value })} placeholder="https://..." />
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Secondary Button</Label>
                    <Switch
                      checked={popover.secondary_button.action !== 'none'}
                      onCheckedChange={v => updateBtn('secondary_button', { action: v ? 'open_chat' : 'none' })}
                    />
                  </div>
                  {popover.secondary_button.action !== 'none' && (
                    <div className="grid gap-2">
                      <div className="flex gap-2">
                        <div className="w-16 shrink-0">
                          <Label className="text-xs">Icon</Label>
                          <Input value={popover.secondary_button.icon} onChange={e => updateBtn('secondary_button', { icon: e.target.value })} className="text-center text-lg" maxLength={2} />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Text</Label>
                          <Input value={popover.secondary_button.text} onChange={e => updateBtn('secondary_button', { text: e.target.value })} placeholder="Button text" />
                        </div>
                      </div>
                      <Select value={popover.secondary_button.action} onValueChange={v => updateBtn('secondary_button', { action: v as PopoverButtonConfig['action'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open_chat">Open Chat</SelectItem>
                          <SelectItem value="url">Open URL</SelectItem>
                        </SelectContent>
                      </Select>
                      {popover.secondary_button.action === 'url' && (
                        <Input value={popover.secondary_button.url} onChange={e => updateBtn('secondary_button', { url: e.target.value })} placeholder="https://..." />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Online Status */}
            {activeSection === 'status' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Online Status</h3>
                  <p className="text-sm text-muted-foreground mt-1">Show an online indicator in the popover.</p>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="text-sm font-medium">Show Status Indicator</Label>
                  <Switch checked={popover.show_online_status} onCheckedChange={v => update({ show_online_status: v })} />
                </div>
                {popover.show_online_status && (
                  <div className="grid gap-1">
                    <Label className="text-xs">Status Text</Label>
                    <Input value={popover.online_status_text} onChange={e => update({ online_status_text: e.target.value })} placeholder="Support Online" />
                  </div>
                )}
              </div>
            )}

            {/* Trigger */}
            {activeSection === 'trigger' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Trigger</h3>
                  <p className="text-sm text-muted-foreground mt-1">Control when the popover appears.</p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'immediate', name: 'Immediate', desc: 'Show on page load' },
                      { id: 'delay', name: 'Time Delay', desc: 'Show after X seconds' },
                      { id: 'scroll', name: 'Scroll Depth', desc: 'Show at scroll %' },
                      { id: 'exit_intent', name: 'Exit Intent', desc: 'Cursor leaves viewport' },
                    ]).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => update({ trigger: t.id })}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          popover.trigger === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                  {popover.trigger === 'delay' && (
                    <div className="grid gap-1">
                      <Label className="text-xs">Delay (seconds)</Label>
                      <Input type="number" min={0} max={300} value={popover.trigger_delay} onChange={e => update({ trigger_delay: parseInt(e.target.value) || 0 })} />
                    </div>
                  )}
                  {popover.trigger === 'scroll' && (
                    <div className="grid gap-1">
                      <Label className="text-xs">Scroll percentage</Label>
                      <Input type="number" min={1} max={100} value={popover.trigger_scroll_percent} onChange={e => update({ trigger_scroll_percent: parseInt(e.target.value) || 50 })} />
                    </div>
                  )}
                  <div className="grid gap-1 pt-1">
                    <Label className="text-xs">Times to show per session</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => update({ max_displays_per_session: n })}
                          className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                            popover.max_displays_per_session === n ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          {n === 5 ? '5+' : n}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => update({ max_displays_per_session: 0 })}
                        className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                          popover.max_displays_per_session === 0 ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        Unlimited
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {popover.max_displays_per_session === 0
                        ? 'Popover will show every time the trigger fires'
                        : popover.max_displays_per_session === 1
                        ? 'Popover will show only once per session'
                        : `Popover will show up to ${popover.max_displays_per_session} times per session`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Page Targeting */}
            {activeSection === 'targeting' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Page Targeting</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose which pages show the popover.</p>
                </div>
                <div className="grid gap-2">
                  {(['all', 'specific'] as const).map(opt => (
                    <label key={opt} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm ${popover.show_on_pages === opt ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <input type="radio" name="po-pages" checked={popover.show_on_pages === opt} onChange={() => update({ show_on_pages: opt })} />
                      {opt === 'all' ? 'All pages' : 'Specific pages only'}
                    </label>
                  ))}
                  {popover.show_on_pages === 'specific' && (
                    <div className="space-y-2 pt-2">
                      {popover.page_urls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <Input value={url} onChange={e => { const urls = [...popover.page_urls]; urls[i] = e.target.value; update({ page_urls: urls }); }} placeholder="/pricing" className="flex-1" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => update({ page_urls: popover.page_urls.filter((_, j) => j !== i) })} className="h-9 w-9 p-0">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => update({ page_urls: [...popover.page_urls, ''] })} className="text-xs">
                        + Add URL pattern
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview — takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="sticky top-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Live Preview</div>
              <div className="rounded-xl border overflow-hidden relative" style={{ minHeight: 560 }}>
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
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center" style={{
                  background: popover.overlay === 'dark' ? 'rgba(0,0,0,0.4)' :
                              popover.overlay === 'light' ? 'rgba(255,255,255,0.6)' : 'transparent',
                  backdropFilter: popover.overlay_blur ? 'blur(4px)' : undefined,
                  WebkitBackdropFilter: popover.overlay_blur ? 'blur(4px)' : undefined,
                }}>
                  <PopoverPreview popover={popover} color={popover.color || widgetColor} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PopoverShowcase popover={popover} update={update} widgetColor={widgetColor} />
      )}

      {/* Fixed save bar */}
      {popover.enabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t px-6 py-3 z-50 flex items-center justify-end gap-3">
          {saveSuccess && <span className="text-sm text-green-600">Saved!</span>}
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isDirty ? 'Save Popover Settings' : 'Saved'}
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Showcase carousel (disabled state) ---
const SHOWCASE_DESIGNS = [
  { id: 'modern', name: 'Modern', desc: 'Clean action cards with icons, descriptions, and online status. Great for service businesses.' },
  { id: 'urgent', name: 'Urgent', desc: 'Bold CTA with attention-grabbing badge. Perfect for time-sensitive offers and support.' },
  { id: 'luxury', name: 'Luxury', desc: 'Elegant serif typography with gold accents. Ideal for premium brands and concierge services.' },
  { id: 'bold', name: 'Bold', desc: 'Full-width bordered design with large text. High-impact for clear call-to-actions.' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean rounded card with pill badge. Subtle and friendly, blends with any website.' },
] as const;

function PopoverShowcase({
  popover, update, widgetColor,
}: {
  popover: PopoverConfig;
  update: (patch: Partial<PopoverConfig>) => void;
  widgetColor: string;
}) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  // Auto-advance every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % SHOWCASE_DESIGNS.length);
        setFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => {
    if (i === idx) return;
    setFading(true);
    setTimeout(() => { setIdx(i); setFading(false); }, 300);
  };

  const current = SHOWCASE_DESIGNS[idx];
  const previewPopover = { ...popover, design: current.id, enabled: true, size: 'medium' as const };

  return (
    <div className="flex-1 flex flex-col items-center py-8 space-y-8">
      {/* Title + Enable */}
      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-xl font-semibold">Popover Designs</h3>
        <p className="text-sm text-muted-foreground">
          Engage visitors with targeted messages. Pick a design and enable to get started.
        </p>
        <Button size="sm" onClick={() => update({ enabled: true, design: current.id })}>
          Activate Popover
        </Button>
      </div>

      {/* Carousel */}
      <div className="flex items-center gap-4 w-full max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 shrink-0 rounded-full"
          onClick={() => goTo((idx - 1 + SHOWCASE_DESIGNS.length) % SHOWCASE_DESIGNS.length)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex flex-col items-center gap-5">
          {/* Preview */}
          <div
            className="bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20 p-8 flex justify-center items-center min-h-[380px] w-full"
            style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
          >
            <PopoverPreview popover={previewPopover} color={widgetColor} />
          </div>

          {/* Title + Description */}
          <div className="text-center space-y-1" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}>
            <h4 className="text-lg font-semibold">{current.name}</h4>
            <p className="text-sm text-muted-foreground max-w-sm">{current.desc}</p>
          </div>

          {/* Dots */}
          <div className="flex gap-2">
            {SHOWCASE_DESIGNS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 shrink-0 rounded-full"
          onClick={() => goTo((idx + 1) % SHOWCASE_DESIGNS.length)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// --- Popover Preview Designs ---
const SIZE_WIDTHS = { small: 300, medium: 380, large: 460 } as const;

function PopoverPreview({ popover, color }: { popover: PopoverConfig; color: string }) {
  const { design, heading, description, badge_text, primary_button, secondary_button, show_online_status, online_status_text } = popover;
  const w = SIZE_WIDTHS[popover.size || 'medium'];

  const closeBtn = (
    <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
      <X className="h-4 w-4" />
    </button>
  );

  if (design === 'urgent') return (
    <div className="relative bg-white rounded-xl shadow-xl border overflow-hidden" style={{ width: w, borderTopColor: color, borderTopWidth: 3 }}>
      {closeBtn}
      <div className="p-5 pt-6 space-y-4">
        <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: color + '20', color }}>⚡ {badge_text}</span>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 uppercase">{heading}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        {primary_button.action !== 'none' && <button className="w-full py-2.5 rounded-md text-white font-bold text-sm uppercase" style={{ background: color }}>{primary_button.icon} {primary_button.text}</button>}
        {secondary_button.action !== 'none' && <button className="w-full py-2.5 rounded-md border border-gray-300 text-gray-800 font-bold text-sm uppercase">{secondary_button.icon} {secondary_button.text}</button>}
      </div>
      {show_online_status && (
        <div className="border-t px-5 py-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-gray-500 uppercase tracking-wide">{online_status_text}</span>
        </div>
      )}
    </div>
  );

  if (design === 'luxury') return (
    <div className="relative bg-[#faf9f6] rounded-lg shadow-xl overflow-hidden" style={{ width: w, borderTop: `3px solid ${color}` }}>
      {closeBtn}
      <div className="p-8 text-center space-y-5">
        <div className="text-3xl">🏠</div>
        <h3 className="text-2xl text-gray-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{heading}</h3>
        <div className="w-10 h-px mx-auto" style={{ background: color }} />
        <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">{description}</p>
        {primary_button.action !== 'none' && <button className="w-full py-3.5 border text-xs font-semibold uppercase tracking-[0.15em] rounded" style={{ borderColor: color, color }}>{primary_button.text}</button>}
        {secondary_button.action !== 'none' && <button className="w-full py-3.5 text-white text-xs font-semibold uppercase tracking-[0.15em] rounded" style={{ background: color }}>{secondary_button.text}</button>}
        <div className="text-xs text-gray-400 uppercase tracking-[0.15em]">Exclusivity Guaranteed</div>
      </div>
    </div>
  );

  if (design === 'bold') return (
    <div className="relative bg-white shadow-xl overflow-hidden" style={{ width: w, border: `3px solid ${color}` }}>
      {closeBtn}
      <div className="p-8 text-center space-y-5">
        <h3 className="text-2xl font-extrabold" style={{ color }}>{heading}</h3>
        {primary_button.action !== 'none' && <button className="w-full py-4 text-white font-bold text-sm uppercase tracking-wide rounded" style={{ background: color }}>{primary_button.icon} {primary_button.text}</button>}
        {secondary_button.action !== 'none' && <button className="w-full py-4 border-2 font-bold text-sm uppercase tracking-wide rounded" style={{ borderColor: color, color }}>{secondary_button.text} {secondary_button.icon}</button>}
        {show_online_status && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-gray-600 uppercase tracking-wide">{online_status_text}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (design === 'minimal') return (
    <div className="relative bg-white rounded-2xl shadow-lg border overflow-hidden" style={{ width: w }}>
      {closeBtn}
      <div className="p-6 pt-8 space-y-4">
        {show_online_status && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border" style={{ background: color + '10', color, borderColor: color + '30' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{online_status_text}
            </span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 text-center">{heading}</h3>
        <p className="text-sm text-gray-500 text-center">{description}</p>
        {primary_button.action !== 'none' && (
          <button className="w-full flex items-center justify-between p-3.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-50" style={{ borderColor: color + '40' }}>
            <span className="flex items-center gap-2"><span style={{ color }}>{primary_button.icon}</span> {primary_button.text}</span><span style={{ color }}>›</span>
          </button>
        )}
        {secondary_button.action !== 'none' && (
          <button className="w-full flex items-center justify-between p-3.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-50" style={{ borderColor: color + '40' }}>
            <span className="flex items-center gap-2"><span style={{ color }}>{secondary_button.icon}</span> {secondary_button.text}</span><span style={{ color }}>›</span>
          </button>
        )}
      </div>
    </div>
  );

  // Modern (default)
  return (
    <div className="relative bg-white rounded-xl shadow-xl overflow-hidden" style={{ width: w, borderTop: `4px solid ${color}` }}>
      {closeBtn}
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">{heading}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        {primary_button.action !== 'none' && (
          <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: color }}>{primary_button.icon || '📅'}</span>
            <div className="flex-1"><div className="text-sm font-semibold text-gray-900">{primary_button.text}</div><div className="text-xs text-gray-500">Book a pro when the job needs extra hands.</div></div>
            <span className="text-gray-400">›</span>
          </button>
        )}
        {secondary_button.action !== 'none' && (
          <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: color }}>{secondary_button.icon || '💬'}</span>
            <div className="flex-1"><div className="text-sm font-semibold text-gray-900">{secondary_button.text}</div><div className="text-xs text-gray-500">Quick advice for those tricky moments.</div></div>
            <span className="text-gray-400">›</span>
          </button>
        )}
      </div>
      {show_online_status && (
        <div className="border-t px-6 py-3 flex items-center justify-end gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs font-medium text-green-600">{online_status_text}</span>
        </div>
      )}
    </div>
  );
}
