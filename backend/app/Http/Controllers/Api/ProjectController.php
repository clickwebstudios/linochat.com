<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Jobs\GenerateKbFromWebsiteJob;
use App\Models\Project;
use App\Services\WebsiteAnalyzerService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * List user's projects (owned + assigned)
     */
    public function index(Request $request)
    {
        $user             = auth('api')->user();
        $type             = $request->input('type', 'all');
        $companyProjectIds = $user->resolveProjectIds($request->input('company_id'));

        if ($user->isSuperadmin() && !$companyProjectIds) {
            $projects = Project::where('status', 'active')
                ->withCount(['agents', 'chats', 'tickets'])->paginate(100);
        } elseif ($type === 'owned') {
            $projects = $user->ownedProjects()
                ->where('status', 'active')
                ->withCount(['agents', 'chats', 'tickets'])
                ->paginate(20);
        } elseif ($type === 'assigned') {
            $projects = $user->projects()
                ->when($companyProjectIds, fn ($q) => $q->whereIn('projects.id', $companyProjectIds))
                ->withCount(['agents', 'chats', 'tickets'])
                ->paginate(20);
        } else {
            $projects = Project::whereIn('id', $companyProjectIds ?? [])
                ->where('status', 'active')
                ->withCount(['agents', 'chats', 'tickets'])
                ->paginate(20);
        }

        return response()->json(['success' => true, 'data' => ProjectResource::collection($projects)]);
    }

    /**
     * Get single project
     */
    public function show(string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)
            ->where('status', 'active')
            ->with(['agents', 'kbCategories.articles'])
            ->withCount(['chats', 'tickets'])
            ->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        if (!$user->can('view', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json(['success' => true, 'data' => new ProjectResource($project)]);
    }

    /**
     * Create new project
     */
    public function store(StoreProjectRequest $request)
    {
        $user    = auth('api')->user();
        $company = $user->company;

        if ($company && !$user->isSuperadmin()) {
            $planLimits = ['free' => 1, 'starter' => 3, 'growth' => 5, 'pro' => 10, 'scale' => 20, 'enterprise' => PHP_INT_MAX];
            $plan       = strtolower($company->plan ?? 'free');
            $limit      = $planLimits[$plan] ?? 1;
            $allCompanyUserIds = \App\Models\User::where('company_id', $company->id)->pluck('id');
            $count      = Project::whereIn('user_id', $allCompanyUserIds)->where('status', 'active')->count();
            if ($count >= $limit) {
                return response()->json([
                    'success' => false,
                    'message' => "Project limit reached ({$limit} on " . ucfirst($plan) . " plan). Upgrade to add more.",
                ], 422);
            }
        }

        $website = $request->input('website');

        if ($website && !preg_match('/^https?:\/\//', $website)) {
            $website = 'https://' . $website;
        }
        $website        = rtrim(strtolower($website), '/');
        $companyUserIds = \App\Models\User::where('company_id', $user->company_id)->pluck('id');
        $duplicate      = Project::whereIn('user_id', $companyUserIds)
            ->whereRaw("LOWER(TRIM(TRAILING '/' FROM website)) = ?", [$website])
            ->first();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'A project with this website URL already exists.',
                'errors'  => ['website' => ['A project with this website URL already exists.']],
            ], 422);
        }

        $defaultAiSettings = [
            'ai_enabled'           => true,
            'ai_name'              => 'AI Assistant',
            'response_tone'        => 'professional',
            'fallback_behavior'    => 'transfer',
            'confidence_threshold' => 75,
            'response_language'    => 'auto',
            'auto_learn'           => true,
            'model'                => 'gpt-4o-mini',
        ];

        $aiSettings = $request->input('ai_settings')
            ? array_merge($defaultAiSettings, $request->input('ai_settings'))
            : $defaultAiSettings;

        $project = Project::create([
            'user_id'     => $user->id,
            'name'        => $request->input('name'),
            'slug'        => Str::slug($request->input('name')) . '-' . Str::random(6),
            'widget_id'   => 'wc_' . Str::random(32),
            'website'     => $website,
            'color'       => $request->input('color', '#4F46E5'),
            'description' => $request->input('description'),
            'status'      => 'active',
            'ai_settings' => $aiSettings,
        ]);

        if ($project->website) {
            GenerateKbFromWebsiteJob::dispatch($project, $user->id);
        }

        return response()->json(['success' => true, 'message' => 'Project created', 'data' => $project], 201);
    }

    /**
     * Update project
     */
    public function update(UpdateProjectRequest $request, string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('manage', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($request->has('website')) {
            $website = $request->input('website');
            if ($website && !preg_match('/^https?:\/\//', $website)) {
                $website = 'https://' . $website;
            }
            $website   = rtrim(strtolower($website), '/');
            $duplicate = Project::whereRaw("LOWER(TRIM(TRAILING '/' FROM website)) = ?", [$website])
                ->where('id', '!=', $project_id)
                ->first();
            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A project with this website URL already exists.',
                    'errors'  => ['website' => ['A project with this website URL already exists.']],
                ], 422);
            }
        }

        $updates = [];
        foreach (['name', 'website', 'color', 'description', 'status'] as $field) {
            if ($request->has($field)) {
                $updates[$field] = $request->input($field);
            }
        }

        if (isset($updates['website']) && $updates['website'] && !preg_match('/^https?:\/\//', $updates['website'])) {
            $updates['website'] = 'https://' . $updates['website'];
        }
        if (isset($updates['name'])) {
            $updates['slug'] = Str::slug($updates['name']) . '-' . Str::random(6);
        }

        $project->update($updates);

        return response()->json(['success' => true, 'message' => 'Project updated', 'data' => $project->fresh()]);
    }

    /**
     * Delete project
     */
    public function destroy(string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('manage', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $project->delete();

        return response()->json(['success' => true, 'message' => 'Project deleted']);
    }

    /**
     * Get project agents
     */
    public function agents(string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('view', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $agents = $project->agents()
            ->with(['availabilitySettings', 'notificationPreferences'])
            ->get();

        $owner = \App\Models\User::find($project->user_id);
        if ($owner && $agents->where('id', $owner->id)->isEmpty()) {
            $agents->prepend($owner);
        }

        return response()->json(['success' => true, 'data' => $agents]);
    }

    /**
     * Remove agent from project
     */
    public function removeAgent(Request $request, string $project_id, string $agent_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('manage', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $project->agents()->detach($agent_id);

        return response()->json(['success' => true, 'message' => 'Agent removed from project']);
    }

    /**
     * Analyze website and return project suggestions
     */
    public function analyze(Request $request)
    {
        $validated = $request->validate(['url' => 'required|url|max:512']);
        $url       = $validated['url'];

        $analyzer = new WebsiteAnalyzerService();
        $result   = $analyzer->analyze($url);

        if (!$result['success']) {
            return response()->json(['success' => false, 'message' => $result['error'] ?? 'Failed to analyze website'], 422);
        }

        $data         = $result['data'];
        $domain       = parse_url($url, PHP_URL_HOST);
        $domain       = preg_replace('/^www\./', '', $domain);
        $brandName    = explode('.', $domain)[0];
        $capitalizedBrand = ucfirst($brandName);

        return response()->json([
            'success' => true,
            'data'    => [
                'name'        => $data['company_name'] ?? $capitalizedBrand . ' Support',
                'description' => $data['description'] ?? "Customer support for {$capitalizedBrand}",
                'website'     => $url,
                'category'    => $data['category'] ?? 'Technology',
                'language'    => $data['language'] ?? 'English',
                'pages'       => $data['pages_count'] ?? rand(5, 30),
                'color'       => $data['brand_color'] ?? '#4F46E5',
            ],
        ]);
    }

    /**
     * Get project tickets
     */
    public function tickets(string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('view', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $tickets = $project->tickets()
            ->with(['customer', 'assignedAgent'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $tickets]);
    }

    /**
     * Get project chats
     */
    public function chats(string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('view', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $chats = $project->chats()
            ->with(['customer', 'agent'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $chats]);
    }

    /**
     * Get project activities
     */
    public function activities(Request $request, string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$user->can('view', $project)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $activities = [];

        $recentChats = $project->chats()
            ->with(['agent'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();

        foreach ($recentChats as $chat) {
            $activities[] = [
                'id'          => 'chat_' . $chat->id,
                'type'        => 'chat',
                'description' => $chat->agent_id
                    ? 'Chat handled by ' . ($chat->agent->name ?? 'Agent')
                    : 'New chat from ' . ($chat->customer_name ?? 'Visitor'),
                'created_at'  => $chat->updated_at,
            ];
        }

        $recentTickets = $project->tickets()
            ->with(['assignedAgent'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();

        foreach ($recentTickets as $ticket) {
            $activities[] = [
                'id'          => 'ticket_' . $ticket->id,
                'type'        => 'ticket',
                'description' => 'Ticket #' . $ticket->id . ': ' . $ticket->subject,
                'created_at'  => $ticket->updated_at,
            ];
        }

        usort($activities, fn ($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return response()->json(['success' => true, 'data' => array_slice($activities, 0, 20)]);
    }
}
