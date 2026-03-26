import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search, BookOpen, FileText, HelpCircle, MessageCircle, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown, Loader2, ChevronRight } from 'lucide-react';
import MarketingHeader from '../../components/MarketingHeader';
import MarketingFooter from '../../components/MarketingFooter';
import SEOHead from '../../components/SEOHead';

const API_BASE = (import.meta.env.VITE_API_URL || '/api');

interface Category { id: number; name: string; slug: string; description: string; articles_count: number; }
interface Article { id: number; title: string; slug: string; excerpt: string; category: string; category_slug: string; views: number; helpful: number; }
interface ArticleDetail { id: number; title: string; slug: string; content: string; category: string; category_slug: string; views: number; helpful_count: number; not_helpful_count: number; created_at: string; updated_at: string; related: { id: number; title: string; slug: string }[]; }

const CATEGORY_ICONS: Record<string, any> = {
  'getting-started': BookOpen,
  'account-billing': FileText,
  'chat-messaging': MessageCircle,
  'tickets-support': HelpCircle,
  'knowledge-base': BookOpen,
  'integrations': FileText,
  'security-privacy': HelpCircle,
};

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const articleSlug = searchParams.get('article');
  const categoryFilter = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, artRes] = await Promise.all([
        fetch(`${API_BASE}/help/categories`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE}/help/articles${categoryFilter ? `?category=${categoryFilter}` : ''}`).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setCategories(catRes.data || []);
      setArticles(artRes.data || []);
    } catch {}
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch article detail
  useEffect(() => {
    if (!articleSlug) { setArticleDetail(null); return; }
    setLoading(true);
    fetch(`${API_BASE}/help/articles/${articleSlug}`)
      .then(r => r.json())
      .then(res => { if (res.success) setArticleDetail(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    setFeedbackGiven(false);
  }, [articleSlug]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults(null); return; }
    const timeout = setTimeout(() => {
      fetch(`${API_BASE}/help/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })
        .then(r => r.json())
        .then(res => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const submitFeedback = async (helpful: boolean) => {
    if (!articleDetail || feedbackGiven) return;
    await fetch(`${API_BASE}/help/articles/${articleDetail.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful }),
    }).catch(() => {});
    setFeedbackGiven(true);
  };

  // Article detail view
  if (articleSlug && articleDetail) {
    return (
      <div className="min-h-screen bg-muted/30">
        <SEOHead title={articleDetail.title} description={articleDetail.content.slice(0, 160)} />
        <MarketingHeader />

        {/* Breadcrumbs */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/help" className="hover:text-primary">Help Center</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/help?category=${articleDetail.category_slug}`} className="hover:text-primary">{articleDetail.category}</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium truncate max-w-[300px]">{articleDetail.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Help Center
          </Link>

          <article className="bg-card rounded-2xl border p-8 md:p-12">
            <Badge variant="secondary" className="mb-4">{articleDetail.category}</Badge>
            <h1 className="text-3xl font-bold mb-6">{articleDetail.title}</h1>

            <div className="prose prose-gray max-w-none text-[15px] leading-relaxed" dangerouslySetInnerHTML={{
              __html: articleDetail.content
                .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
                .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
                .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
                .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4">$2</li>')
                .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm my-4"><code>$2</code></pre>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/\n/g, '<br/>')
            }} />

            {/* Feedback */}
            <div className="mt-10 pt-6 border-t text-center">
              {feedbackGiven ? (
                <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-3">Was this article helpful?</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" size="sm" onClick={() => submitFeedback(true)} className="gap-1.5">
                      <ThumbsUp className="h-4 w-4" /> Yes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => submitFeedback(false)} className="gap-1.5">
                      <ThumbsDown className="h-4 w-4" /> No
                    </Button>
                  </div>
                </>
              )}
            </div>
          </article>

          {/* Related articles */}
          {articleDetail.related?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Related Articles</h3>
              <div className="grid gap-3">
                {articleDetail.related.map(r => (
                  <Link key={r.id} to={`/help?article=${r.slug}`} className="block p-4 bg-card border rounded-xl hover:border-primary/30 transition-colors">
                    <span className="text-sm font-medium hover:text-primary">{r.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <MarketingFooter />
      </div>
    );
  }

  // Main help center view
  const displayArticles = searchResults !== null ? searchResults : articles;

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title="Help Center" description="Find answers to your questions about LinoChat. Browse guides, tutorials, and FAQs." />
      <MarketingHeader />

      {/* Hero Search */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold">How can we help you?</h1>
          <p className="text-xl text-primary-foreground/80 mb-8">Search our knowledge base or browse by category</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for articles..."
              className="h-12 pl-12 bg-white text-foreground placeholder:text-muted-foreground rounded-xl border-0 shadow-lg"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Category filter chips */}
            {!searchResults && (
              <div className="flex flex-wrap gap-2 mb-8">
                <Link to="/help">
                  <Badge variant={!categoryFilter ? 'default' : 'outline'} className="cursor-pointer px-3 py-1.5">All</Badge>
                </Link>
                {categories.map(cat => (
                  <Link key={cat.id} to={`/help?category=${cat.slug}`}>
                    <Badge variant={categoryFilter === cat.slug ? 'default' : 'outline'} className="cursor-pointer px-3 py-1.5">
                      {cat.name} ({cat.articles_count})
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Search results indicator */}
            {searchResults !== null && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSearchResults(null); }}>Clear search</Button>
              </div>
            )}

            {/* Browse by Category (when no search and no filter) */}
            {!searchResults && !categoryFilter && categories.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-5">Browse by Category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.slug] || BookOpen;
                    return (
                      <Link key={cat.id} to={`/help?category=${cat.slug}`}>
                        <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                          <CardContent className="p-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold mb-1">{cat.name}</h3>
                            <p className="text-xs text-muted-foreground">{cat.articles_count} article{cat.articles_count !== 1 ? 's' : ''}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Articles list */}
            <div>
              <h2 className="text-xl font-semibold mb-5">
                {categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name || 'Articles' : searchResults ? 'Search Results' : 'Popular Articles'}
              </h2>
              {displayArticles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{searchResults !== null ? 'No articles found. Try a different search term.' : 'No articles available yet.'}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayArticles.map(article => (
                    <Link key={article.id} to={`/help?article=${article.slug}`}>
                      <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1">{article.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{article.category}</Badge>
                              {article.views > 0 && <span>{article.views} views</span>}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Can't find what you need?</h3>
                  <p className="text-muted-foreground mb-5">Our team is here to help. Reach out and we'll get back to you quickly.</p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/contact">
                      <Button>Contact Support</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      <MarketingFooter />
    </div>
  );
}
