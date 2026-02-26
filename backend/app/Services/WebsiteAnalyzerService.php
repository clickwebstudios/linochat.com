<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class WebsiteAnalyzerService
{
    /**
     * Analyze website and return structured data for KB
     */
    public function analyze(string $url): array
    {
        try {
            // Fetch website content and metadata
            $fetched = $this->fetchWebsiteContent($url);
            $content = $fetched['text'];
            $metaDescription = $fetched['meta_description'] ?? null;

            if (empty($content)) {
                return [
                    'success' => false,
                    'error' => 'Could not fetch website content',
                ];
            }

            // Analyze with OpenAI (pass content excerpt for fallback when no meta)
            $contentExcerpt = strlen($content) > 300 ? substr($content, 0, 500) : $content;
            $analysis = $this->analyzeWithAI($content, $url, $metaDescription, $contentExcerpt);
            
            return [
                'success' => true,
                'data' => $analysis,
            ];
        } catch (\Exception $e) {
            Log::error('Website analysis failed', ['url' => $url, 'error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Fetch website content and metadata
     *
     * @return array{text: string, meta_description: ?string}
     */
    protected function fetchWebsiteContent(string $url): array
    {
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
            return ['text' => '', 'meta_description' => null];
        }

        $html = $response->body();

        return [
            'text' => $this->extractTextFromHtml($html),
            'meta_description' => $this->extractMetaDescription($html),
        ];
    }

    /**
     * Extract meta description from HTML (og:description or meta name="description")
     */
    protected function extractMetaDescription(string $html): ?string
    {
        if (preg_match('/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:description["\']/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        if (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }
        if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        return null;
    }

    /**
     * Extract text from HTML
     */
    protected function extractTextFromHtml(string $html): string
    {
        // Remove scripts and styles
        $html = preg_replace('/<script[^>]*>[\s\S]*?<\/script>/i', '', $html);
        $html = preg_replace('/<style[^>]*>[\s\S]*?<\/style>/i', '', $html);
        
        // Remove nav, footer, sidebar
        $html = preg_replace('/<nav[^>]*>[\s\S]*?<\/nav>/i', '', $html);
        $html = preg_replace('/<footer[^>]*>[\s\S]*?<\/footer>/i', '', $html);
        $html = preg_replace('/<aside[^>]*>[\s\S]*?<\/aside>/i', '', $html);
        
        // Extract text
        $text = strip_tags($html);
        
        // Clean up whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Limit length for API
        return substr($text, 0, 8000);
    }

    /**
     * Analyze content with OpenAI
     *
     * @param  string  $content  Extracted text from website
     * @param  string  $url  Website URL
     * @param  string|null  $metaDescription  Meta/og:description from HTML (for fallback)
     * @param  string  $contentExcerpt  Short excerpt for fallback when no meta (for fallback)
     */
    protected function analyzeWithAI(string $content, string $url, ?string $metaDescription = null, string $contentExcerpt = ''): array
    {
        $apiKey = config('openai.api_key');

        if (empty($apiKey) || $apiKey === 'sk-test-key-placeholder') {
            return $this->getFallbackAnalysis($url, $metaDescription, $contentExcerpt);
        }

        $systemPrompt = <<<'PROMPT'
You are a knowledge base analyzer. Extract key information from the website content provided.

IMPORTANT for "description": Write a 2-3 sentence summary of what the company/business does based on the ACTUAL website content. Use specific details from the content—products, services, industry, value proposition. Do NOT use generic phrases like "Company website analyzed from" or "We provide excellent service."

Return a JSON object with this structure:
{
    "company_name": "Company name from content",
    "description": "2-3 sentence summary of what the company does, extracted from the actual website content",
    "categories": [
        {
            "name": "Category Name",
            "articles": [
                {
                    "title": "Article Title",
                    "content": "Detailed content based on website info"
                }
            ]
        }
    ],
    "faq": [
        {
            "question": "Common question",
            "answer": "Answer based on website content"
        }
    ]
}

Create 3-5 categories with 2-4 articles each. Be concise but informative.
PROMPT;

        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => "Analyze this website content from {$url}:\n\n{$content}"],
            ],
            'temperature' => 0.3,
            'max_tokens' => 4000,
        ]);

        $result = $response->choices[0]->message->content;

        if (preg_match('/\{[\s\S]*\}/', $result, $matches)) {
            return json_decode($matches[0], true) ?: [];
        }

        return json_decode($result, true) ?: [];
    }

    /**
     * Get fallback analysis when AI is not available
     */
    protected function getFallbackAnalysis(string $url, ?string $metaDescription = null, string $contentExcerpt = ''): array
    {
        $domain = parse_url($url, PHP_URL_HOST) ?? $url;
        $domain = preg_replace('/^www\./', '', $domain);
        $brandName = explode('.', $domain)[0] ?? 'Company';

        if ($metaDescription && strlen($metaDescription) > 20) {
            $description = $metaDescription;
        } elseif ($contentExcerpt && strlen(trim($contentExcerpt)) > 50) {
            $excerpt = preg_replace('/\s+/', ' ', trim($contentExcerpt));
            $description = strlen($excerpt) > 250 ? substr($excerpt, 0, 247) . '...' : $excerpt;
        } else {
            $description = "Customer support for " . ucfirst($brandName) . ". Manage chats, tickets, and knowledge base.";
        }

        return [
            'company_name' => ucfirst(str_replace(['www.', '.com', '.io', '.ai'], '', $domain)),
            'description' => $description,
            'categories' => [
                [
                    'name' => 'General Information',
                    'articles' => [
                        [
                            'title' => 'About Our Company',
                            'content' => "Welcome to our company. We're here to help you with any questions. Please contact us for more information."
                        ],
                        [
                            'title' => 'Contact Support',
                            'content' => 'Our support team is available to assist you. Reach out via chat or email for help.'
                        ]
                    ]
                ],
                [
                    'name' => 'Products & Services',
                    'articles' => [
                        [
                            'title' => 'Our Offerings',
                            'content' => 'We provide various products and services tailored to your needs. Browse our website to learn more.'
                        ]
                    ]
                ]
            ],
            'faq' => [
                [
                    'question' => 'How can I contact support?',
                    'answer' => 'You can reach our support team through this chat widget or by email.'
                ],
                [
                    'question' => 'What are your business hours?',
                    'answer' => 'Our team is available during regular business hours. Check our website for specific times.'
                ]
            ]
        ];
    }
}
