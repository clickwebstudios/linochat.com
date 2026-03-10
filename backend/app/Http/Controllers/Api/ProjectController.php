<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Jobs\GenerateKbFromWebsiteJob;
use App\Models\Project;
use App\Services\WebsiteAnalyzerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * List user's projects (owned + assigned)
     */
    public function index(Request $request)
    {
        $user = auth('api')->user();
        
        $type = $request->input('type', 'all');
        $companyId = $request->input('company_id');
        
        // Superadmin: all projects or filtered by company
        if ($user->role === 'superadmin') {
            $query = Project::query();
            if ($companyId) {
                $query->where('user_id', $companyId);
            }
            $projects = $query->withCount(['agents', 'chats', 'tickets'])->paginate(100);
        } elseif ($type === 'owned') {
            $projects = $user->ownedProjects()
                ->withCount(['agents', 'chats', 'tickets'])
                ->paginate(20);
        } elseif ($type === 'assigned') {
            $projects = $user->projects()
                ->withCount(['agents', 'chats', 'tickets'])
                ->paginate(20);
        } else {
            // All projects (owned + assigned)
            $ownedIds = $user->ownedProjects()->pluck('id');
            $assignedIds = $user->projects()->pluck('projects.id');
            $allIds = $ownedIds->merge($assignedIds)->unique();
            
            $projects = Project::whereIn('id', $allIds)
                ->withCount(['agents', 'chats', 'tickets'])
                ->paginate(20);
        }

        return response()->json([
            'success' => true,
            'data' => ProjectResource::collection($projects),
        ]);
    }

    /**
     * Get single project
     */
    public function show(string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)
            ->with(['agents', 'kbCategories.articles'])
            ->withCount(['chats', 'tickets'])
            ->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access (owner, assigned agent, or superadmin)
        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new ProjectResource($project),
        ]);
    }

    /**
     * Create new project
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'website' => 'required|url|max:512',
            'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();

        // Normalize website URL for comparison (lowercase, strip trailing slash)
        $website = rtrim(strtolower($request->input('website')), '/');
        $duplicate = Project::whereRaw('LOWER(TRIM(TRAILING \'/\' FROM website)) = ?', [$website])->first();
        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'A project with this website URL already exists.',
                'errors' => ['website' => ['A project with this website URL already exists.']],
            ], 422);
        }

        $project = Project::create([
            'user_id' => $user->id,
            'name' => $request->input('name'),
            'slug' => Str::slug($request->input('name')) . '-' . Str::random(6),
            'widget_id' => 'wc_' . Str::random(32),
            'website' => $request->input('website'),
            'color' => $request->input('color', '#4F46E5'),
            'description' => $request->input('description'),
            'status' => 'active',
        ]);

        // Автоматически запускаем генерацию KB при создании проекта (если указан website)
        if ($project->website) {
            GenerateKbFromWebsiteJob::dispatch($project, $user->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Project created',
            'data' => $project,
        ], 201);
    }

    /**
     * Update project
     */
    public function update(Request $request, string $project_id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'website' => 'sometimes|url|max:512',
            'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive,archived',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Only owner can update
        if ($project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Check for duplicate website URL (excluding current project)
        if ($request->has('website')) {
            $website = rtrim(strtolower($request->input('website')), '/');
            $duplicate = Project::whereRaw('LOWER(TRIM(TRAILING \'/\' FROM website)) = ?', [$website])
                ->where('id', '!=', $project_id)
                ->first();
            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A project with this website URL already exists.',
                    'errors' => ['website' => ['A project with this website URL already exists.']],
                ], 422);
            }
        }

        $updatable = ['name', 'website', 'color', 'description', 'status'];
        $updates = [];

        foreach ($updatable as $field) {
            if ($request->has($field)) {
                $updates[$field] = $request->input($field);
            }
        }

        // Update slug if name changed
        if (isset($updates['name'])) {
            $updates['slug'] = Str::slug($updates['name']) . '-' . Str::random(6);
        }

        $project->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Project updated',
            'data' => $project->fresh(),
        ]);
    }

    /**
     * Delete project
     */
    public function destroy(string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Only owner or superadmin can delete
        if ($project->user_id !== $user->id && !$user->isSuperadmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted',
        ]);
    }

    /**
     * Get project agents
     */
    public function agents(string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access (owner, assigned agent, or superadmin)
        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $agents = $project->agents()
            ->with(['availabilitySettings', 'notificationPreferences'])
            ->get();

        // Include the project owner if not already in the agents list
        $owner = \App\Models\User::find($project->user_id);
        if ($owner && $agents->where('id', $owner->id)->isEmpty()) {
            $agents->prepend($owner);
        }

        return response()->json([
            'success' => true,
            'data' => $agents,
        ]);
    }

    /**
     * Remove agent from project
     */
    public function removeAgent(Request $request, string $project_id, string $agent_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Only owner can remove agents
        if ($project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $project->agents()->detach($agent_id);

        return response()->json([
            'success' => true,
            'message' => 'Agent removed from project',
        ]);
    }

    /**
     * Analyze website and return project suggestions
     */
    public function analyze(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url|max:512',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $url = $request->input('url');
        
        $analyzer = new WebsiteAnalyzerService();
        $result = $analyzer->analyze($url);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'] ?? 'Failed to analyze website',
            ], 422);
        }

        $data = $result['data'];

        // Generate project details from analysis
        $domain = parse_url($url, PHP_URL_HOST);
        $domain = preg_replace('/^www\./', '', $domain);
        $brandName = explode('.', $domain)[0];
        $capitalizedBrand = ucfirst($brandName);

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $data['company_name'] ?? $capitalizedBrand . ' Support',
                'description' => $data['description'] ?? "Customer support for {$capitalizedBrand}",
                'website' => $url,
                'category' => $data['category'] ?? 'Technology',
                'language' => $data['language'] ?? 'English',
                'pages' => $data['pages_count'] ?? rand(5, 30),
                'color' => $data['brand_color'] ?? '#4F46E5',
            ],
        ]);
    }

    /**
     * Get project tickets
     */
    public function tickets(string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access (owner, assigned agent, or superadmin)
        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $tickets = $project->tickets()
            ->with(['customer', 'assignedAgent'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Get project chats
     */
    public function chats(string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access (owner, assigned agent, or superadmin)
        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $chats = $project->chats()
            ->with(['customer', 'agent'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $chats,
        ]);
    }
    
    /**
     * Get project activities
     */
    public function activities(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access (owner, assigned agent, or superadmin)
        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Get recent activities (chats, tickets, etc.)
        $activities = [];
        
        // Get recent chats
        $recentChats = $project->chats()
            ->with(['agent'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();
            
        foreach ($recentChats as $chat) {
            $activities[] = [
                'id' => 'chat_' . $chat->id,
                'type' => 'chat',
                'description' => $chat->agent_id 
                    ? 'Chat handled by ' . ($chat->agent->name ?? 'Agent')
                    : 'New chat from ' . ($chat->customer_name ?? 'Visitor'),
                'created_at' => $chat->updated_at,
            ];
        }
        
        // Get recent tickets
        $recentTickets = $project->tickets()
            ->with(['assignedAgent'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();
            
        foreach ($recentTickets as $ticket) {
            $activities[] = [
                'id' => 'ticket_' . $ticket->id,
                'type' => 'ticket',
                'description' => 'Ticket #' . $ticket->id . ': ' . $ticket->subject,
                'created_at' => $ticket->updated_at,
            ];
        }
        
        // Sort by date
        usort($activities, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        // Limit to 20
        $activities = array_slice($activities, 0, 20);

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }
}
