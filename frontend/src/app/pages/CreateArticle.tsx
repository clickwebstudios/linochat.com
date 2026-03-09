import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Tag as TagIcon,
  Calendar,
  User,
  CheckCircle,
  Loader2,
  X,
  Sparkles,
  FolderOpen,
  ChevronDown,
  Bot,
  Globe,
  AlignLeft,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useProjectsStore, selectProjects } from '../stores/projectsStore';
import { toast } from 'sonner';

interface ArticleFormData {
  title: string;
  category: string;
  categoryId: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
  author: string;
  excerpt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function CreateArticle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategoryId = searchParams.get('category') || '';
  const initialProjectId = searchParams.get('project') || '';
  const isProjectLocked = !!initialProjectId;
  
  const projects = useProjectsStore(selectProjects);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  
  // AI Generator state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiSourceType, setAiSourceType] = useState<'url' | 'description'>('url');
  const [aiSource, setAiSource] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    category: '',
    categoryId: initialCategoryId,
    content: '',
    tags: [],
    status: 'draft',
    author: 'Current User',
    excerpt: '',
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Set initial project when projects load (only if not locked)
  useEffect(() => {
    if (!isProjectLocked && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, isProjectLocked]);

  // Fetch categories when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/projects/${selectedProjectId}/kb/categories`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data);
            
            // If we have an initial category ID from URL, find and set it
            if (initialCategoryId) {
              const initialCategory = data.data.find((c: Category) => c.id === initialCategoryId);
              if (initialCategory) {
                setFormData(prev => ({
                  ...prev,
                  category: initialCategory.name,
                  categoryId: initialCategory.id,
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, [selectedProjectId, initialCategoryId]);

  const handleInputChange = (field: keyof ArticleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!isFormValid()) return;
    
    setIsSaving(true);
    setFormData(prev => ({ ...prev, status }));
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Not authenticated');
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/projects/${selectedProjectId}/kb/categories/${formData.categoryId}/articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          is_published: status === 'published',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(status === 'published' ? 'Article published!' : 'Draft saved!');
        setShowSuccessDialog(true);
      } else {
        throw new Error(data.message || 'Failed to save article');
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      toast.error('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return formData.title.trim() !== '' && 
           formData.categoryId !== '' && 
           formData.content.trim() !== '';
  };

  const handleAiGenerate = async () => {
    if (!aiSource.trim()) {
      toast.error('Please enter a URL or description');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category first');
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Not authenticated');
        setIsGenerating(false);
        return;
      }

      const response = await fetch(`/api/projects/${selectedProjectId}/kb/categories/${formData.categoryId}/generate-article`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          source_type: aiSourceType,
          source: aiSource.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate article');
      }

      // Populate form with generated content
      setFormData(prev => ({
        ...prev,
        title: data.data.title,
        content: data.data.content,
        excerpt: `AI Generated from ${aiSourceType === 'url' ? 'website' : 'description'}`,
      }));
      
      toast.success('Article generated successfully!');
      setShowAiGenerator(false);
      setAiSource('');
    } catch (error) {
      console.error('Failed to generate article:', error);
      toast.error('Failed to generate article');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Project Selector - only show when project is not locked */}
          {!isProjectLocked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden md:flex items-center gap-2 h-10">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: projects.find(p => p.id === selectedProjectId)?.color || '#3b82f6' }}
                  >
                    <FolderOpen className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm max-w-[140px] truncate">
                    {projects.find(p => p.id === selectedProjectId)?.name || 'Select Project'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#3b82f6' }}
                    />
                    <span className="flex-1 truncate">{project.name}</span>
                    {project.id === selectedProjectId && (
                      <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <div>
            <h1 className="font-semibold">Create Knowledge Base Article</h1>
            <p className="text-sm text-gray-500">Write and publish helpful content for your customers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title || !formData.content}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={!isFormValid() || isSaving}
          >
            {isSaving && formData.status === 'draft' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleSave('published')}
            disabled={!isFormValid() || isSaving}
          >
            {isSaving && formData.status === 'published' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Article
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Article Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Article Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., How to Reset Your Password"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Short Description</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Brief summary of what this article covers (optional)"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      key={categories.length} // Force re-render when categories change
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        const selectedCategory = categories.find(c => c.id === value);
                        if (selectedCategory) {
                          setFormData(prev => ({
                            ...prev,
                            categoryId: selectedCategory.id,
                            category: selectedCategory.name,
                          }));
                        }
                      }}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select a category'}>
                          {formData.categoryId && categories.find(c => c.id === formData.categoryId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold">Article Content *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="content">Write your article content</Label>
                    <Textarea
                      id="content"
                      placeholder="Start writing your article content here. You can use markdown formatting..."
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={200}
                      className="font-mono text-sm min-h-[1500px]"
                    />
                    <p className="text-xs text-gray-500">
                      Supports Markdown formatting. Use # for headings, ** for bold, * for italic, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* AI Writing Assistant */}
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-900 mb-1">AI Writing Assistant</h4>
                      <p className="text-sm text-purple-700 mb-3">
                        Need help writing? Our AI can help you generate article content, improve your writing, or suggest relevant topics.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-700 hover:bg-purple-100"
                        onClick={() => setShowAiGenerator(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Use AI Generator
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TagIcon className="h-5 w-5 text-blue-600" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {formData.tags.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Add tags to help users find this article
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Article Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Author</p>
                      <p className="font-medium">{formData.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                        {formData.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-sm">Writing Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-blue-900">
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Use clear, concise language</li>
                    <li>Break content into sections with headings</li>
                    <li>Include step-by-step instructions</li>
                    <li>Add relevant tags for discoverability</li>
                    <li>Preview before publishing</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              {formData.title || 'Untitled Article'}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 flex-wrap">
              {formData.category && <Badge variant="outline">{formData.category}</Badge>}
              {formData.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
            {formData.excerpt && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                <p className="text-sm text-blue-900 italic">{formData.excerpt}</p>
              </div>
            )}
            <div className="whitespace-pre-wrap">{formData.content}</div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">
              By {formData.author} • {new Date().toLocaleDateString()}
            </div>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Article {formData.status === 'published' ? 'Published' : 'Saved'}!
            </DialogTitle>
            <DialogDescription>
              Your article "{formData.title}" has been {formData.status === 'published' ? 'published successfully' : 'saved as a draft'}.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Title:</span>
                <span className="font-medium">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{formData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tags:</span>
                <span className="font-medium">{formData.tags.length || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                  {formData.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSuccessDialog(false);
                setFormData({
                  title: '',
                  category: '',
                  categoryId: '',
                  content: '',
                  tags: [],
                  status: 'draft',
                  author: 'Current User',
                  excerpt: '',
                });
              }}
            >
              Create Another
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setShowSuccessDialog(false);
                navigate('/admin/dashboard');
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generator Dialog */}
      <Dialog open={showAiGenerator} onOpenChange={setShowAiGenerator}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Generate Article with AI
            </DialogTitle>
            <DialogDescription>
              Our AI will generate article content from a website URL or your description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source Type Toggle */}
            <div className="flex rounded-lg bg-purple-100/60 p-0.5">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                  aiSourceType === 'url'
                    ? 'bg-white text-purple-700 shadow-sm font-medium'
                    : 'text-purple-600 hover:text-purple-700'
                }`}
                onClick={() => setAiSourceType('url')}
              >
                <Globe className="h-3.5 w-3.5" />
                Website URL
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                  aiSourceType === 'description'
                    ? 'bg-white text-purple-700 shadow-sm font-medium'
                    : 'text-purple-600 hover:text-purple-700'
                }`}
                onClick={() => setAiSourceType('description')}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Description
              </button>
            </div>

            {/* URL Input */}
            {aiSourceType === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="ai-url" className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-purple-600" />
                  Website URL
                </Label>
                <Input
                  id="ai-url"
                  type="url"
                  placeholder="https://example.com/docs/my-page"
                  value={aiSource}
                  onChange={(e) => setAiSource(e.target.value)}
                  className="bg-white"
                />
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI will extract and structure content from this page
                </p>
              </div>
            )}

            {/* Description Input */}
            {aiSourceType === 'description' && (
              <div className="space-y-2">
                <Label htmlFor="ai-description" className="flex items-center gap-2 text-sm font-medium">
                  <AlignLeft className="h-4 w-4 text-purple-600" />
                  Describe Your Article
                </Label>
                <Textarea
                  id="ai-description"
                  placeholder="e.g., A step-by-step guide on how to set up two-factor authentication..."
                  value={aiSource}
                  onChange={(e) => setAiSource(e.target.value)}
                  className="bg-white min-h-[100px] resize-none"
                />
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI will generate a full article based on your description
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAiGenerator(false);
                setAiSource('');
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleAiGenerate}
              disabled={!aiSource.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Article
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}