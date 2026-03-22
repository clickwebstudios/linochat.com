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
import { Loader2, X } from 'lucide-react';
import { api } from '../../api/client';

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

const POPOVER_DESIGNS = [
  { id: 'urgent', name: 'Urgent', desc: 'Orange badge, bold CTA' },
  { id: 'luxury', name: 'Luxury', desc: 'Elegant serif style' },
  { id: 'modern', name: 'Modern', desc: 'Action cards with icons' },
  { id: 'bold', name: 'Bold', desc: 'Full-width bordered' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean pill badge' },
] as const;

interface PopoversTabProps {
  projectId: string;
}

export function PopoversTab({ projectId }: PopoversTabProps) {
  const [popover, setPopover] = useState<PopoverConfig>(DEFAULT_POPOVER);
  const [widgetColor, setWidgetColor] = useState('#4F46E5');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    api.get<any>(`/projects/${projectId}/widget-settings`).then(res => {
      if (res.success && res.data) {
        if (res.data.popover) setPopover(prev => ({ ...prev, ...res.data.popover }));
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
    <div className="flex gap-8">
      {/* Left: Config */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="text-sm font-medium">Enable Popover</div>
            <p className="text-xs text-muted-foreground">Show a popover to visitors on your website</p>
          </div>
          <Switch checked={popover.enabled} onCheckedChange={v => update({ enabled: v })} />
        </div>

        {popover.enabled && (
          <>
            {/* Design Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Popover Design</Label>
              <div className="grid grid-cols-3 gap-2">
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
            </div>

            {/* Content */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Content</Label>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Heading</Label>
                  <Input value={popover.heading} onChange={e => update({ heading: e.target.value })} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={popover.description} onChange={e => update({ description: e.target.value })} className="min-h-[60px] resize-none" />
                </div>
                {(popover.design === 'urgent' || popover.design === 'minimal') && (
                  <div className="grid gap-1">
                    <Label className="text-xs">Badge Text</Label>
                    <Input value={popover.badge_text} onChange={e => update({ badge_text: e.target.value })} />
                  </div>
                )}
              </div>
            </div>

            {/* Primary Button */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Primary Button</Label>
              <div className="grid gap-2">
                <Input value={popover.primary_button.text} onChange={e => updateBtn('primary_button', { text: e.target.value })} placeholder="Button text" />
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

            {/* Secondary Button */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Secondary Button</Label>
              <div className="grid gap-2">
                <Input value={popover.secondary_button.text} onChange={e => updateBtn('secondary_button', { text: e.target.value })} placeholder="Button text" />
                <Select value={popover.secondary_button.action} onValueChange={v => updateBtn('secondary_button', { action: v as PopoverButtonConfig['action'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_chat">Open Chat</SelectItem>
                    <SelectItem value="url">Open URL</SelectItem>
                    <SelectItem value="none">Hidden</SelectItem>
                  </SelectContent>
                </Select>
                {popover.secondary_button.action === 'url' && (
                  <Input value={popover.secondary_button.url} onChange={e => updateBtn('secondary_button', { url: e.target.value })} placeholder="https://..." />
                )}
              </div>
            </div>

            {/* Online Status */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Online Status Indicator</Label>
                <Switch checked={popover.show_online_status} onCheckedChange={v => update({ show_online_status: v })} />
              </div>
              {popover.show_online_status && (
                <Input value={popover.online_status_text} onChange={e => update({ online_status_text: e.target.value })} placeholder="Support Online" />
              )}
            </div>

            {/* Trigger */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Trigger</Label>
              <Select value={popover.trigger} onValueChange={v => update({ trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Show immediately</SelectItem>
                  <SelectItem value="delay">After a delay</SelectItem>
                  <SelectItem value="scroll">On scroll</SelectItem>
                  <SelectItem value="exit_intent">Exit intent</SelectItem>
                </SelectContent>
              </Select>
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
              <div className="flex items-center gap-2">
                <Checkbox id="po-once" checked={popover.show_once_per_session} onCheckedChange={v => update({ show_once_per_session: !!v })} />
                <label htmlFor="po-once" className="text-xs">Show only once per session</label>
              </div>
            </div>

            {/* Page Targeting */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Page Targeting</Label>
              {(['all', 'specific'] as const).map(opt => (
                <label key={opt} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-sm ${popover.show_on_pages === opt ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input type="radio" name="po-pages" checked={popover.show_on_pages === opt} onChange={() => update({ show_on_pages: opt })} />
                  {opt === 'all' ? 'All pages' : 'Specific pages only'}
                </label>
              ))}
              {popover.show_on_pages === 'specific' && (
                <div className="space-y-2 pl-2">
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
          </>
        )}

        {/* Save */}
        <div className="flex gap-2 items-center pt-2">
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Popover Settings
          </Button>
          {saveSuccess && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </div>

      {/* Right: Live Preview */}
      {popover.enabled && (
        <div className="w-[420px] shrink-0">
          <div className="sticky top-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Live Preview</div>
            <div className="bg-muted/30 rounded-lg p-6 flex justify-center min-h-[300px] items-start pt-8">
              <PopoverPreview popover={popover} color={widgetColor} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Popover Preview Designs ---
function PopoverPreview({ popover, color }: { popover: PopoverConfig; color: string }) {
  const { design, heading, description, badge_text, primary_button, secondary_button, show_online_status, online_status_text } = popover;

  if (design === 'urgent') return (
    <div className="w-[320px] bg-white rounded-xl shadow-xl border overflow-hidden" style={{ borderTopColor: '#f59e0b', borderTopWidth: 3 }}>
      <div className="p-5 space-y-4">
        <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded text-xs font-bold">⚡ {badge_text}</span>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 uppercase">{heading}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        {primary_button.action !== 'none' && <button className="w-full py-2.5 rounded-md text-white font-bold text-sm uppercase" style={{ background: color }}>{primary_button.text}</button>}
        {secondary_button.action !== 'none' && <button className="w-full py-2.5 rounded-md border border-gray-300 text-gray-800 font-bold text-sm uppercase">{secondary_button.text}</button>}
      </div>
      {show_online_status && (
        <div className="border-t px-5 py-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-gray-500 uppercase tracking-wide">{online_status_text}</span>
        </div>
      )}
    </div>
  );

  if (design === 'luxury') return (
    <div className="w-[340px] bg-[#faf9f6] rounded-lg shadow-xl overflow-hidden" style={{ borderTop: '3px solid', borderImage: 'linear-gradient(90deg, #b8860b, #daa520, #b8860b) 1' }}>
      <div className="p-8 text-center space-y-5">
        <div className="text-3xl">🏠</div>
        <h3 className="text-2xl text-gray-800" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{heading}</h3>
        <div className="w-10 h-px bg-gray-300 mx-auto" />
        <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">{description}</p>
        {primary_button.action !== 'none' && <button className="w-full py-3.5 border border-gray-400 text-gray-700 text-xs font-semibold uppercase tracking-[0.15em] rounded">{primary_button.text}</button>}
        {secondary_button.action !== 'none' && <button className="w-full py-3.5 bg-gray-900 text-white text-xs font-semibold uppercase tracking-[0.15em] rounded">{secondary_button.text}</button>}
        <div className="text-xs text-gray-400 uppercase tracking-[0.15em]">Exclusivity Guaranteed</div>
      </div>
    </div>
  );

  if (design === 'bold') return (
    <div className="w-[320px] bg-white shadow-xl overflow-hidden" style={{ border: `3px solid ${color}` }}>
      <div className="p-8 text-center space-y-5">
        <h3 className="text-2xl font-extrabold" style={{ color }}>{heading}</h3>
        {primary_button.action !== 'none' && <button className="w-full py-4 text-white font-bold text-sm uppercase tracking-wide rounded" style={{ background: color }}>{primary_button.text} →</button>}
        {secondary_button.action !== 'none' && <button className="w-full py-4 border-2 font-bold text-sm uppercase tracking-wide rounded" style={{ borderColor: color, color }}>{secondary_button.text} 💬</button>}
        {show_online_status && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-gray-600 uppercase tracking-wide">{online_status_text}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (design === 'minimal') return (
    <div className="w-[320px] bg-white rounded-2xl shadow-lg border overflow-hidden">
      <div className="p-5 space-y-4">
        {show_online_status && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />{online_status_text}
            </span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 text-center">{heading}</h3>
        <p className="text-sm text-gray-500 text-center">{description}</p>
        {primary_button.action !== 'none' && (
          <button className="w-full flex items-center justify-between p-3 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <span className="flex items-center gap-2">📅 {primary_button.text}</span><span className="text-gray-400">›</span>
          </button>
        )}
        {secondary_button.action !== 'none' && (
          <button className="w-full flex items-center justify-between p-3 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <span className="flex items-center gap-2">❓ {secondary_button.text}</span><span className="text-gray-400">›</span>
          </button>
        )}
      </div>
    </div>
  );

  // Modern (default)
  return (
    <div className="w-[340px] bg-white rounded-xl shadow-xl overflow-hidden" style={{ borderTop: `4px solid ${color}` }}>
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">{heading}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        {primary_button.action !== 'none' && (
          <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: color }}>📅</span>
            <div><div className="text-sm font-semibold text-gray-900">{primary_button.text}</div><div className="text-xs text-gray-500">Book a pro when the job needs extra hands.</div></div>
            <span className="ml-auto text-gray-400">›</span>
          </button>
        )}
        {secondary_button.action !== 'none' && (
          <button className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: color }}>💬</span>
            <div><div className="text-sm font-semibold text-gray-900">{secondary_button.text}</div><div className="text-xs text-gray-500">Quick advice for those tricky moments.</div></div>
            <span className="ml-auto text-gray-400">›</span>
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
