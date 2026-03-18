import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
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
  Building2,
} from 'lucide-react';
import { api } from '../../api/client';

interface ArticleFormData {
  title: string;
  category: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
  author: string;
  excerpt: string;
}

const categories = [
  'Onboarding',
  'Account',
  'Billing',
  'Developer',
  'Support',
  'Getting Started',
  'Integrations',
  'Security',
  'Troubleshooting',
  'Best Practices',
];

interface Company {
  id: string;
  name: string;
}

export default function SuperadminCreateArticle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId } = (location.state as { companyId?: string; companyName?: string }) || {};
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  useEffect(() => {
    if (companyId) {
      setIsLoadingCompanies(true);
      api.get<Company[]>('/api/superadmin/companies')
        .then(response => {
          setCompanies(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch companies:', error);
        })
        .finally(() => {
          setIsLoadingCompanies(false);
        });
    }
  }, [companyId]);

  const company = companyId ? companies.find(c => c.id === companyId) : null;

  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    category: '',
    content: '',
    tags: [],
    status: 'draft',
    author: 'Super Admin',
    excerpt: '',
  });

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

  const handleSave = (status: 'draft' | 'published') => {
    setIsSaving(true);
    setFormData(prev => ({ ...prev, status }));

    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessDialog(true);
    }, 1500);
  };

  const isFormValid = () => {
    return formData.title.trim() !== '' &&
           formData.category !== '' &&
           formData.content.trim() !== '';
  };

  const handleBack = () => {
    if (companyId) {
      navigate('/superadmin/companies', {
        state: { viewingCompanyId: companyId, companyDetailTab: 'kb' },
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      {/* Header */}
      {isLoadingCompanies ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (companyId) {
                navigate('/superadmin/companies', {
                  state: { viewingCompanyId: companyId, companyDetailTab: 'kb' },
                });
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {company && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{company.name}</span>
            </div>
          )}
          <div>
            <h1 className="font-semibold">Create Knowledge Base Article</h1>
            <p className="text-sm text-muted-foreground">Write and publish helpful content for your customers</p>
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
            className="bg-primary hover:bg-primary/90"
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
      <main className="flex-1 overflow-y-auto p-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <FileText className="h-5 w-5 text-primary" />
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
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                      rows={20}
                      className="font-mono text-sm min-h-[400px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports Markdown formatting. Use # for headings, ** for bold, * for italic, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TagIcon className="h-5 w-5 text-primary" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => {
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
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {formData.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
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
                  {company && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Company</p>
                        <p className="font-medium">{company.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Author</p>
                      <p className="font-medium">{formData.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                        {formData.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="border-primary/20 bg-primary/10">
                <CardHeader>
                  <CardTitle className="text-sm">Writing Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-primary">
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
              <FileText className="h-5 w-5 text-primary" />
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
          <div className="flex-1 overflow-y-auto prose prose-sm max-w-none p-6 bg-muted/50 rounded-lg">
            {formData.excerpt && (
              <div className="bg-primary/10 border-l-4 border-primary p-4 mb-6">
                <p className="text-sm text-primary italic">{formData.excerpt}</p>
              </div>
            )}
            <div className="whitespace-pre-wrap">{formData.content}</div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              By {formData.author} {new Date().toLocaleDateString()}
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
          <div className="p-6 bg-muted/50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{formData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tags:</span>
                <span className="font-medium">{formData.tags.length || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
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
                  content: '',
                  tags: [],
                  status: 'draft',
                  author: 'Super Admin',
                  excerpt: '',
                });
              }}
            >
              Create Another
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => {
                setShowSuccessDialog(false);
                handleBack();
              }}
            >
              Back to Company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </>
  );
}