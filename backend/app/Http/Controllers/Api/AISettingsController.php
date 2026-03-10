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

        return response()->json([
            'success' => true,
            'data' => [
                'resolution_rate'   => $resolutionRate,
                'articles_indexed'  => $articlesCount,
                'total_articles'    => $totalArticles,
                'total_chats'       => $totalChats,
                'ai_handled_chats'  => $aiHandledChats,
                'recent_articles'   => $recentArticles,
            ],
        ]);
    }
}
