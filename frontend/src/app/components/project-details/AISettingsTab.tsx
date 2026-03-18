import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
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
  CheckCircle,
  TrendingUp,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Settings2,
  Database,
  BookOpen,
  Globe,
  Trash2,
  Loader2,
  Upload,
  FileText,
  XCircle,
  History,
  RotateCcw,
  CloudOff,
  Check,
} from 'lucide-react';
import { Input } from '../ui/input';
import api from '../../lib/api';
import { toast } from 'sonner';

type SidebarSection = 'overview' | 'prompt' | 'configuration' | 'training' | 'versions';

interface AISettings {
  ai_enabled: boolean;
  ai_name: string;
  system_prompt: string;
  response_tone: string;
  confidence_threshold: number;
  response_language: string;
  fallback_behavior: string;
  auto_learn: boolean;
}

interface AIStats {
  resolution_rate: number;
  articles_indexed: number;
  total_articles: number;
  total_chats: number;
  ai_handled_chats: number;
  recent_articles: { id: number; title: string; is_published: boolean; created_at: string }[];
}

interface KbArticle {
  id: number;
  title: string;
  is_published: boolean;
  created_at: string;
  category?: { name: string };
}

interface TrainingDoc {
  id: number;
  original_name: string;
  file_size: number;
  file_type: string;
  status: 'processing' | 'completed' | 'failed';
  kb_article_id: number | null;
  error_message: string | null;
  created_at: string;
}

interface VersionEntry {
  id: number;
  version_number: number;
  status: string;
  published_at: string;
  published_by: string;
  ai_name: string;
  response_tone: string;
}

const NAV_ITEMS = [
  { id: 'overview' as SidebarSection, label: 'Overview', icon: BarChart3 },
  { id: 'prompt' as SidebarSection, label: 'Prompt', icon: MessageSquare },
  { id: 'configuration' as SidebarSection, label: 'Configuration', icon: Settings2 },
  { id: 'training' as SidebarSection, label: 'Training Data Sources', icon: Database },
  { id: 'versions' as SidebarSection, label: 'Version History', icon: History },
];

const defaultSettings: AISettings = {
  ai_enabled: true,
  ai_name: 'AI Assistant',
  system_prompt: '',
  response_tone: 'professional',
  confidence_threshold: 75,
  response_language: 'auto',
  fallback_behavior: 'transfer',
  auto_learn: true,
};

export function AISettingsTab({ projectId }: { projectId?: number | string }) {
  const [active, setActive] = useState<SidebarSection>('overview');
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [liveSettings, setLiveSettings] = useState<AISettings>(defaultSettings);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [trainingDocs, setTrainingDocs] = useState<TrainingDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Load data
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      api.get(`/projects/${projectId}/ai-settings`).then((r: any) => r.data?.data).catch(() => null),
      api.get(`/projects/${projectId}/ai-stats`).then((r: any) => r.data?.data).catch(() => null),
      api.get(`/projects/${projectId}/kb/articles`).then((r: any) => (r.data?.data ?? [])).catch(() => []),
      api.get(`/projects/${projectId}/kb/generation-status`).then((r: any) => r.data?.data).catch(() => null),
      api.get(`/projects/${projectId}`).then((r: any) => r.data?.data).catch(() => null),
      api.get(`/projects/${projectId}/training-documents`).then((r: any) => r.data?.data ?? []).catch(() => []),
    ]).then(([aiData, st, art, gen, proj, docs]) => {
      if (aiData) {
        const live = { ...defaultSettings, ...(aiData.live ?? {}) };
        const draft = aiData.draft ? { ...defaultSettings, ...aiData.draft } : null;
        setLiveSettings(live);
        setSettings(draft ?? live);
        setHasUnpublishedChanges(aiData.has_unpublished_changes ?? false);
        setLastPublishedAt(aiData.last_published_at ?? null);
        setCurrentVersion(aiData.current_version ?? 0);
      }
      if (st) setStats(st);
      if (art) setArticles(art as KbArticle[]);
      if (gen?.status) setGenerationStatus(gen.status);
      if (proj?.website) setWebsiteUrl(proj.website);
      setTrainingDocs(docs as TrainingDoc[]);
    }).finally(() => setLoading(false));
  }, [projectId]);

  // Auto-save draft with debounce
  const autosaveDraft = useCallback((newSettings: AISettings) => {
    if (!projectId) return;
    clearTimeout(saveTimerRef.current);
    setDraftStatus('idle');
    saveTimerRef.current = setTimeout(async () => {
      setDraftStatus('saving');
      try {
        await api.put(`/projects/${projectId}/ai-settings/draft`, newSettings);
        setDraftStatus('saved');
        setHasUnpublishedChanges(true);
        setTimeout(() => setDraftStatus('idle'), 2000);
      } catch {
        setDraftStatus('idle');
      }
    }, 1500);
  }, [projectId]);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  const updateSetting = (key: keyof AISettings, value: unknown) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      autosaveDraft(updated);
      return updated;
    });
  };

  async function publishSettings() {
    if (!projectId) return;
    setPublishing(true);
    try {
      const r = await api.post(`/projects/${projectId}/ai-settings/publish`);
      const data = (r as any).data;
      if (data.success) {
        setLiveSettings({ ...settings });
        setHasUnpublishedChanges(false);
        setCurrentVersion(data.version ?? currentVersion + 1);
        setLastPublishedAt(data.published_at ?? new Date().toISOString());
        toast.success(`Published as version ${data.version}`);
      }
    } catch {
      toast.error('Failed to publish settings');
    } finally {
      setPublishing(false);
    }
  }

  function discardDraft() {
    setSettings({ ...liveSettings });
    setHasUnpublishedChanges(false);
    setDraftStatus('idle');
    clearTimeout(saveTimerRef.current);
  }

  async function loadVersions() {
    if (!projectId) return;
    setVersionsLoading(true);
    try {
      const r = await api.get(`/projects/${projectId}/ai-settings/versions`);
      const data = (r as any).data?.data;
      setVersions(data?.data ?? data ?? []);
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setVersionsLoading(false);
    }
  }

  async function restoreVersion(versionId: number) {
    if (!projectId) return;
    setRestoringId(versionId);
    try {
      const r = await api.post(`/projects/${projectId}/ai-settings/restore/${versionId}`);
      const data = (r as any).data;
      if (data.success && data.data) {
        setSettings({ ...defaultSettings, ...data.data });
        setHasUnpublishedChanges(true);
        toast.success(data.message ?? 'Version restored as draft');
        setActive('prompt');
      }
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  }

  useEffect(() => {
    if (active === 'versions') loadVersions();
  }, [active]);

  // Training
  async function crawlWebsite() {
    if (!projectId) return;
    setCrawling(true);
    try {
      await api.post(`/projects/${projectId}/kb/generate`, { async: true });
      toast.success('Website crawl started.');
      setGenerationStatus('processing');
    } catch {
      toast.error('Failed to start crawl');
    } finally {
      setCrawling(false);
    }
  }

  async function deleteArticle(articleId: number) {
    if (!projectId) return;
    try {
      await api.delete(`/projects/${projectId}/kb/articles/${articleId}`);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      toast.success('Article deleted');
    } catch {
      toast.error('Failed to delete article');
    }
  }

  async function uploadDocument(file: File) {
    if (!projectId) return;
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'csv'];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowed.includes(ext)) { toast.error('Unsupported file type.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Max 10MB.'); return; }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = (import.meta as any).env?.VITE_API_URL ?? '/api';
      const res = await fetch(`${baseUrl}/projects/${projectId}/training-documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setTrainingDocs(prev => [data.data, ...prev]);
        toast.success(`"${file.name}" uploaded and processed.`);
      } else {
        toast.error(data.message ?? 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function deleteTrainingDoc(docId: number) {
    if (!projectId) return;
    try {
      await api.delete(`/projects/${projectId}/training-documents/${docId}`);
      setTrainingDocs(prev => prev.filter(d => d.id !== docId));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  }

  function handleFileDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(uploadDocument); }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) { Array.from(e.target.files ?? []).forEach(uploadDocument); e.target.value = ''; }
  function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 shrink-0">
        <nav className="space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
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

        {/* Draft status indicator */}
        <div className="mt-4 px-3">
          {draftStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving draft...
            </div>
          )}
          {draftStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3 w-3" /> Draft saved
            </div>
          )}
          {hasUnpublishedChanges && draftStatus === 'idle' && (
            <div className="flex items-center gap-1.5 text-xs text-orange-500">
              <CloudOff className="h-3 w-3" /> Unpublished changes
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Publish banner */}
        {hasUnpublishedChanges && (
          <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <AlertCircle className="h-4 w-4" />
              <span>You have unpublished changes (draft auto-saved)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={discardDraft} className="text-xs">
                Discard Draft
              </Button>
              <Button
                size="sm"
                onClick={publishSettings}
                disabled={publishing}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                {publishing ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Publishing...</> : 'Publish Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {active === 'overview' && (
          <>
            <Card>
              <CardHeader><CardTitle>AI Performance Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Resolution Rate</div>
                    <div className="text-2xl font-bold text-green-600">{stats ? `${stats.resolution_rate}%` : '—'}</div>
                    <p className="text-xs text-muted-foreground mt-1">Conversations resolved by AI</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Chats</div>
                    <div className="text-2xl font-bold text-primary">{stats ? stats.total_chats : '—'}</div>
                    <p className="text-xs text-muted-foreground mt-1">All conversations</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">AI-Handled Chats</div>
                    <div className="text-2xl font-bold text-orange-600">{stats ? stats.ai_handled_chats : '—'}</div>
                    <p className="text-xs text-muted-foreground mt-1">With AI enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>AI Learning Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Published Articles</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold">{stats?.articles_indexed ?? '—'}</div>
                      <p className="text-xs text-muted-foreground mt-1">In knowledge base</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total Articles</span>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{stats?.total_articles ?? '—'}</div>
                      <p className="text-xs text-muted-foreground mt-1">Including drafts</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Current Version</span>
                        <History className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{currentVersion || '—'}</div>
                      <p className="text-xs text-muted-foreground mt-1">{lastPublishedAt ? `Published ${new Date(lastPublishedAt).toLocaleDateString()}` : 'Not published yet'}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">AI Status</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-lg font-bold">{settings.ai_enabled ? 'Active' : 'Disabled'}</div>
                      <p className="text-xs text-muted-foreground mt-1">Bot status</p>
                    </div>
                  </div>

                  {stats?.recent_articles && stats.recent_articles.length > 0 && (
                    <div>
                      <Label className="mb-3 block">Recent Knowledge Base Activity</Label>
                      <div className="space-y-2">
                        {stats.recent_articles.map(a => (
                          <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            {a.is_published ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{a.title}</p>
                              <p className="text-xs text-muted-foreground">{a.is_published ? 'Published' : 'Draft'} &bull; {new Date(a.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* PROMPT */}
        {active === 'prompt' && (
          <Card>
            <CardHeader><CardTitle>System Prompt</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This prompt is sent to the AI at the start of every chat conversation. Changes are auto-saved as draft — click "Publish Changes" to go live.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="You are a helpful customer support assistant for {company}..."
                  rows={28}
                  value={settings.system_prompt || ''}
                  onChange={e => updateSetting('system_prompt', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{(settings.system_prompt || '').length} / 5000 characters</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex gap-2">
                  <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-primary">
                    <strong>Tips:</strong> Mention your company name, what topics the AI should handle, escalation rules, and any phrases to avoid.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONFIGURATION */}
        {active === 'configuration' && (
          <Card>
            <CardHeader><CardTitle>AI Bot Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base">Enable AI Bot</Label>
                  <p className="text-sm text-muted-foreground">Allow AI to automatically respond to customer inquiries</p>
                </div>
                <Checkbox checked={settings.ai_enabled} onCheckedChange={v => updateSetting('ai_enabled', !!v)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ai-name">AI Assistant Name</Label>
                <Input id="ai-name" value={settings.ai_name} onChange={e => updateSetting('ai_name', e.target.value)} placeholder="AI Assistant" maxLength={50} />
                <p className="text-sm text-muted-foreground">The name customers will see when the AI responds</p>
              </div>

              <div className="grid gap-2">
                <Label>Response Tone</Label>
                <Select value={settings.response_tone} onValueChange={v => updateSetting('response_tone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Confidence Threshold</Label>
                <Select value={String(settings.confidence_threshold)} onValueChange={v => updateSetting('confidence_threshold', parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60% — More responses, less accurate</SelectItem>
                    <SelectItem value="75">75% — Balanced (Recommended)</SelectItem>
                    <SelectItem value="85">85% — Fewer responses, more accurate</SelectItem>
                    <SelectItem value="95">95% — Only very confident responses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Response Language</Label>
                <Select value={settings.response_language} onValueChange={v => updateSetting('response_language', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Fallback Behavior</Label>
                <Select value={settings.fallback_behavior} onValueChange={v => updateSetting('fallback_behavior', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer to human agent</SelectItem>
                    <SelectItem value="collect">Collect contact info</SelectItem>
                    <SelectItem value="suggest">Suggest related articles</SelectItem>
                    <SelectItem value="none">Do nothing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base">Auto-learn from Conversations</Label>
                  <p className="text-sm text-muted-foreground">AI learns from resolved tickets and approved responses</p>
                </div>
                <Checkbox checked={settings.auto_learn} onCheckedChange={v => updateSetting('auto_learn', !!v)} />
              </div>

              <Button variant="outline" onClick={() => { setSettings(defaultSettings); autosaveDraft(defaultSettings); }}>Reset to Defaults</Button>
            </CardContent>
          </Card>
        )}

        {/* VERSION HISTORY */}
        {active === 'versions' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadVersions} disabled={versionsLoading}>
                  {versionsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No published versions yet. Make changes and publish to create your first version.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          v.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          v{v.version_number}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Version {v.version_number}</p>
                            {v.status === 'published' && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Live</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Published {v.published_at ? new Date(v.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            {' '}by {v.published_by}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {v.ai_name} &bull; {v.response_tone}
                          </p>
                        </div>
                      </div>
                      {v.status !== 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreVersion(v.id)}
                          disabled={restoringId === v.id}
                          className="shrink-0"
                        >
                          {restoringId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TRAINING DATA SOURCES */}
        {active === 'training' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Upload documents and AI will learn from them. Supported: PDF, DOC, DOCX, TXT, CSV (max 10MB each).</p>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-border'}`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading and processing...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-muted-foreground mb-1">Drag & drop files here, or click to browse</p>
                      <p className="text-xs text-muted-foreground mb-3">PDF, DOC, DOCX, TXT, CSV — max 10MB</p>
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted/50 transition-colors">
                          <Upload className="h-3.5 w-3.5" /> Choose Files
                        </span>
                        <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.txt,.csv" onChange={handleFileInput} />
                      </label>
                    </>
                  )}
                </div>

                {trainingDocs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents ({trainingDocs.length})</Label>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {trainingDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                              doc.file_type === 'pdf' ? 'bg-red-100 text-red-600' : doc.file_type === 'csv' ? 'bg-green-100 text-green-600' : doc.file_type === 'txt' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                            }`}>{doc.file_type.toUpperCase()}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc.original_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size)}</span>
                                <span className="text-gray-300">·</span>
                                {doc.status === 'completed' && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Processed</span>}
                                {doc.status === 'processing' && <span className="flex items-center gap-1 text-xs text-orange-500"><Loader2 className="h-3 w-3 animate-spin" /> Processing</span>}
                                {doc.status === 'failed' && <span className="flex items-center gap-1 text-xs text-red-500" title={doc.error_message ?? ''}><XCircle className="h-3 w-3" /> Failed</span>}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteTrainingDoc(doc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Website Crawl</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">AI will index all public pages from your website.</p>
                <div className="grid gap-2">
                  <Label>Website URL</Label>
                  <div className="flex gap-2">
                    <Input type="url" placeholder="https://example.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
                    <Button variant="outline" onClick={crawlWebsite} disabled={crawling || generationStatus === 'processing'}>
                      {crawling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {generationStatus === 'processing' ? 'Crawling...' : 'Crawl Now'}
                    </Button>
                  </div>
                </div>
                {generationStatus && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${generationStatus === 'completed' ? 'bg-green-50 text-green-700' : generationStatus === 'processing' ? 'bg-orange-50 text-orange-700' : 'bg-muted/50 text-muted-foreground'}`}>
                    {generationStatus === 'completed' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Status: <strong className="capitalize">{generationStatus}</strong>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Knowledge Base Articles</CardTitle>
                  <span className="text-sm text-muted-foreground">{articles.length} total</span>
                </div>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No articles yet. Upload documents or crawl your website.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {articles.map((article: KbArticle) => (
                      <div key={article.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${article.is_published ? 'bg-green-500' : 'bg-muted'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{article.title}</p>
                            <p className="text-xs text-muted-foreground">{article.is_published ? 'Published' : 'Draft'} · {article.category?.name ?? 'Uncategorized'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteArticle(article.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
