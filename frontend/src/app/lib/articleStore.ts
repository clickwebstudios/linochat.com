// Simple in-memory store for dynamically generated articles
// so ArticleDetails can find them without relying on route state

export interface DynamicArticle {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  status: 'published' | 'draft';
  updatedAt: string;
  createdAt: string;
  author: string;
  views: number;
  helpful: number;
  tags: string[];
  excerpt: string;
  content: string;
}

const dynamicArticles: Record<string, DynamicArticle> = {};

export function saveDynamicArticle(article: DynamicArticle) {
  dynamicArticles[article.id] = article;
}

export function getDynamicArticle(id: string): DynamicArticle | null {
  return dynamicArticles[id] ?? null;
}

export function getAllDynamicArticles(): DynamicArticle[] {
  return Object.values(dynamicArticles);
}

export function getDynamicArticlesByCategory(categoryId: string): DynamicArticle[] {
  return Object.values(dynamicArticles).filter(article => article.categoryId === categoryId);
}

export function deleteDynamicArticle(id: string): boolean {
  if (id in dynamicArticles) {
    delete dynamicArticles[id];
    return true;
  }
  return false;
}
