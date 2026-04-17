import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  BookOpen,
} from 'lucide-react';
import { AIGenerateKBDialog } from '../AIGenerateKBDialog';
import { NewKBArticleDialog } from './NewKBArticleDialog';
import { useAuthStore } from '../../stores/authStore';
import { useProjectsStore, selectProjects, selectProjectsLoading } from '../../stores/projectsStore';
import { getDynamicArticlesByCategory, DynamicArticle } from '../../lib/articleStore';
import { toast } from 'sonner';
import { usePlanGuard } from '../../hooks/usePlanGuard';
import { UpgradeLimitDialog } from '../UpgradeLimitDialog';

interface AgentKnowledgeViewProps {
  basePath: string;
  selectedCompanyId?: string | null;
  /**
   * Workspaces selected in the header dropdown. When empty, KB is loaded
   * for every project the user has access to in the active company.
   */
  selectedProjects?: string[];
}

export function AgentKnowledgeView({ basePath, selectedProjects }: AgentKnowledgeViewProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Use projects store
  const projects = useProjectsStore(selectProjects);
  const projectsLoading = useProjectsStore(selectProjectsLoading);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);

  const [hasKnowledgeBase, setHasKnowledgeBase] = useState(true);
  const [kbSearchQuery, setKbSearchQuery] = useState('');
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
  const [kbRefreshKey, setKbRefreshKey] = useState(0);
  const [newKBArticleDialogOpen, setNewKBArticleDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [upgradeArticleDialogOpen, setUpgradeArticleDialogOpen] = useState(false);
  const { isAllowed } = usePlanGuard();
  
  // Real data from API
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(kbSearchQuery, 300);

  // Fetch projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  // Lookup map: project_id -> project object (for category labels + dialog defaults)
  const projectsById = useMemo(() => {
    const m = new Map<string, any>();
    projects.forEach(p => m.set(String(p.id), p));
    return m;
  }, [projects]);

  // Effective project IDs to load KB for. If the user has filtered the
  // workspace dropdown, honor that selection; otherwise load every project
  // they have access to in the active company.
  const effectiveProjectIds = useMemo(() => {
    const all = projects.map(p => String(p.id));
    if (!selectedProjects || selectedProjects.length === 0) return all;
    const selected = new Set(selectedProjects.map(String));
    const filtered = all.filter(id => selected.has(id));
    return filtered.length > 0 ? filtered : all;
  }, [projects, selectedProjects]);

  // Keep currentProject populated so the New Article dialog has a sensible
  // default project when a category somehow lacks project_id.
  useEffect(() => {
    if (projects.length === 0) {
      setCurrentProject(null);
      return;
    }
    const stillExists = currentProject && projects.find(p => p.id === currentProject.id);
    if (!stillExists) setCurrentProject(projects[0]);
  }, [projects, currentProject]);

  useEffect(() => {
    if (effectiveProjectIds.length === 0) {
      if (!projectsLoading) {
        setLoading(false);
        setCategories([]);
        setArticles({});
        setHasKnowledgeBase(false);
      }
      return;
    }

    let cancelled = false;
    const loadAll = async () => {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const allCategories: any[] = [];
      const articlesMap: Record<string, any[]> = {};

      await Promise.all(effectiveProjectIds.map(async (projectId) => {
        try {
          const catResp = await fetch(`/api/projects/${projectId}/kb/categories`, { headers });
          const catData = await catResp.json();
          if (!catData.success || !catData.data?.length) return;

          const projectName = projectsById.get(String(projectId))?.name;
          catData.data.forEach((c: any) => {
            allCategories.push({ ...c, _projectName: projectName });
          });

          await Promise.all(catData.data.map(async (cat: any) => {
            try {
              const artResp = await fetch(`/api/projects/${projectId}/kb/categories/${cat.id}/articles`, { headers });
              const artData = await artResp.json();
              if (artData.success) articlesMap[cat.id] = artData.data;
            } catch (err) {
              console.error(`Failed to load articles for category ${cat.id}:`, err);
            }
          }));
        } catch (err) {
          console.error(`Failed to load KB for project ${projectId}:`, err);
        }
      }));

      if (cancelled) return;
      setCategories(allCategories);
      setArticles(articlesMap);
      setSelectedCategoryId(prev => {
        if (allCategories.find(c => String(c.id) === String(prev))) return prev;
        return allCategories[0]?.id ?? '';
      });
      setHasKnowledgeBase(allCategories.length > 0);
      setLoading(false);
    };

    loadAll();
    return () => { cancelled = true; };
  // effectiveProjectIds is a fresh array each render — depend on its joined string
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveProjectIds.join(','), projectsLoading, kbRefreshKey]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show empty state
  if (!hasKnowledgeBase || categories.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Knowledge Base Yet</h3>
        <p className="text-muted-foreground mb-6">Create your first knowledge base articles to help customers.</p>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setAiGenerateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate with AI
        </Button>
        <AIGenerateKBDialog
          open={aiGenerateDialogOpen}
          onOpenChange={setAiGenerateDialogOpen}
          onGenerate={(projectId) => {
            const project = projects.find(p => p.id === projectId);
            if (project) setCurrentProject(project);
            setKbRefreshKey(k => k + 1);
          }}
        />
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Merge API articles with dynamic AI-generated articles
  const getMergedArticles = (categoryId: string) => {
    const apiArticles = articles[categoryId] || [];
    const dynamicArticles = getDynamicArticlesByCategory(categoryId).map((art: DynamicArticle) => ({
      id: art.id,
      title: art.title,
      is_published: art.status === 'published',
      views: art.views,
      created_at: art.createdAt,
      updated_at: art.updatedAt,
      tags: art.tags,
      _isDynamic: true,
    }));
    return [...apiArticles, ...dynamicArticles];
  };

  const isSearching = debouncedSearch.trim().length > 0;

  // Cross-category search when a query is active
  const searchResults = isSearching
    ? categories.flatMap(cat =>
        getMergedArticles(cat.id)
          .filter((a: any) => a.title?.toLowerCase().includes(debouncedSearch.toLowerCase()))
          .map((a: any) => ({ ...a, _categoryName: cat.name }))
      )
    : [];

  const selectedArticles = selectedCategoryId ? getMergedArticles(selectedCategoryId) : [];
  const filteredArticles = isSearching ? searchResults : selectedArticles;
  
  // Calculate total including dynamic articles across all categories
  const dynamicArticlesTotal = categories.reduce((sum, cat) => {
    return sum + getDynamicArticlesByCategory(cat.id).length;
  }, 0);
  const totalArticles = Object.values(articles).reduce((sum, arr) => sum + arr.length, 0) + dynamicArticlesTotal;

  const getCategoryDraftCount = (catId: string) => {
    const apiDrafts = (articles[catId] || []).filter((a: any) => !a.is_published).length;
    const dynamicDrafts = getDynamicArticlesByCategory(catId).filter((a: DynamicArticle) => a.status === 'draft').length;
    return apiDrafts + dynamicDrafts;
  };

  return (
    <div className="bg-[#f9fafb] min-h-[calc(100vh-4rem)] p-6">
      {/* Header - Figma design */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a] flex items-center gap-2 leading-7">
            <BookOpen className="h-5 w-5 text-primary" />
            Knowledge Base
          </h2>
          <p className="text-sm text-[#6a7282] mt-1">
            {categories.length} categories · {totalArticles} articles
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 h-9 px-4"
          onClick={() => {
            const totalArticleCount = categories.reduce((sum: number, c: any) =>
              sum + (articles[c.id]?.length || 0) + getDynamicArticlesByCategory(c.id).length, 0);
            if (!isAllowed('maxArticles', totalArticleCount)) {
              setUpgradeArticleDialogOpen(true);
            } else {
              setNewKBArticleDialogOpen(true);
            }
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar: Categories - Figma design */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-card border border-[rgba(0,0,0,0.1)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(0,0,0,0.1)]">
              <h3 className="text-sm font-medium text-[#0a0a0a]">Categories</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 space-y-0.5">
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                const catArticles = articles[category.id] || [];
                const draftCount = getCategoryDraftCount(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#eff6ff] border border-[#bedbff]'
                        : 'border border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[#bedbff]' : 'bg-[#f3f4f6]'
                      }`}
                    >
                      <FileText className={`h-4 w-4 ${isSelected ? 'text-[#1c398e]' : 'text-[#6a7282]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSelected ? 'text-[#1c398e]' : 'text-[#364153]'}`}>
                        {category.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6a7282] mt-0.5">
                        <span>{catArticles.length} articles</span>
                        {draftCount > 0 && (
                          <span className="text-[#ff6900]">{draftCount} draft</span>
                        )}
                      </div>
                      {(category._projectName || projectsById.get(String(category.project_id))?.name) && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs text-[#99a1af] truncate">
                            {category._projectName || projectsById.get(String(category.project_id))?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content: Articles - Figma design */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-[rgba(0,0,0,0.1)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-5 gap-4">
              <div>
                <h3 className="text-base font-medium text-[#0a0a0a]">
                  {isSearching ? `Search results` : selectedCategory?.name}
                </h3>
                <p className="text-sm text-[#6a7282] mt-0.5">
                  {filteredArticles.length} {isSearching ? `results for "${debouncedSearch}"` : 'articles'}
                </p>
              </div>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717182]" />
                <Input
                  placeholder="Search articles..."
                  value={kbSearchQuery}
                  onChange={(e) => setKbSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-[#f3f3f5] border-0"
                />
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-[#6a7282]">
                {kbSearchQuery ? 'No articles found' : 'No articles in this category'}
              </div>
            ) : (
              <div>
                {filteredArticles.map((article: any, index: number) => (
                  <div
                    key={article.id}
                    className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/50/50 transition-colors ${
                      index < filteredArticles.length - 1 ? 'border-b border-[rgba(0,0,0,0.1)]' : ''
                    }`}
                    onClick={() => navigate(`${basePath}/knowledge/article/${article.id}`)}
                  >
                    <FileText className="h-4 w-4 text-[#6a7282] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#0a0a0a] font-normal">{article.title}</div>
                      <div className="text-xs text-[#99a1af] mt-0.5 flex items-center gap-2">
                        {isSearching && article._categoryName && (
                          <span className="text-primary">{article._categoryName} · </span>
                        )}
                        Updated {article.updated_at?.substring(0, 10) || article.created_at?.substring(0, 10)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
                        <Eye className="h-3 w-3" />
                        {article.views ?? 0}
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium ${
                          article.is_published
                            ? 'bg-[#dcfce7] text-[#008236]'
                            : 'border border-[#ffd6a8] text-[#f54900] bg-transparent'
                        }`}
                      >
                        {article.is_published ? 'published' : 'draft'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`${basePath}/knowledge/article/${article.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New KB Article Dialog */}
      <NewKBArticleDialog
        open={newKBArticleDialogOpen}
        onOpenChange={setNewKBArticleDialogOpen}
        projects={projects.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color || '#3b82f6',
        }))}
        categories={categories.map(c => ({
          id: c.id,
          name: c.name,
          articleCount: (articles[c.id]?.length || 0) + getDynamicArticlesByCategory(c.id).length,
          projectId: c.project_id || currentProject?.id || '',
        }))}
        onCreateFromScratch={(categoryId, _categoryName, projectId) => {
          navigate(`${basePath}/create-article?category=${categoryId}&project=${projectId}`);
        }}
        onGenerateWithAI={async (categoryId, categoryName, source, sourceType, projectId) => {
          const loadingToast = toast.loading('Generating article with AI...');
          
          try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/projects/${projectId}/kb/categories/${categoryId}/generate-article`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                source_type: sourceType,
                source: source,
              }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to generate article');
            }

            // Dismiss loading toast
            toast.dismiss(loadingToast);
            
            // Show success toast
            toast.success('Article generated successfully', {
              description: `"${data.data.title}" has been added to ${categoryName} as a draft.`,
            });
            
            // Refresh the knowledge base to show the new article
            setKbRefreshKey(k => k + 1);
            
            // Navigate to the article details page
            navigate(`${basePath}/knowledge/article/${data.data.id}`);
          } catch (error) {
            toast.dismiss(loadingToast);
            const message = error instanceof Error ? error.message : 'Failed to generate article';
            toast.error('Generation failed', { description: message });
          }
        }}
        onCategoryCreated={(_name) => {
          // In a real implementation, this would create the category via API
          // and return the new category ID
          return Date.now().toString();
        }}
      />

      <UpgradeLimitDialog
        open={upgradeArticleDialogOpen}
        onClose={() => setUpgradeArticleDialogOpen(false)}
        title="Article limit reached"
        description="You've reached your plan's article limit. Upgrade to publish more knowledge base articles."
        basePath={basePath}
      />
    </div>
  );
}
