import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Copy, ArrowLeft, Loader2, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { api } from '../../api/client';

interface FormField {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
}

interface ContactForm {
  id: number;
  name: string;
  slug: string;
  project_id: number;
  fields: FormField[];
  is_active: boolean;
  submit_button_text: string;
  success_message: string;
  created_at: string;
  project?: { id: number; name: string };
}

interface Project {
  id: string;
  name: string;
}

const DEFAULT_FIELDS: FormField[] = [
  { key: 'name', label: 'Full Name', enabled: true, required: false },
  { key: 'email', label: 'Email', enabled: true, required: true },
  { key: 'phone', label: 'Phone', enabled: false, required: false },
  { key: 'company', label: 'Company', enabled: false, required: false },
  { key: 'subject', label: 'Subject', enabled: true, required: true },
  { key: 'message', label: 'Message', enabled: true, required: true },
];

export function ContactFormSettingsView() {
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ContactForm | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>('/contact-forms').then((r: any) => setForms(r?.data ?? [])).catch(() => {}),
      api.get<any>('/projects').then((r: any) => {
        const list = ((r as any)?.data ?? []).map((p: any) => ({ id: String(p.id), name: p.name }));
        setProjects(list);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const startCreate = () => {
    setIsNew(true);
    setEditing({
      id: 0,
      name: '',
      slug: '',
      project_id: projects.length > 0 ? Number(projects[0].id) : 0,
      fields: DEFAULT_FIELDS.map((f) => ({ ...f })),
      is_active: true,
      submit_button_text: 'Submit',
      success_message: 'Thank you! We will get back to you soon.',
      created_at: '',
    });
  };

  const startEdit = (form: ContactForm) => {
    setIsNew(false);
    setEditing({ ...form, fields: form.fields.map((f) => ({ ...f })) });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Form name is required'); return; }
    if (!editing.project_id) { toast.error('Please select a project'); return; }

    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        project_id: editing.project_id,
        fields: editing.fields,
        is_active: editing.is_active,
        submit_button_text: editing.submit_button_text,
        success_message: editing.success_message,
      };

      if (isNew) {
        const res: any = await api.post('/contact-forms', payload);
        setForms((prev) => [res.data, ...prev]);
        toast.success('Contact form created');
      } else {
        const res: any = await api.put(`/contact-forms/${editing.id}`, payload);
        setForms((prev) => prev.map((f) => (f.id === editing.id ? res.data : f)));
        toast.success('Contact form updated');
      }
      setEditing(null);
    } catch {
      toast.error('Failed to save contact form');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this contact form?')) return;
    try {
      await api.delete(`/contact-forms/${id}`);
      setForms((prev) => prev.filter((f) => f.id !== id));
      toast.success('Form deleted');
    } catch {
      toast.error('Failed to delete form');
    }
  };

  const toggleField = (index: number, prop: 'enabled' | 'required') => {
    if (!editing) return;
    // Email must always be enabled and required
    if (editing.fields[index].key === 'email') return;
    const updated = [...editing.fields];
    updated[index] = { ...updated[index], [prop]: !updated[index][prop] };
    if (prop === 'enabled' && !updated[index].enabled) {
      updated[index].required = false;
    }
    setEditing({ ...editing, fields: updated });
  };

  const copyEmbed = (slug: string) => {
    const frontendUrl = window.location.origin;
    const code = `<iframe src="${frontendUrl}/contact/${slug}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success('Embed code copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Edit / Create view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-semibold">{isNew ? 'Create Contact Form' : 'Edit Contact Form'}</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — Configuration */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Form Name</label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Website Contact Form"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Project</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editing.project_id}
                onChange={(e) => setEditing({ ...editing, project_id: Number(e.target.value) })}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Submissions will create tickets in this project</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Form Fields</label>
              <div className="space-y-3">
                {editing.fields.map((field, i) => (
                  <div key={field.key} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.enabled}
                        onCheckedChange={() => toggleField(i, 'enabled')}
                        disabled={field.key === 'email'}
                      />
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.key === 'email' && (
                        <Badge variant="secondary" className="text-xs">Always on</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Required</span>
                      <Switch
                        checked={field.required}
                        onCheckedChange={() => toggleField(i, 'required')}
                        disabled={field.key === 'email' || !field.enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Submit Button Text</label>
              <Input
                value={editing.submit_button_text}
                onChange={(e) => setEditing({ ...editing, submit_button_text: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Success Message</label>
              <Textarea
                value={editing.success_message}
                onChange={(e) => setEditing({ ...editing, success_message: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Active</span>
              <Switch
                checked={editing.is_active}
                onCheckedChange={(val) => setEditing({ ...editing, is_active: val })}
              />
            </div>

            {!isNew && editing.slug && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Embed Code</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`<iframe src="${window.location.origin}/contact/${editing.slug}" width="100%" height="600" ...>`}
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={() => copyEmbed(editing.slug)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {isNew ? 'Create Form' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>

          {/* Right — Live Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Preview</span>
            </div>
            <Card>
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold">{editing.name || 'Contact Form'}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing.fields.filter((f) => f.enabled).map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    {field.key === 'message' ? (
                      <Textarea placeholder={`Enter ${field.label.toLowerCase()}...`} rows={3} disabled />
                    ) : (
                      <Input placeholder={`Enter ${field.label.toLowerCase()}...`} disabled />
                    )}
                  </div>
                ))}
                <Button className="w-full" disabled>
                  {editing.submit_button_text || 'Submit'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            Create embeddable contact forms that automatically create support tickets.
          </p>
        </div>
        <Button onClick={startCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Create Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No contact forms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first form to start collecting leads and support requests.
            </p>
            <Button onClick={startCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{form.name}</h4>
                      <Badge variant={form.is_active ? 'default' : 'secondary'} className="text-xs">
                        {form.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.project?.name} &middot; {form.fields.filter((f) => f.enabled).length} fields
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyEmbed(form.slug)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Embed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(form)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(form.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
