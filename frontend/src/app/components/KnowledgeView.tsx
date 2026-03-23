import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Search,
  FileText,
  CheckCircle,
  Eye,
  FolderOpen,
  ChevronRight,
  LayoutGrid,
  Plus,
} from 'lucide-react';
// Mock data removed — articles from API

interface KnowledgeAgentViewProps {
  kbSearchQuery: string;
  setKbSearchQuery: (query: string) => void;
}

export function KnowledgeAgentView({ kbSearchQuery, setKbSearchQuery }: KnowledgeAgentViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/agent';

  const allArticles: { id: number; title: string; category: string; views: number; helpful: number }[] = [];

  const filteredArticles = allArticles.filter((article) => {
    const matchesSearch = kbSearchQuery
      ? article.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(kbSearchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? article.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // Build category counts from search-filtered (but not category-filtered) articles
  const searchFilteredArticles = allArticles.filter((article) =>
    kbSearchQuery
      ? article.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(kbSearchQuery.toLowerCase())
      : true
  );

  const categories = Array.from(new Set(allArticles.map((a) => a.category)));
  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = searchFilteredArticles.filter((a) => a.category === cat).length;
    return acc;
  }, {});

  const categoryColors: Record<string, { bg: string; text: string; icon: string; border: string; activeBg: string }> = {
    Guides: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary', border: 'border-primary/20', activeBg: 'bg-primary/10' },
    Account: { bg: 'bg-secondary/10', text: 'text-secondary', icon: 'text-secondary', border: 'border-secondary/20', activeBg: 'bg-secondary/10' },
    Billing: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-100', activeBg: 'bg-amber-100' },
    Support: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500', border: 'border-red-100', activeBg: 'bg-red-100' },
    Developers: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-100', activeBg: 'bg-emerald-100' },
  };

  const defaultColor = { bg: 'bg-muted/50', text: 'text-foreground', icon: 'text-muted-foreground', border: 'border-border', activeBg: 'bg-muted' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search articles, guides, FAQs..." 
            className="pl-12 h-14 text-lg"
            value={kbSearchQuery}
            onChange={(e) => setKbSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          className="h-14 px-6 bg-primary hover:bg-primary/90"
          onClick={() => navigate(`${basePath}/create-article`)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Article
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">8</p>
              <p className="text-sm text-primary">Total Articles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">6</p>
              <p className="text-sm text-green-600">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{(allArticles.reduce((sum, a) => sum + a.views, 0)).toLocaleString()}</p>
              <p className="text-sm text-orange-600">Total Views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <Card className="w-56 flex-shrink-0 self-start">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="flex flex-col">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                  selectedCategory === null
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">All Categories</span>
                <span className="text-xs text-muted-foreground">{searchFilteredArticles.length}</span>
              </button>
              {categories.map((category) => {
                const colors = categoryColors[category] || defaultColor;
                const isActive = selectedCategory === category;
                const count = categoryCounts[category] || 0;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      isActive
                        ? `${colors.activeBg} ${colors.text} font-medium`
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <FolderOpen className={`h-4 w-4 flex-shrink-0 ${isActive ? colors.icon : 'text-muted-foreground'}`} />
                    <span className="flex-1">{category}</span>
                    <span className={`text-xs ${isActive ? colors.text : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {selectedCategory || 'All Articles'}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredArticles.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No articles found.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredArticles.map((article) => {
                    const colors = categoryColors[article.category] || defaultColor;
                    return (
                      <li
                        key={article.id}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors group"
                        onClick={() => navigate(`${basePath}/knowledge/article/${article.id}`)}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{article.title}</p>
                        </div>
                        {!selectedCategory && (
                          <Badge variant="outline" className={`${colors.text} ${colors.border} text-xs flex-shrink-0`}>
                            {article.category}
                          </Badge>
                        )}
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs flex-shrink-0">Published</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}