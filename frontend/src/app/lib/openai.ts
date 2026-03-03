import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

export const openai = new OpenAI({
  apiKey: apiKey ?? '',
  dangerouslyAllowBrowser: true,
});

/**
 * Fetch a webpage's text content via allorigins CORS proxy.
 * Returns plain text extracted from the HTML.
 */
export async function fetchWebsiteText(url: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json: { contents: string } = await res.json();
  // Strip HTML tags and collapse whitespace
  const text = json.contents
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000); // Keep within token budget
  return text;
}

export interface GeneratedArticle {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
}

/**
 * Use GPT-4o to generate structured KB articles from website text content.
 */
export async function generateArticlesFromContent(
  websiteText: string,
  projectName: string,
): Promise<GeneratedArticle[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a knowledge base specialist. Given website content, extract useful information and generate 3-5 structured help articles. Return JSON with this schema:
{
  "articles": [
    {
      "title": "string",
      "category": "one of: Onboarding, Account, Billing, Developer, Support, Getting Started, Integrations, Security, Troubleshooting, Best Practices",
      "excerpt": "1-2 sentence summary",
      "content": "full article content in plain text, well structured with sections",
      "tags": ["array", "of", "relevant", "tags"]
    }
  ]
}
Focus on FAQs, how-to guides, and key features. Write clearly for end users.`,
      },
      {
        role: 'user',
        content: `Project: ${projectName}\n\nWebsite content:\n${websiteText}`,
      },
    ],
    max_tokens: 4000,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { articles?: GeneratedArticle[] };
  return parsed.articles ?? [];
}

/**
 * Use GPT-4o with KB articles as context to suggest a reply to a customer message.
 */
export async function suggestChatReply(
  customerMessage: string,
  articles: Array<{ title: string; content: string }>,
): Promise<string> {
  const kbContext = articles
    .slice(0, 5)
    .map(a => `## ${a.title}\n${a.content.slice(0, 600)}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a helpful customer support agent. Use the knowledge base below to answer the customer's question. Be concise, friendly, and accurate. If the KB doesn't cover the topic, give a helpful general answer.

KNOWLEDGE BASE:
${kbContext}`,
      },
      {
        role: 'user',
        content: customerMessage,
      },
    ],
    max_tokens: 400,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
