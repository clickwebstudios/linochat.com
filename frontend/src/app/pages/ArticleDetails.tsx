import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getDynamicArticle, deleteDynamicArticle, saveDynamicArticle } from '../lib/articleStore';
import { toast } from 'sonner';
import { renderContent } from './articleMarkdownRenderer';
import type { EditData } from './ArticleEditForm';
import ArticleHeader from './ArticleHeader';
import ArticleEditForm from './ArticleEditForm';
import ArticleSidebar from './ArticleSidebar';
import { DeleteDialog, SuccessDialog, ProjectSelectDialog } from './ArticleDialogs';

export default function ArticleDetails() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/agent') ? '/agent' : '/admin';
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiArticle, setApiArticle] = useState<any>(null);
  const [projectId, setProjectId] = useState<string>('');

  const [editData, setEditData] = useState<EditData>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    status: 'draft',
    tags: [],
  });
  const [successDialogStatus, setSuccessDialogStatus] = useState<'published' | 'draft'>('draft');
  const [showProjectSelectDialog, setShowProjectSelectDialog] = useState(false);
  const [userProjects, setUserProjects] = useState<Array<{id: string, name: string}>>([]);
  const [pendingStatus, setPendingStatus] = useState<'published' | 'draft'>('draft');

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setLoading(false);
        return;
      }

      const dynamicArticle = getDynamicArticle(articleId);
      if (dynamicArticle) {
        setApiArticle(dynamicArticle);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/kb/articles/${articleId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const article = data.data;
            if (article.category?.project_id) {
              setProjectId(article.category.project_id);
            }
            setApiArticle({
              id: article.id,
              title: article.title,
              category: article.category?.name || article.category || 'Uncategorized',
              categoryId: article.category_id || article.categoryId || '',
              status: article.is_published ? 'published' : 'draft',
              updatedAt: article.updated_at?.substring(0, 10) || '',
              createdAt: article.created_at?.substring(0, 10) || '',
              author: article.author?.name || article.author || 'AI Assistant',
              views: article.views || article.views_count || 0,
              helpful: article.helpful_count || 0,
              tags: article.tags || [],
              excerpt: article.excerpt || article.summary || '',
              content: article.content || article.body || 'No content available',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch article:', error);
      }

      setLoading(false);
    };

    fetchArticle();
  }, [articleId]);

  const article = apiArticle;
  const routeArticle = (location.state as { article?: typeof article })?.article ?? null;
  const resolvedArticle = article || routeArticle;

  // Sync editData when article is loaded
  useEffect(() => {
    if (resolvedArticle) {
      setEditData({
        title: resolvedArticle.title || '',
        excerpt: resolvedArticle.excerpt || '',
        content: resolvedArticle.content || '',
        category: resolvedArticle.category || '',
        status: resolvedArticle.status || 'draft',
        tags: resolvedArticle.tags || [],
      });
    }
  }, [resolvedArticle]);

  // Load user projects for project selection
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUserProjects(data.data.map((p: any) => ({ id: p.id, name: p.name })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-blue-600 mb-4 animate-spin" />
        <h2 className="text-xl mb-2">Loading article...</h2>
      </div>
    );
  }

  if (!resolvedArticle) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl mb-2">Article Not Found</h2>
        <p className="text-gray-500 mb-6">The article you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate(`${basePath}/knowledge`)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  const handleSave = async (status?: 'published' | 'draft', selectedProjectId?: string) => {
    if (!articleId || !resolvedArticle) return;

    setIsSaving(true);
    const dialogStatus = status || editData.status;

    if (!projectId && !selectedProjectId) {
      if (userProjects.length === 0) {
        toast.error('No projects available. Please create a project first.');
        setIsSaving(false);
        return;
      }
      setPendingStatus(dialogStatus);
      setShowProjectSelectDialog(true);
      setIsSaving(false);
      return;
    }

    const targetProjectId = projectId || selectedProjectId;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Not authenticated');
        setIsSaving(false);
        return;
      }

      const dynamicArticle = getDynamicArticle(articleId);
      const isExistingApiArticle = !dynamicArticle || apiArticle?.id === articleId;

      const articleData: Record<string, unknown> = {
        title: editData.title,
        content: editData.content,
        is_published: status === 'published',
      };

      if (resolvedArticle.categoryId || editData.category) {
        articleData.category_id = resolvedArticle.categoryId || editData.category;
      }

      let response;

      if (isExistingApiArticle) {
        response = await fetch(`/api/projects/${targetProjectId}/kb/articles/${articleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        });
      } else {
        response = await fetch(`/api/projects/${targetProjectId}/kb/articles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...articleData,
            category_id: resolvedArticle.categoryId || 'default',
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error((errorData as { message?: string }).message || 'Failed to save article');
      }

      const data = await response.json();
      if (data.success) {
        const newStatus = status || resolvedArticle.status;
        setApiArticle((prev: any) => prev ? {
          ...prev,
          title: editData.title,
          content: editData.content,
          excerpt: editData.excerpt,
          status: newStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        } : null);
        setEditData(prev => ({ ...prev, status: newStatus }));
        toast.success(status === 'published' ? 'Article published!' : 'Draft saved!');
      } else if (dynamicArticle) {
        const updatedStatus = status || editData.status;
        const updatedArticle = {
          ...dynamicArticle,
          title: editData.title,
          content: editData.content,
          excerpt: editData.excerpt,
          status: updatedStatus,
          category: editData.category,
          tags: editData.tags,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        saveDynamicArticle(updatedArticle);
        setApiArticle(updatedArticle);
        setEditData(prev => ({ ...prev, status: updatedStatus }));
        toast.success(updatedStatus === 'published' ? 'Article published!' : 'Draft saved!');
      }

      setIsEditing(false);
      setSuccessDialogStatus(dialogStatus);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to save article:', error);
      toast.error('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const dynamicArticle = getDynamicArticle(articleId);

      if (dynamicArticle) {
        deleteDynamicArticle(articleId);
        toast.success('Article deleted');
        navigate(`${basePath}/knowledge`);
        return;
      }

      if (projectId) {
        const response = await fetch(`/api/projects/${projectId}/kb/articles/${articleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to delete article');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Article deleted');
          navigate(`${basePath}/knowledge`);
        }
      } else {
        toast.success('Article deleted');
        navigate(`${basePath}/knowledge`);
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast.error('Failed to delete article');
    }
  };

  const handleNavigateBack = () => {
    const path = location.pathname;
    if (path.startsWith('/agent/')) {
      navigate('/agent/knowledge');
    } else if (path.startsWith('/admin/')) {
      navigate('/admin/knowledge');
    } else {
      navigate(-1);
    }
  };

  const handleEdit = () => {
    if (resolvedArticle) {
      setEditData({
        title: resolvedArticle.title || '',
        excerpt: resolvedArticle.excerpt || '',
        content: resolvedArticle.content || '',
        category: resolvedArticle.category || '',
        status: resolvedArticle.status || 'draft',
        tags: resolvedArticle.tags || [],
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: resolvedArticle.title,
      excerpt: resolvedArticle.excerpt,
      content: resolvedArticle.content,
      category: resolvedArticle.category,
      status: resolvedArticle.status,
      tags: resolvedArticle.tags,
    });
  };

  return (
    <>
      <ArticleHeader
        article={resolvedArticle}
        isEditing={isEditing}
        isSaving={isSaving}
        onNavigateBack={handleNavigateBack}
        onEdit={handleEdit}
        onCancelEdit={handleCancelEdit}
        onSaveDraft={() => handleSave('draft')}
        onPublish={() => handleSave('published')}
        onDelete={() => setShowDeleteDialog(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Article Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {isEditing ? (
                <ArticleEditForm
                  editData={editData}
                  onEditDataChange={setEditData}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    {resolvedArticle.tags?.includes('ai-generated') && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                        <p className="text-sm text-blue-800 italic flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          Article generated from {resolvedArticle.excerpt?.replace('Article generated from ', '') || 'AI'}
                        </p>
                      </div>
                    )}
                    {resolvedArticle.excerpt && !resolvedArticle.tags?.includes('ai-generated') && (
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-r-lg">
                        <p className="text-sm text-blue-900 italic">{resolvedArticle.excerpt}</p>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      {renderContent(resolvedArticle.content)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Right Column */}
            <ArticleSidebar
              article={resolvedArticle}
              isEditing={isEditing}
              editTags={editData.tags}
              onUpdateTags={(tags) => setEditData(prev => ({ ...prev, tags }))}
            />
          </div>
        </div>
      </main>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        articleTitle={resolvedArticle.title}
        isSaving={isSaving}
        onDelete={handleDelete}
      />

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        status={successDialogStatus}
        editTitle={editData.title}
      />

      <ProjectSelectDialog
        open={showProjectSelectDialog}
        onOpenChange={setShowProjectSelectDialog}
        projects={userProjects}
        onSelectProject={(id) => {
          setShowProjectSelectDialog(false);
          handleSave(pendingStatus, id);
        }}
      />
    </>
  );
}
