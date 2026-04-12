<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSettingsVersion;
use App\Models\KbArticle;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AISettingsController extends Controller
{
    private array $defaultSettings = [
        'ai_enabled'           => true,
        'ai_name'              => 'AI Assistant',
        'system_prompt'        => '',
        'response_tone'        => 'professional',
        'confidence_threshold' => 75,
        'response_language'    => 'auto',
        'fallback_behavior'    => 'transfer',
        'auto_learn'           => true,
        'model'                => 'gpt-4o-mini',
    ];

    private array $validationRules = [
        'ai_enabled'           => 'nullable|boolean',
        'ai_name'              => 'nullable|string|max:50',
        'system_prompt'        => 'nullable|string|max:5000',
        'response_tone'        => 'nullable|string|in:professional,friendly,casual,formal',
        'confidence_threshold' => 'nullable|integer|in:60,75,85,95',
        'response_language'    => 'nullable|string|in:en,es,fr,de,auto',
        'fallback_behavior'    => 'nullable|string|in:transfer,collect,suggest,none',
        'auto_learn'           => 'nullable|boolean',
        'model'                => 'nullable|string|in:gpt-4o,gpt-4o-mini',
    ];

    private function getProject(string $project_id, $user)
    {
        if ($user->role === 'superadmin') {
            return Project::find($project_id);
        }
        return Project::where('id', $project_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
            })
            ->first();
    }

    private function fillDefaults(array $settings): array
    {
        return array_merge($this->defaultSettings, array_intersect_key($settings, $this->defaultSettings));
    }

    /**
     * GET /projects/{project_id}/ai-settings
     * Returns live + draft settings and version info.
     */
    public function show(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $live = $this->fillDefaults($project->ai_settings ?? []);

        $draft = AiSettingsVersion::where('project_id', $project_id)
            ->where('status', 'draft')
            ->first();

        $published = AiSettingsVersion::where('project_id', $project_id)
            ->where('status', 'published')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'live'                    => $live,
                'draft'                   => $draft ? $this->fillDefaults($draft->settings) : null,
                'has_unpublished_changes' => $draft !== null,
                'last_published_at'       => $published?->published_at?->toIso8601String(),
                'current_version'         => $published?->version_number ?? 0,
            ],
        ]);
    }

    /**
     * PUT /projects/{project_id}/ai-settings/draft
     * Auto-save draft.
     */
    public function saveDraft(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $validator = Validator::make($request->all(), $this->validationRules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $settings = [];
        foreach (array_keys($this->defaultSettings) as $field) {
            if ($request->has($field)) {
                $settings[$field] = $request->input($field);
            }
        }

        // Merge with current live settings so draft is always complete
        $live = $project->ai_settings ?? [];
        $fullSettings = array_merge($this->defaultSettings, $live, $settings);

        AiSettingsVersion::updateOrCreate(
            ['project_id' => $project_id, 'status' => 'draft'],
            ['settings' => $fullSettings, 'created_by' => $user->id]
        );

        return response()->json(['success' => true, 'message' => 'Draft saved']);
    }

    /**
     * POST /projects/{project_id}/ai-settings/publish
     * Promote draft to live.
     */
    public function publish(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        return DB::transaction(function () use ($project, $project_id, $user) {
            $draft = AiSettingsVersion::where('project_id', $project_id)
                ->where('status', 'draft')
                ->lockForUpdate()
                ->first();

            if (!$draft) {
                return response()->json(['success' => false, 'message' => 'No draft to publish'], 422);
            }

            // Archive current published version
            AiSettingsVersion::where('project_id', $project_id)
                ->where('status', 'published')
                ->update(['status' => 'archived']);

            // Calculate next version number
            $maxVersion = AiSettingsVersion::where('project_id', $project_id)
                ->max('version_number') ?? 0;

            // Promote draft to published
            $draft->update([
                'status'         => 'published',
                'version_number' => $maxVersion + 1,
                'published_at'   => now(),
                'published_by'   => $user->id,
            ]);

            // Copy to live column
            $project->update(['ai_settings' => $draft->settings]);

            return response()->json([
                'success'      => true,
                'message'      => 'Settings published',
                'version'      => $draft->version_number,
                'published_at' => $draft->published_at->toIso8601String(),
            ]);
        });
    }

    /**
     * GET /projects/{project_id}/ai-settings/versions
     * List version history.
     */
    public function versions(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $versions = AiSettingsVersion::where('project_id', $project_id)
            ->whereIn('status', ['published', 'archived'])
            ->orderBy('version_number', 'desc')
            ->with('publishedBy:id,name')
            ->paginate(20)
            ->through(fn($v) => [
                'id'             => $v->id,
                'version_number' => $v->version_number,
                'status'         => $v->status,
                'published_at'   => $v->published_at?->toIso8601String(),
                'published_by'   => $v->publishedBy?->name ?? 'Unknown',
                'ai_name'        => $v->settings['ai_name'] ?? 'AI Assistant',
                'response_tone'  => $v->settings['response_tone'] ?? 'professional',
            ]);

        return response()->json(['success' => true, 'data' => $versions]);
    }

    /**
     * POST /projects/{project_id}/ai-settings/restore/{version_id}
     * Restore a version as a new draft.
     */
    public function restore(Request $request, string $project_id, string $version_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $version = AiSettingsVersion::where('project_id', $project_id)
            ->where('id', $version_id)
            ->first();

        if (!$version) {
            return response()->json(['success' => false, 'message' => 'Version not found'], 404);
        }

        AiSettingsVersion::updateOrCreate(
            ['project_id' => $project_id, 'status' => 'draft'],
            ['settings' => $version->settings, 'created_by' => $user->id]
        );

        return response()->json([
            'success' => true,
            'message' => "Restored version {$version->version_number} as draft",
            'data'    => $this->fillDefaults($version->settings),
        ]);
    }

    /**
     * GET /projects/{project_id}/ai-stats
     */
    public function stats(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $articlesCount = KbArticle::whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->where('is_published', true)
            ->count();

        $totalArticles = KbArticle::whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->count();

        $totalChats = $project->chats()->count();
        $aiHandledChats = $project->chats()->where('ai_enabled', true)->count();

        $closedChats = $project->chats()->where('status', 'closed')->count();
        $humanTakenChats = $project->chats()->where('status', 'closed')->whereNotNull('assigned_to')->count();
        $aiResolved = $closedChats > 0 ? $closedChats - $humanTakenChats : 0;
        $resolutionRate = $closedChats > 0 ? round(($aiResolved / $closedChats) * 100) : 0;

        $recentArticles = KbArticle::whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'is_published', 'created_at'])
            ->map(fn($a) => [
                'id'           => $a->id,
                'title'        => $a->title,
                'is_published' => (bool) $a->is_published,
                'created_at'   => $a->created_at?->toISOString(),
            ]);

        // Auto-learn metrics
        $autoLearnedArticles = KbArticle::whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->where('is_ai_generated', true)
            ->count();

        // Resolution breakdown (using new resolution_type field)
        $aiResolvedCount = $project->chats()->where('resolution_type', 'ai_resolved')->count();
        $agentResolvedCount = $project->chats()->where('resolution_type', 'agent_resolved')->count();
        $abandonedCount = $project->chats()->where('resolution_type', 'abandoned')->count();

        // Feedback summary
        $positiveFeedback = \App\Models\ChatMessage::whereHas('chat', fn($q) => $q->where('project_id', $project_id))
            ->where('feedback', 'positive')->count();
        $negativeFeedback = \App\Models\ChatMessage::whereHas('chat', fn($q) => $q->where('project_id', $project_id))
            ->where('feedback', 'negative')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'resolution_rate'       => $resolutionRate,
                'articles_indexed'      => $articlesCount,
                'total_articles'        => $totalArticles,
                'total_chats'           => $totalChats,
                'ai_handled_chats'      => $aiHandledChats,
                'recent_articles'       => $recentArticles,
                'auto_learned_articles' => $autoLearnedArticles,
                'ai_resolved'           => $aiResolvedCount,
                'agent_resolved'        => $agentResolvedCount,
                'abandoned'             => $abandonedCount,
                'positive_feedback'     => $positiveFeedback,
                'negative_feedback'     => $negativeFeedback,
            ],
        ]);
    }

    /**
     * Generate a system prompt from a description or website URL.
     */
    public function generatePrompt(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $input = $request->input('input', '');
        if (empty(trim($input))) {
            return response()->json(['success' => false, 'message' => 'Input required'], 422);
        }

        $apiKey = config('openai.api_key');
        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'OpenAI not configured'], 500);
        }

        // If input looks like a URL, fetch the website content
        $context = $input;
        if (preg_match('/^https?:\/\//', $input) || preg_match('/\.\w{2,}$/', $input)) {
            $url = preg_match('/^https?:\/\//', $input) ? $input : 'https://' . $input;
            // Block SSRF: reject internal/private IPs (direct IPs and DNS-resolved)
            $host = parse_url($url, PHP_URL_HOST);
            $resolvedIp = null;
            if ($host) {
                if (filter_var($host, FILTER_VALIDATE_IP)) {
                    // Host is already a bare IP address — check it directly
                    $resolvedIp = $host;
                } else {
                    $dns = gethostbyname($host);
                    if ($dns !== $host) {
                        $resolvedIp = $dns;
                    }
                }
            }
            $isPrivate = $resolvedIp && !filter_var($resolvedIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
            if (!$isPrivate) {
                try {
                    $response = \Illuminate\Support\Facades\Http::timeout(5)->connectTimeout(3)
                        ->withHeaders(['User-Agent' => 'LinoChat-Bot/1.0'])
                        ->get($url);
                    if ($response->successful()) {
                        $html = $response->body();
                        $text = strip_tags(preg_replace(['/<script[^>]*>.*?<\/script>/si', '/<style[^>]*>.*?<\/style>/si'], '', $html));
                        $text = preg_replace('/\s+/', ' ', $text);
                        $context = "Website content from {$url}:\n" . substr(trim($text), 0, 4000);
                    }
                } catch (\Exception $e) {
                    $context = "Business website: {$url}";
                }
            }
        }

        try {
            $client = \OpenAI::factory()
                ->withApiKey($apiKey)
                ->withHttpClient(new \GuzzleHttp\Client(['timeout' => 15, 'connect_timeout' => 5]))
                ->make();
            $response = $client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert at writing AI customer support system prompts. Given a business description or website content, generate a comprehensive system prompt for this specific business. Include: company overview, services offered, tone/personality, topics to handle, escalation rules, and things to avoid. Keep it under 2500 characters. Write in second person ("You are...").',
                    ],
                    [
                        'role' => 'user',
                        'content' => "Company name: {$project->name}\n\n{$context}",
                    ],
                ],
                'max_tokens' => 1000,
                'temperature' => 0.7,
            ]);

            $prompt = $response->choices[0]->message->content ?? '';

            return response()->json([
                'success' => true,
                'data' => ['prompt' => trim($prompt)],
            ]);
        } catch (\Exception $e) {
            \Log::error('Prompt generation failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Prompt generation failed. Please try again.'], 500);
        }
    }
}
