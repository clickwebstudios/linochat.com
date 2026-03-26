import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Loader2, ArrowLeft, Save, Search,
} from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';

interface Category { id: number; name: string; slug: string; articles_count: number; }
interface Article { id: number; title: string; slug: string; category_id: number; category: { name: string }; status: string; is_published: boolean; views_count: number; helpful_count: number; not_helpful_count: number; content: string; }

export default function HelpCenterManager() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Find help center project
  useEffect(() => {
    api.get<any>('/superadmin/projects?per_page=100').then(res => {
      const projects = res.data || [];
      const helpProject = projects.find((p: any) => p.name === 'LinoChat Help Center');
      if (helpProject) setProjectId(String(helpProject.id));
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [catRes, artRes] = await Promise.all([
        api.get<any>(`/projects/${projectId}/kb/categories`),
        api.get<any>(`/projects/${projectId}/kb/articles`),
      ]);
      setCategories(catRes.data || []);
      setArticles(Array.isArray(artRes.data) ? artRes.data : []);
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { if (projectId) fetchData(); }, [projectId, fetchData]);

  const handleSave = async () => {
    if (!editingArticle || !projectId) return;
    setSaving(true);
    try {
      if (editingArticle.id) {
        await api.put(`/projects/${projectId}/kb/articles/${editingArticle.id}`, {
          title: editingArticle.title,
          content: editingArticle.content,
          is_published: editingArticle.is_published,
          category_id: editingArticle.category_id,
        });
        toast.success('Article updated');
      } else {
        await api.post(`/projects/${projectId}/kb/categories/${editingArticle.category_id}/articles`, {
          title: editingArticle.title,
          content: editingArticle.content,
          is_published: editingArticle.is_published ?? true,
        });
        toast.success('Article created');
      }
      setView('list');
      setEditingArticle(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    try {
      await api.delete(`/projects/${projectId}/kb/articles/${id}`);
      toast.success('Article deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const togglePublish = async (article: Article) => {
    try {
      await api.put(`/projects/${projectId}/kb/articles/${article.id}`, {
        is_published: !article.is_published,
      });
      fetchData();
    } catch {}
  };

  if (!projectId) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-muted-foreground mb-4">Help Center project not found. Run the HelpCenterSeeder to create it.</p>
        <code className="text-sm bg-muted px-3 py-1.5 rounded">php artisan db:seed --class=HelpCenterSeeder</code>
      </div>
    );
  }

  // Edit view
  if (view === 'edit' && editingArticle) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setView('list'); setEditingArticle(null); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{editingArticle.id ? 'Edit Article' : 'New Article'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={editingArticle.title || ''} onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })} placeholder="Article title" />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={String(editingArticle.category_id || '')} onValueChange={v => setEditingArticle({ ...editingArticle, category_id: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Content (Markdown)</Label>
              <Textarea
                value={editingArticle.content || ''}
                onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                placeholder="Write article content in Markdown..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingArticle.is_published ?? true} onChange={e => setEditingArticle({ ...editingArticle, is_published: e.target.checked })} />
                Published
              </label>
              <Button onClick={handleSave} disabled={saving || !editingArticle.title || !editingArticle.category_id}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {editingArticle.id ? 'Update' : 'Create'} Article
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Help Center Articles</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{articles.length} articles</Badge>
          <Button size="sm" onClick={() => { setEditingArticle({ is_published: true, category_id: categories[0]?.id }); setView('edit'); }}>
            <Plus className="h-4 w-4 mr-1" /> New Article
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search articles..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Helpful</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(article => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium text-sm max-w-[300px] truncate">{article.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{article.category?.name}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={article.is_published ? 'default' : 'secondary'} className="text-xs cursor-pointer" onClick={() => togglePublish(article)}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{article.views_count || 0}</TableCell>
                  <TableCell className="text-center text-sm">
                    {article.helpful_count || 0} / {(article.helpful_count || 0) + (article.not_helpful_count || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingArticle(article); setView('edit'); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No articles found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
