<?php

namespace App\Services;

use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\Project;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use OpenAI\Laravel\Facades\OpenAI;

class KbGeneratorService
{
    /**
     * Website analyzer instance
     */
    protected WebsiteAnalyzerService $websiteAnalyzer;

    /**
     * Constructor
     */
    public function __construct(WebsiteAnalyzerService $websiteAnalyzer)
    {
        $this->websiteAnalyzer = $websiteAnalyzer;
    }

    /**
     * Generate Knowledge Base articles from website
     *
     * @param int $projectId
     * @param string $websiteUrl
     * @param int|null $userId ID пользователя, от имени которого создаются статьи
     * @return array
     */
    public function generateFromWebsite(int $projectId, string $websiteUrl, ?int $userId = null): array
    {
        try {
            Log::info('Starting KB generation from website', [
                'project_id' => $projectId,
                'website_url' => $websiteUrl,
            ]);

            // Проверяем существование проекта
            $project = Project::find($projectId);
            if (!$project) {
                return [
                    'success' => false,
                    'error' => 'Project not found',
                ];
            }

            // Анализируем сайт
            $analysisResult = $this->websiteAnalyzer->analyze($websiteUrl);

            if (!$analysisResult['success']) {
                return [
                    'success' => false,
                    'error' => $analysisResult['error'] ?? 'Failed to analyze website',
                ];
            }

            $analysisData = $analysisResult['data'];

            // Генерируем статьи через AI
            $generatedArticles = $this->generateArticlesWithAI($websiteUrl, $analysisData);

            if (empty($generatedArticles)) {
                return [
                    'success' => false,
                    'error' => 'Failed to generate articles',
                ];
            }

            // Сохраняем статьи в БД
            $savedArticles = $this->saveArticles($projectId, $generatedArticles, $userId, $websiteUrl);

            Log::info('KB generation completed', [
                'project_id' => $projectId,
                'articles_created' => count($savedArticles),
            ]);

            return [
                'success' => true,
                'data' => [
                    'articles_created' => count($savedArticles),
                    'articles' => $savedArticles,
                ],
            ];

        } catch (\Exception $e) {
            Log::error('KB generation failed', [
                'project_id' => $projectId,
                'website_url' => $websiteUrl,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate articles using OpenAI
     *
     * @param string $websiteUrl
     * @param array $analysisData
     * @return array
     */
    protected function generateArticlesWithAI(string $websiteUrl, array $analysisData): array
    {
        $apiKey = config('openai.api_key');

        if (empty($apiKey) || $apiKey === 'sk-test-key-placeholder') {
            Log::warning('OpenAI API key not configured, using fallback articles');
            return $this->getFallbackArticles($analysisData);
        }

        $systemPrompt = <<<'PROMPT'
You are a professional knowledge base creator. Extract key information from the website analysis and create structured KB articles.

Create 5-10 well-structured articles covering:
1. Company overview and mission
2. Products or services (group by type)
3. Pricing information
4. Contact information and support
5. FAQ items

Return a JSON object with this exact structure:
{
    "articles": [
        {
            "title": "Article Title (clear and concise)",
            "content": "Detailed article content with proper formatting. Use markdown-style formatting with headers and bullet points where appropriate. Include all relevant details from the website.",
            "category": "Category Name (e.g., General, Products, Pricing, Support, FAQ)"
        }
    ]
}

Requirements:
- Each article should be comprehensive (200-800 words)
- Use clear, professional language
- Include specific details from the website
- Format content for easy reading
- Create logical categories
PROMPT;

        $userContent = $this->buildAnalysisContent($websiteUrl, $analysisData);

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent],
                ],
                'temperature' => 0.4,
                'max_tokens' => 4000,
            ]);

            $result = $response->choices[0]->message->content;

            // Извлекаем JSON из ответа
            if (preg_match('/\{[\s\S]*\}/', $result, $matches)) {
                $jsonData = json_decode($matches[0], true);
                return $jsonData['articles'] ?? [];
            }

            // Если не удалось распарсить JSON, пробуем декодировать напрямую
            $jsonData = json_decode($result, true);
            if (isset($jsonData['articles'])) {
                return $jsonData['articles'];
            }

            Log::warning('Failed to parse AI response, using fallback', ['response' => $result]);
            return $this->getFallbackArticles($analysisData);

        } catch (\Exception $e) {
            Log::error('OpenAI API error during KB generation', [
                'error' => $e->getMessage(),
            ]);
            return $this->getFallbackArticles($analysisData);
        }
    }

    /**
     * Build content for AI prompt from analysis data
     *
     * @param string $websiteUrl
     * @param array $analysisData
     * @return string
     */
    protected function buildAnalysisContent(string $websiteUrl, array $analysisData): string
    {
        $content = "Website URL: {$websiteUrl}\n\n";
        $content .= "Analysis Data:\n";

        if (isset($analysisData['company_name'])) {
            $content .= "Company Name: {$analysisData['company_name']}\n";
        }

        if (isset($analysisData['description'])) {
            $content .= "Description: {$analysisData['description']}\n";
        }

        if (isset($analysisData['categories']) && is_array($analysisData['categories'])) {
            $content .= "\nExisting Categories:\n";
            foreach ($analysisData['categories'] as $category) {
                $content .= "- {$category['name']}\n";
                if (isset($category['articles'])) {
                    foreach ($category['articles'] as $article) {
                        $content .= "  * {$article['title']}\n";
                    }
                }
            }
        }

        if (isset($analysisData['faq']) && is_array($analysisData['faq'])) {
            $content .= "\nFAQ Items:\n";
            foreach ($analysisData['faq'] as $faq) {
                $content .= "Q: {$faq['question']}\n";
                $content .= "A: {$faq['answer']}\n\n";
            }
        }

        return $content;
    }

    /**
     * Get fallback articles when AI is not available
     *
     * @param array $analysisData
     * @return array
     */
    protected function getFallbackArticles(array $analysisData): array
    {
        $companyName = $analysisData['company_name'] ?? 'Our Company';
        $description = $analysisData['description'] ?? 'Customer support and services';

        return [
            [
                'title' => "About {$companyName}",
                'content' => "## Welcome to {$companyName}\n\n{$description}\n\nWe are committed to providing excellent service and support to all our customers. Our team is dedicated to ensuring you have the best experience possible.\n\n### Our Mission\nTo deliver exceptional value and service to our customers through innovative solutions and dedicated support.\n\n### Contact Us\nFor any inquiries, please reach out to our support team through the chat widget or contact form on our website.",
                'category' => 'General',
            ],
            [
                'title' => 'Our Products and Services',
                'content' => "## What We Offer\n\nAt {$companyName}, we provide a range of products and services designed to meet your needs.\n\n### Key Features\n- Professional customer support\n- Quality products and services\n- Competitive pricing\n- Reliable service delivery\n\n### Getting Started\nBrowse our website to explore our full range of offerings and find the solution that works best for you.",
                'category' => 'Products',
            ],
            [
                'title' => 'Pricing Information',
                'content' => "## Pricing and Plans\n\nWe offer flexible pricing options to suit different needs and budgets.\n\n### Getting a Quote\nFor detailed pricing information, please:\n1. Visit our pricing page on the website\n2. Contact our sales team through chat\n3. Request a custom quote based on your requirements\n\n### Payment Options\nWe accept various payment methods for your convenience. Contact us for more details about payment terms and options.",
                'category' => 'Pricing',
            ],
            [
                'title' => 'Contact and Support',
                'content' => "## How to Reach Us\n\nOur support team is here to help you with any questions or concerns.\n\n### Support Channels\n- **Live Chat**: Available through our website widget\n- **Email**: Contact us via the form on our website\n- **Help Center**: Browse our knowledge base for quick answers\n\n### Business Hours\nOur team is available during regular business hours. For urgent inquiries outside these hours, please leave a message and we'll get back to you as soon as possible.",
                'category' => 'Support',
            ],
            [
                'title' => 'Frequently Asked Questions',
                'content' => "## Common Questions\n\n### How do I get started?\nGetting started is easy! Simply browse our website, explore our services, and reach out if you have any questions.\n\n### What payment methods do you accept?\nWe accept various payment methods. Please contact our sales team for specific details.\n\n### How can I get support?\nYou can reach our support team through this chat widget, email, or by visiting our contact page.\n\n### Do you offer custom solutions?\nYes! We work with clients to develop customized solutions. Contact us to discuss your specific needs.",
                'category' => 'FAQ',
            ],
        ];
    }

    /**
     * Save generated articles to database
     *
     * @param int $projectId
     * @param array $articles
     * @param int|null $userId
     * @param string $sourceUrl
     * @return array
     */
    protected function saveArticles(int $projectId, array $articles, ?int $userId, string $sourceUrl): array
    {
        $savedArticles = [];
        $categories = [];

        foreach ($articles as $articleData) {
            // Создаём или получаем категорию
            $categoryName = $articleData['category'] ?? 'General';
            
            if (!isset($categories[$categoryName])) {
                $category = KbCategory::firstOrCreate(
                    [
                        'project_id' => $projectId,
                        'slug' => Str::slug($categoryName),
                    ],
                    [
                        'name' => $categoryName,
                        'description' => "Articles about {$categoryName}",
                    ]
                );
                $categories[$categoryName] = $category;
            }

            $category = $categories[$categoryName];

            // Создаём статью
            $article = KbArticle::create([
                'category_id' => $category->id,
                'project_id' => $projectId,
                'author_id' => $userId ?? 1, // По умолчанию ID 1 (admin)
                'title' => $articleData['title'],
                'slug' => $this->generateUniqueSlug($articleData['title'], $projectId),
                'content' => $articleData['content'],
                'status' => 'published',
                'is_published' => true,
                'source_url' => $sourceUrl,
                'is_ai_generated' => true,
            ]);

            $savedArticles[] = [
                'id' => $article->id,
                'title' => $article->title,
                'category' => $categoryName,
            ];
        }

        return $savedArticles;
    }

    /**
     * Generate unique slug for article
     *
     * @param string $title
     * @param int $projectId
     * @return string
     */
    protected function generateUniqueSlug(string $title, int $projectId): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        // Проверяем уникальность slug в рамках проекта
        while (KbArticle::whereHas('category', function ($q) use ($projectId) {
                $q->where('project_id', $projectId);
            })->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Get generation status for project
     *
     * @param int $projectId
     * @return array
     */
    public function getGenerationStatus(int $projectId): array
    {
        $aiArticlesCount = KbArticle::where('project_id', $projectId)
            ->where('is_ai_generated', true)
            ->count();

        $totalArticlesCount = KbArticle::where('project_id', $projectId)->count();

        return [
            'has_kb' => $totalArticlesCount > 0,
            'ai_generated_count' => $aiArticlesCount,
            'total_count' => $totalArticlesCount,
        ];
    }

    /**
     * Delete AI-generated articles for project
     *
     * @param int $projectId
     * @return int
     */
    public function deleteAiGeneratedArticles(int $projectId): int
    {
        $deletedCount = KbArticle::where('project_id', $projectId)
            ->where('is_ai_generated', true)
            ->delete();

        // Удаляем пустые категории
        KbCategory::where('project_id', $projectId)
            ->whereDoesntHave('articles')
            ->delete();

        return $deletedCount;
    }

    /**
     * Generate a single KB article from URL or description
     *
     * @param int $projectId
     * @param string $categoryId
     * @param string $sourceType 'url' or 'description'
     * @param string $source The URL or description text
     * @param int|null $userId
     * @return array
     */
    public function generateSingleArticle(int $projectId, string $categoryId, string $sourceType, string $source, ?int $userId = null): array
    {
        try {
            Log::info('Starting single article generation', [
                'project_id' => $projectId,
                'category_id' => $categoryId,
                'source_type' => $sourceType,
            ]);

            // Get category
            $category = KbCategory::where('id', $categoryId)
                ->where('project_id', $projectId)
                ->first();

            if (!$category) {
                return [
                    'success' => false,
                    'error' => 'Category not found',
                ];
            }

            // Get content based on source type
            $contentToAnalyze = '';
            $sourceUrl = null;
            
            if ($sourceType === 'url') {
                // Fetch website content
                $fetched = $this->fetchUrlContent($source);
                if (!$fetched['success']) {
                    return [
                        'success' => false,
                        'error' => $fetched['error'] ?? 'Failed to fetch URL content',
                    ];
                }
                $contentToAnalyze = $fetched['content'];
                $sourceUrl = $source;
            } else {
                // Use description as content
                $contentToAnalyze = $source;
                $sourceUrl = null;
            }

            // Generate article with AI
            $article = $this->generateSingleArticleWithAI($contentToAnalyze, $sourceType, $category->name);

            if (empty($article)) {
                return [
                    'success' => false,
                    'error' => 'Failed to generate article',
                ];
            }

            // Save article to database
            $savedArticle = KbArticle::create([
                'category_id' => $categoryId,
                'project_id' => $projectId,
                'author_id' => $userId ?? 1,
                'title' => $article['title'],
                'slug' => $this->generateUniqueSlug($article['title'], $projectId),
                'content' => $article['content'],
                'status' => 'draft',
                'is_published' => false,
                'source_url' => $sourceUrl,
                'is_ai_generated' => true,
            ]);

            Log::info('Single article generation completed', [
                'project_id' => $projectId,
                'article_id' => $savedArticle->id,
            ]);

            return [
                'success' => true,
                'data' => [
                    'id' => $savedArticle->id,
                    'title' => $savedArticle->title,
                    'content' => $savedArticle->content,
                    'category' => $category->name,
                    'category_id' => $categoryId,
                    'status' => 'draft',
                    'is_published' => false,
                    'created_at' => $savedArticle->created_at?->toISOString(),
                ],
            ];

        } catch (\Exception $e) {
            Log::error('Single article generation failed', [
                'project_id' => $projectId,
                'category_id' => $categoryId,
                'source_type' => $sourceType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Fetch content from a specific URL
     *
     * @param string $url
     * @return array
     */
    protected function fetchUrlContent(string $url): array
    {
        try {
            $options = [
                'timeout' => 30,
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (compatible; LinoChat Bot/1.0)',
                ],
            ];

            if (app()->environment('local')) {
                $options['verify'] = false;
            }

            $response = Http::withOptions($options)->get($url);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'error' => 'Failed to fetch URL: HTTP ' . $response->status(),
                ];
            }

            $html = $response->body();
            $content = $this->extractArticleContentFromHtml($html);

            if (empty($content)) {
                return [
                    'success' => false,
                    'error' => 'Could not extract content from URL',
                ];
            }

            return [
                'success' => true,
                'content' => $content,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to fetch URL content', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Failed to fetch URL: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Extract article content from HTML
     */
    protected function extractArticleContentFromHtml(string $html): string
    {
        // Remove scripts and styles
        $html = preg_replace('/<script[^>]*>[\s\S]*?<\/script>/i', '', $html);
        $html = preg_replace('/<style[^>]*>[\s\S]*?<\/style>/i', '', $html);
        
        // Try to find main content area
        $mainContent = '';
        
        // Look for article or main content tags
        if (preg_match('/<article[^>]*>([\s\S]*?)<\/article>/i', $html, $matches)) {
            $mainContent = $matches[1];
        } elseif (preg_match('/<main[^>]*>([\s\S]*?)<\/main>/i', $html, $matches)) {
            $mainContent = $matches[1];
        } elseif (preg_match('/<div[^>]*class=["\'][^"\']*(?:content|main|article)[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i', $html, $matches)) {
            $mainContent = $matches[1];
        }
        
        // If no main content found, use body
        if (empty($mainContent)) {
            if (preg_match('/<body[^>]*>([\s\S]*?)<\/body>/i', $html, $matches)) {
                $mainContent = $matches[1];
            } else {
                $mainContent = $html;
            }
        }
        
        // Remove nav, footer, sidebar, header from main content
        $mainContent = preg_replace('/<nav[^>]*>[\s\S]*?<\/nav>/i', '', $mainContent);
        $mainContent = preg_replace('/<footer[^>]*>[\s\S]*?<\/footer>/i', '', $mainContent);
        $mainContent = preg_replace('/<aside[^>]*>[\s\S]*?<\/aside>/i', '', $mainContent);
        $mainContent = preg_replace('/<header[^>]*>[\s\S]*?<\/header>/i', '', $mainContent);
        
        // Extract text
        $text = strip_tags($mainContent);
        
        // Clean up whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Limit length for API (keep first 10000 chars)
        return strlen($text) > 10000 ? substr($text, 0, 10000) : $text;
    }

    /**
     * Generate a single article using OpenAI
     *
     * @param string $content
     * @param string $sourceType
     * @param string $categoryName
     * @return array|null
     */
    protected function generateSingleArticleWithAI(string $content, string $sourceType, string $categoryName): ?array
    {
        $apiKey = config('openai.api_key');

        if (empty($apiKey) || $apiKey === 'sk-test-key-placeholder') {
            Log::warning('OpenAI API key not configured, using fallback article');
            return $this->getFallbackSingleArticle($content, $sourceType, $categoryName);
        }

        $systemPrompt = <<<PROMPT
You are a professional knowledge base article writer. Create a comprehensive, well-structured KB article based on the {$sourceType} provided.

The article should be:
- Comprehensive (400-1000 words)
- Well-structured with clear headings
- Written in a professional, helpful tone
- Easy to understand for customers

Return a JSON object with this exact structure:
{
    "title": "Clear, descriptive article title (5-10 words)",
    "content": "Full article content with markdown-style formatting. Use ## for main sections and ### for subsections. Include bullet points and numbered lists where appropriate."
}

Category context: {$categoryName}
PROMPT;

        $userContent = $sourceType === 'url' 
            ? "Create a knowledge base article based on this webpage content:\n\n{$content}"
            : "Create a knowledge base article based on this description:\n\n{$content}";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent],
                ],
                'temperature' => 0.4,
                'max_tokens' => 4000,
            ]);

            $result = $response->choices[0]->message->content;

            // Extract JSON from response
            if (preg_match('/\{[\s\S]*\}/', $result, $matches)) {
                $jsonData = json_decode($matches[0], true);
                if (isset($jsonData['title']) && isset($jsonData['content'])) {
                    return $jsonData;
                }
            }

            // Try direct decode
            $jsonData = json_decode($result, true);
            if (isset($jsonData['title']) && isset($jsonData['content'])) {
                return $jsonData;
            }

            Log::warning('Failed to parse AI response for single article, using fallback', ['response' => $result]);
            return $this->getFallbackSingleArticle($content, $sourceType, $categoryName);

        } catch (\Exception $e) {
            Log::error('OpenAI API error during single article generation', [
                'error' => $e->getMessage(),
            ]);
            return $this->getFallbackSingleArticle($content, $sourceType, $categoryName);
        }
    }

    /**
     * Get fallback single article when AI is not available
     */
    protected function getFallbackSingleArticle(string $content, string $sourceType, string $categoryName): array
    {
        $title = $sourceType === 'url' 
            ? "AI Generated: {$categoryName} — website"
            : "AI Generated: {$categoryName} — description";

        $truncatedContent = strlen($content) > 200 
            ? substr($content, 0, 200) . '...'
            : $content;

        return [
            'title' => $title,
            'content' => $sourceType === 'url' 
                ? "## Overview\n\nThis article was automatically generated from a website URL. The content below is a summary extracted from the source page.\n\n## Extracted Content\n\n{$truncatedContent}\n\n## Key Points\n\n- Content extracted and structured by AI from the provided URL\n- Review and edit this draft to ensure accuracy before publishing\n- Add more details or remove irrelevant information as needed\n\n## Next Steps\n\nPlease review this generated content and make any necessary edits before publishing."
                : "## Overview\n\nThis article was automatically generated based on your description. The content below expands on your input.\n\n## Your Description\n\n{$truncatedContent}\n\n## Key Points\n\n- Article generated based on your description\n- AI has expanded your input into a structured format\n- Review and edit this draft to ensure it meets your needs\n\n## Next Steps\n\nPlease review this generated content and make any necessary edits before publishing.",
        ];
    }
}
