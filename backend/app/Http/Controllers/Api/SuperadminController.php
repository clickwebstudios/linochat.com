<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Jobs\GenerateKbFromWebsiteJob;
use App\Models\User;
use App\Models\Project;
use App\Models\Chat;
use App\Models\Ticket;
use App\Models\Invitation;
use App\Mail\AgentInvitationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

// Icon references for activity feed: CheckCircle, MessageCircle, AlertCircle, FileText

class SuperadminController extends Controller
{
    public function __construct()
    {
        // Check if user is superadmin for all methods
        $this->middleware(function ($request, $next) {
            $user = auth('api')->user();
            if (!$user || $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Superadmin access required.'
                ], 403);
            }
            return $next($request);
        });
    }

    /**
     * Get all companies (admin users with projects)
     */
    public function companies(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        
        $companies = User::where('role', 'admin')
            ->orWhere(function($query) {
                $query->where('role', '!=', 'superadmin')
                      ->whereHas('ownedProjects');
            })
            ->withCount('ownedProjects')
            ->with(['ownedProjects' => function($query) {
                $query->withCount('agents');
            }])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        $data = $companies->map(function($company) {
            // Count all unique users in the company: agents assigned to any project + the admin
            $agentIds = collect();
            foreach ($company->ownedProjects as $project) {
                $agentIds = $agentIds->merge($project->agents->pluck('id'));
            }
            $totalUsers = $agentIds->unique()->count() + 1; // +1 for the admin themselves

            $companyName = $company->company_name ?: $company->name;

            return [
                'id' => $company->id,
                'name' => $companyName,
                'email' => $company->email,
                'plan' => $this->getCompanyPlan($company),
                'projects_count' => $company->owned_projects_count,
                'users_count' => $totalUsers,
                'created_at' => $company->created_at,
                'status' => $company->status,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $companies->currentPage(),
                'last_page' => $companies->lastPage(),
                'per_page' => $companies->perPage(),
                'total' => $companies->total(),
            ]
        ]);
    }
    
    /**
     * Update company (admin user)
     */
    public function updateCompany(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'company_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'status' => 'sometimes|string|in:Active,Suspended,Inactive,Archived',
        ]);
        $updateData = [];
        if (isset($validated['name'])) {
            $updateData['company_name'] = $validated['name'];
            $parts = explode(' ', $validated['name'], 2);
            $updateData['first_name'] = $parts[0] ?? '';
            $updateData['last_name'] = $parts[1] ?? '';
        }
        foreach (['company_name', 'email', 'phone', 'location', 'status'] as $key) {
            if (array_key_exists($key, $validated)) {
                $updateData[$key] = $validated[$key];
            }
        }
        if (!empty($updateData)) {
            $company->update($updateData);
        }
        return response()->json(['success' => true, 'data' => $company->fresh()]);
    }

    /**
     * Delete company (admin user and cascade)
     */
    public function deleteCompany(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        if ($company->role === 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Cannot delete superadmin'], 403);
        }
        $company->ownedProjects()->each(function ($project) {
            $project->agents()->detach();
            $project->kbCategories()->each(fn ($c) => $c->articles()->delete());
            $project->kbCategories()->delete();
            $project->chats()->each(fn ($c) => $c->messages()->delete());
            $project->chats()->delete();
            $project->tickets()->each(fn ($t) => $t->messages()->delete());
            $project->tickets()->delete();
            Invitation::where('project_id', $project->id)->delete();
            $project->delete();
        });
        $company->delete();
        return response()->json(['success' => true, 'message' => 'Company deleted']);
    }

    /**
     * Get company details with all related data
     */
    public function companyDetails(Request $request, $companyId)
    {
        $company = User::where('id', $companyId)
            ->with(['ownedProjects' => function($query) {
                $query->withCount(['agents', 'chats', 'tickets']);
            }])
            ->first();
        
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }
        
        $projectIds = $company->ownedProjects->pluck('id');
        
        $stats = [
            'total_projects' => $company->ownedProjects->count(),
            'total_agents' => $company->ownedProjects->sum('agents_count'),
            'total_chats' => Chat::whereIn('project_id', $projectIds)->count(),
            'total_tickets' => Ticket::whereIn('project_id', $projectIds)->count(),
        ];
        
        // Use company_name if available, fallback to user's full name
        $companyName = $company->company_name ?: $company->name;
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $company->id,
                'name' => $companyName,
                'email' => $company->email,
                'phone' => $company->phone,
                'location' => $company->location,
                'plan' => $this->getCompanyPlan($company),
                'status' => $company->status ?? 'Active',
                'created_at' => $company->created_at,
                'joined' => $company->created_at?->format('M j, Y') ?? 'N/A',
                'mrr' => '$0',
                'stats' => $stats,
                'projects' => $company->ownedProjects,
            ]
        ]);
    }
    
    /**
     * Get dashboard stats for a specific company or all companies
     */
    public function dashboardStats(Request $request)
    {
        $companyId = $request->input('company_id');
        
        if ($companyId) {
            // Stats for specific company
            $company = User::find($companyId);
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }
            
            $projectIds = $company->ownedProjects()->pluck('id');
            
            $stats = [
                'total_users' => User::whereIn('id', function($query) use ($projectIds) {
                    $query->select('user_id')
                        ->from('project_user')
                        ->whereIn('project_id', $projectIds);
                })->count(),
                'total_projects' => $projectIds->count(),
                'total_chats' => Chat::whereIn('project_id', $projectIds)->count(),
                'total_tickets' => Ticket::whereIn('project_id', $projectIds)->count(),
                'active_chats' => Chat::whereIn('project_id', $projectIds)->where('status', 'active')->count(),
            ];
        } else {
            // Stats for all companies
            $stats = [
                'total_users' => User::count(),
                'total_projects' => Project::count(),
                'total_chats' => Chat::count(),
                'total_tickets' => Ticket::count(),
                'active_chats' => Chat::where('status', 'active')->count(),
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Get all chats for a company
     */
    public function companyChats(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        $projectIds = $company->ownedProjects()->pluck('id');
        $perPage = $request->input('per_page', 20);

        $chats = Chat::whereIn('project_id', $projectIds)
            ->with([
                'project:id,name',
                'agent:id,first_name,last_name',
                'messages' => fn ($q) => $q->orderBy('created_at', 'asc')->limit(50),
            ])
            ->withCount('messages')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $data = $chats->map(function ($chat) {
            $lastMessage = $chat->messages->last();
            return [
                'id' => (string) $chat->id,
                'customer' => $chat->customer_name ?? 'Anonymous',
                'avatar' => strtoupper(substr($chat->customer_name ?? 'A', 0, 2)),
                'preview' => $lastMessage?->content ? substr($lastMessage->content, 0, 80) : 'No messages yet',
                'agent' => $chat->agent ? trim($chat->agent->first_name . ' ' . $chat->agent->last_name) : 'Unassigned',
                'status' => $chat->status ?? 'active',
                'time' => $chat->created_at?->diffForHumans() ?? '',
                'unread' => 0,
                'isAIBot' => (bool) ($chat->ai_enabled ?? false),
                'projectId' => (string) $chat->project_id,
                'project' => ['id' => $chat->project_id, 'name' => $chat->project?->name ?? ''],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $chats->currentPage(),
                'last_page' => $chats->lastPage(),
                'per_page' => $chats->perPage(),
                'total' => $chats->total(),
            ],
        ]);
    }

    /**
     * Get company projects
     */
    public function companyProjects(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        $projects = $company->ownedProjects()
            ->where('status', 'active')
            ->withCount(['agents', 'chats', 'tickets'])
            ->get();
        $projectIds = $projects->pluck('id');
        $activeTicketsByProject = Ticket::whereIn('project_id', $projectIds)
            ->whereIn('status', ['open', 'in_progress', 'waiting'])
            ->selectRaw('project_id, count(*) as cnt')
            ->groupBy('project_id')
            ->pluck('cnt', 'project_id');
        $data = $projects->map(function ($p) use ($activeTicketsByProject) {
            return [
                'id' => (string) $p->id,
                'name' => $p->name,
                'color' => $p->color ?? '#3b82f6',
                'description' => $p->description ?? '',
                'website' => $p->website ?? '',
                'domain' => $p->website ?? '',
                'tickets' => $p->tickets_count ?? 0,
                'totalTickets' => $p->tickets_count ?? 0,
                'activeTickets' => $activeTicketsByProject[$p->id] ?? 0,
                'members' => $p->agents_count ?? 0,
                'companyId' => (string) $p->user_id,
                'status' => $p->status === 'active' ? 'Active' : 'Inactive',
            ];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Get company agents (users in company's projects)
     */
    public function companyAgents(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        $projectIds = $company->ownedProjects()->pluck('id');
        $agentIds = DB::table('project_user')->whereIn('project_id', $projectIds)->pluck('user_id')->unique();
        // Include the admin (company owner) + all assigned agents
        $allUserIds = $agentIds->push($company->id)->unique();
        $agents = User::whereIn('id', $allUserIds)->get();
        $todayStart = now()->startOfDay();
        $data = $agents->map(function ($agent) use ($todayStart) {
            $activeTickets = Ticket::where('assigned_to', $agent->id)
                ->whereIn('status', ['open', 'in_progress', 'waiting'])
                ->count();
            $resolvedToday = Ticket::where('assigned_to', $agent->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->where('updated_at', '>=', $todayStart)
                ->count();
            $status = 'Offline';
            if ($agent->last_active_at && $agent->last_active_at->diffInMinutes(now()) < 5) {
                $status = 'Online';
            } elseif ($agent->last_active_at && $agent->last_active_at->diffInMinutes(now()) < 30) {
                $status = 'Away';
            }
            return [
                'id' => (string) $agent->id,
                'name' => trim($agent->first_name . ' ' . $agent->last_name) ?: $agent->email,
                'email' => $agent->email,
                'status' => $agent->status === 'Active' ? $status : $agent->status,
                'activeTickets' => $activeTickets,
                'resolvedToday' => $resolvedToday,
                'companyId' => (string) $company->id,
            ];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Get company tickets
     */
    public function companyTickets(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        $projectIds = $company->ownedProjects()->pluck('id');
        $tickets = Ticket::whereIn('project_id', $projectIds)
            ->with('assignedAgent:id,first_name,last_name')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();
        $data = $tickets->map(function ($t) {
            return [
                'id' => (string) $t->id,
                'subject' => $t->subject,
                'customer' => $t->customer_name ?: $t->customer_email ?: 'Anonymous',
                'priority' => $t->priority ?? 'medium',
                'status' => $t->status,
                'assignedTo' => $t->assignedAgent
                    ? trim($t->assignedAgent->first_name . ' ' . $t->assignedAgent->last_name)
                    : 'Unassigned',
                'created' => $t->created_at?->diffForHumans() ?? '',
                'projectId' => (string) $t->project_id,
            ];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Invite member to company (uses first project)
     */
    public function companyInvite(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        $firstProject = $company->ownedProjects()->first();
        if (!$firstProject) {
            return response()->json(['success' => false, 'message' => 'Company has no projects. Create a project first.'], 422);
        }
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|in:agent,admin',
        ]);
        $email = $validated['email'];
        $nameParts = explode(' ', $validated['name'], 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $existingUser->projects()->where('projects.id', $firstProject->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'User is already an agent on this project'], 422);
        }
        $existingInvitation = Invitation::where('project_id', $firstProject->id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();
        if ($existingInvitation) {
            return response()->json(['success' => false, 'message' => 'Invitation already sent to this email'], 422);
        }
        $invitation = Invitation::create([
            'project_id' => $firstProject->id,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => $validated['role'] ?? 'agent',
            'token' => Str::random(32),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);
        try {
            Mail::to($email)->send(new AgentInvitationMail($invitation, $firstProject));
        } catch (\Exception $e) {
            \Log::error('Company invite email failed', ['error' => $e->getMessage()]);
        }
        return response()->json([
            'success' => true,
            'message' => 'Invitation sent',
            'data' => [
                'invitation_id' => $invitation->id,
                'email' => $email,
                'name' => trim($firstName . ' ' . $lastName),
                'role' => $validated['role'] ?? 'agent',
            ],
        ]);
    }

    /**
     * Get company pending invitations
     */
    public function companyInvitations(Request $request, $companyId)
    {
        $company = User::find($companyId);
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }
        $projectIds = $company->ownedProjects()->pluck('id');
        $invitations = Invitation::whereIn('project_id', $projectIds)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->get();
        $data = $invitations->map(function ($inv) {
            return [
                'id' => (string) $inv->id,
                'name' => trim(($inv->first_name ?? '') . ' ' . ($inv->last_name ?? '')),
                'email' => $inv->email,
                'role' => $inv->role === 'admin' ? 'Admin' : 'Agent',
            ];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }
    
    /**
     * Get platform-wide statistics
     */
    public function platformStats(Request $request)
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        
        // Calculate revenue (mock calculation based on plans)
        $companies = User::where('role', 'admin')->get();
        $monthlyRevenue = 0;
        foreach ($companies as $company) {
            $plan = $this->getCompanyPlan($company);
            $monthlyRevenue += match($plan) {
                'Enterprise' => 199,
                'Pro' => 79,
                default => 29
            };
        }
        
        // User growth data (last 6 months)
        $userGrowthData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $userGrowthData[] = [
                'month' => $month->format('M'),
                'users' => User::where('created_at', '<=', $month->endOfMonth())->count()
            ];
        }
        
        // Revenue data (last 6 months)
        $revenueData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $revenueData[] = [
                'month' => $month->format('M'),
                'revenue' => $monthlyRevenue * (0.8 + ($i * 0.05)) // Mock growth
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => User::count(),
                'active_agents' => User::where('role', 'agent')->where('status', 'Active')->count(),
                'monthly_revenue' => '$' . number_format($monthlyRevenue),
                'system_uptime' => '99.98%',
                'user_growth_data' => $userGrowthData,
                'revenue_data' => $revenueData,
                'total_tickets' => Ticket::count(),
                'avg_response_time' => '2.4 hrs',
                'csat_score' => '94.5%'
            ]
        ]);
    }
    
    /**
     * Get all chats across all companies
     */
    public function allChats(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        
        $chats = Chat::with([
            'project:id,name',
            'agent:id,first_name,last_name',
            'messages' => fn ($q) => $q->orderBy('created_at', 'asc')->limit(50),
        ])
            ->withCount('messages')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        $data = $chats->map(function($chat) {
            $messages = $chat->messages->map(fn ($m) => [
                'from' => in_array($m->sender_type, ['agent', 'user']) ? 'agent' : 'customer',
                'text' => $m->content ?? '',
                'time' => $m->created_at?->toIso8601String() ?? '',
            ])->values()->all();
            return [
                'id' => (string) $chat->id,
                'chat_id' => '#CH-' . $chat->id,
                'status' => $chat->status ?? 'active',
                'company' => $chat->project?->name ?? 'Unknown',
                'agent' => $chat->agent ? trim($chat->agent->first_name . ' ' . $chat->agent->last_name) : null,
                'customer_name' => $chat->customer_name ?? 'Anonymous',
                'created_at' => $chat->created_at,
                'updated_at' => $chat->updated_at,
                'messages_count' => $chat->messages_count ?? 0,
                'messages' => $messages,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $chats->currentPage(),
                'last_page' => $chats->lastPage(),
                'per_page' => $chats->perPage(),
                'total' => $chats->total(),
            ]
        ]);
    }
    
    /**
     * Get all projects
     */
    public function allProjects(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        
        $projects = Project::where('status', 'active')
            ->withCount(['agents', 'chats', 'tickets'])
            ->with('owner:id,company_name,first_name,last_name,email')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        $data = $projects->map(function($project) {
            return [
                'id' => $project->id,
                'name' => $project->name,
                'domain' => $project->website ?? 'N/A',
                'widget_id' => $project->widget_id,
                'status' => $project->status === 'active' ? 'Active' : 'Inactive',
                'agents' => $project->agents_count,
                'tickets' => $project->tickets_count,
                'owner' => $project->owner?->company_name ?? trim(($project->owner?->first_name ?? '') . ' ' . ($project->owner?->last_name ?? '')) ?: 'Unknown',
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
            ]
        ]);
    }
    
    /**
     * Get all agents
     */
    public function allAgents(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        
        $agents = User::where('role', 'agent')
            ->with(['projects:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        $todayStart = now()->startOfDay();
        $data = $agents->map(function ($agent) use ($todayStart) {
            $activeTickets = Ticket::where('assigned_to', $agent->id)
                ->whereIn('status', ['open', 'in_progress', 'waiting'])
                ->count();
            $resolvedToday = Ticket::where('assigned_to', $agent->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->where('updated_at', '>=', $todayStart)
                ->count();
            return [
                'id' => (string) $agent->id,
                'first_name' => $agent->first_name ?? '',
                'last_name' => $agent->last_name ?? '',
                'name' => trim($agent->first_name . ' ' . $agent->last_name) ?: $agent->email,
                'email' => $agent->email,
                'role' => $agent->role ?? 'agent',
                'status' => $agent->status ?? 'Active',
                'join_date' => $agent->join_date?->format('Y-m-d') ?? $agent->created_at?->format('Y-m-d') ?? '',
                'project' => $agent->projects->first()?->name ?? 'Unassigned',
                'active_tickets' => $activeTickets,
                'resolved_today' => $resolvedToday,
                'avg_response_time' => $this->formatAvgResponseTime($agent->id),
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $agents->currentPage(),
                'last_page' => $agents->lastPage(),
                'per_page' => $agents->perPage(),
                'total' => $agents->total(),
            ]
        ]);
    }

    /**
     * Update agent (e.g. role)
     */
    public function updateAgent(Request $request, $agentId)
    {
        $agent = User::find($agentId);
        if (!$agent || $agent->role === 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Agent not found'], 404);
        }
        $validated = $request->validate(['role' => 'sometimes|string|in:admin,agent,viewer']);
        if (!empty($validated['role'])) {
            $agent->update(['role' => $validated['role']]);
        }
        return response()->json(['success' => true, 'data' => $agent->fresh()]);
    }

    /**
     * Invite user as agent (superadmin can invite to any project)
     */
    public function inviteAgent(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:agent,admin',
            'project_id' => 'required|exists:projects,id',
        ]);
        $project = Project::find($validated['project_id']);
        $email = $validated['email'];
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $existingUser->projects()->where('projects.id', $project->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'User is already an agent on this project'], 422);
        }
        $existingInvitation = Invitation::where('project_id', $project->id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();
        if ($existingInvitation) {
            return response()->json(['success' => false, 'message' => 'Invitation already sent to this email'], 422);
        }
        $invitation = Invitation::create([
            'project_id' => $project->id,
            'email' => $email,
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'role' => $validated['role'] ?? 'agent',
            'token' => Str::random(32),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);
        try {
            Mail::to($email)->send(new AgentInvitationMail($invitation, $project));
        } catch (\Exception $e) {
            \Log::error('Superadmin invite email failed', ['error' => $e->getMessage()]);
        }
        return response()->json([
            'success' => true,
            'message' => 'Invitation sent',
            'data' => ['invitation_id' => $invitation->id, 'email' => $email],
        ]);
    }

    /**
     * Remove/deactivate agent (soft delete or status change)
     */
    public function deleteAgent(Request $request, $agentId)
    {
        $agent = User::find($agentId);
        if (!$agent || $agent->role === 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Agent not found'], 404);
        }
        $agent->update(['status' => 'Deactivated']);
        return response()->json(['success' => true, 'message' => 'Agent deactivated']);
    }

    /**
     * Get single agent details
     */
    public function agentDetails(Request $request, $agentId)
    {
        $agent = User::where('id', $agentId)
            ->where('role', 'agent')
            ->with(['projects:id,name,color,website,status', 'ownedProjects:id,name,color,website,status'])
            ->withCount(['chats as total_chats', 'tickets as total_tickets'])
            ->first();
        
        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent not found'
            ], 404);
        }
        
        // Get all projects this agent belongs to
        $allProjects = $agent->projects->merge($agent->ownedProjects)->unique('id');
        $projectIds = $allProjects->pluck('id');
        
        // Get company info from first project owner
        $company = null;
        if ($allProjects->isNotEmpty()) {
            $firstProject = Project::with('owner:id,company_name,first_name,last_name,email')->find($allProjects->first()->id);
            if ($firstProject && $firstProject->owner) {
                $company = [
                    'id' => $firstProject->owner->id,
                    'name' => $firstProject->owner->company_name ?: trim($firstProject->owner->first_name . ' ' . $firstProject->owner->last_name),
                    'email' => $firstProject->owner->email,
                    'plan' => $this->getCompanyPlan($firstProject->owner),
                ];
            }
        }
        
        // Get tickets assigned to this agent
        $tickets = Ticket::where('assigned_to', $agent->id)
            ->with('project:id,name')
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'ticket_id' => '#T-' . $ticket->id,
                    'subject' => $ticket->subject,
                    'customer' => $ticket->customer_name ?: $ticket->customer_email ?: 'Anonymous',
                    'customer_email' => $ticket->customer_email,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'lastUpdate' => $ticket->updated_at->diffForHumans(),
                    'created_at' => $ticket->created_at,
                ];
            });
        
        // Calculate stats
        $ticketsResolved = Ticket::where('assigned_to', $agent->id)
            ->whereIn('status', ['resolved', 'closed'])
            ->count();
        
        $activeTickets = Ticket::where('assigned_to', $agent->id)
            ->where('status', 'open')
            ->count();
        
        // Mock performance data (can be replaced with real calculations)
        $performanceData = [
            ['month' => 'Jul', 'tickets' => rand(40, 60), 'satisfaction' => rand(90, 98)],
            ['month' => 'Aug', 'tickets' => rand(40, 60), 'satisfaction' => rand(90, 98)],
            ['month' => 'Sep', 'tickets' => rand(40, 60), 'satisfaction' => rand(90, 98)],
            ['month' => 'Oct', 'tickets' => rand(40, 60), 'satisfaction' => rand(90, 98)],
            ['month' => 'Nov', 'tickets' => rand(40, 60), 'satisfaction' => rand(90, 98)],
            ['month' => 'Dec', 'tickets' => rand(40, 60), 'satisfaction' => rand(90, 98)],
        ];
        
        $responseTimeData = [
            ['day' => 'Mon', 'time' => round(rand(15, 35) / 10, 1)],
            ['day' => 'Tue', 'time' => round(rand(15, 35) / 10, 1)],
            ['day' => 'Wed', 'time' => round(rand(15, 35) / 10, 1)],
            ['day' => 'Thu', 'time' => round(rand(15, 35) / 10, 1)],
            ['day' => 'Fri', 'time' => round(rand(15, 35) / 10, 1)],
            ['day' => 'Sat', 'time' => round(rand(20, 40) / 10, 1)],
            ['day' => 'Sun', 'time' => round(rand(20, 40) / 10, 1)],
        ];
        
        // Recent activity (mock for now)
        $recentActivity = [
            ['time' => '2 min ago', 'action' => 'Resolved ticket', 'details' => 'Ticket #' . rand(1000, 9999), 'icon' => 'CheckCircle', 'color' => 'text-green-600'],
            ['time' => '15 min ago', 'action' => 'Started chat', 'details' => 'with Customer', 'icon' => 'MessageCircle', 'color' => 'text-blue-600'],
            ['time' => '1 hour ago', 'action' => 'Updated ticket', 'details' => 'Changed priority', 'icon' => 'AlertCircle', 'color' => 'text-orange-600'],
            ['time' => '2 hours ago', 'action' => 'Closed ticket', 'details' => 'Billing inquiry resolved', 'icon' => 'CheckCircle', 'color' => 'text-green-600'],
            ['time' => '3 hours ago', 'action' => 'Added note', 'details' => 'Escalated to technical team', 'icon' => 'FileText', 'color' => 'text-gray-600'],
        ];
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $agent->id,
                'first_name' => $agent->first_name,
                'last_name' => $agent->last_name,
                'name' => $agent->name,
                'email' => $agent->email,
                'phone' => $agent->phone ?: '+1 (555) 000-0000',
                'location' => $agent->location ?: 'Unknown',
                'role' => $agent->role === 'agent' ? 'Agent' : 'Admin',
                'status' => $agent->status ?: 'Active',
                'avatar_url' => $agent->avatar_url,
                'bio' => $agent->bio ?: 'Support agent.',
                'join_date' => $agent->created_at?->format('Y-m-d') ?? '2024-01-01',
                'last_active_at' => $agent->last_active_at?->toIso8601String(),
                'last_active' => $agent->last_active_at?->diffForHumans() ?? 'Recently',
                'company' => $company,
                'projects' => $allProjects->map(function ($project) {
                    $activeTickets = Ticket::where('project_id', $project->id)
                        ->whereIn('status', ['open', 'in_progress', 'waiting'])
                        ->count();
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'color' => $project->color ?? '#3b82f6',
                        'website' => $project->website,
                        'status' => $project->status === 'active' ? 'Active' : 'Inactive',
                        'active_tickets' => $activeTickets,
                    ];
                })->values(),
                'stats' => [
                    'total_tickets' => $agent->total_tickets ?? 0,
                    'tickets_resolved' => $ticketsResolved,
                    'active_tickets' => $activeTickets,
                    'total_chats' => $agent->total_chats ?? 0,
                    'avg_response_time' => $this->formatAvgResponseTime($agent->id),
                    'rating' => 4.7,
                    'customer_satisfaction' => 94,
                ],
                'tickets' => $tickets,
                'performance_data' => $performanceData,
                'response_time_data' => $responseTimeData,
                'recent_activity' => $recentActivity,
            ]
        ]);
    }

    /**
     * Get project details — returns same format as ProjectController@show()
     */
    public function projectDetails($projectId)
    {
        $project = Project::where('id', $projectId)
            ->with(['agents', 'kbCategories.articles', 'owner'])
            ->withCount(['chats', 'tickets', 'agents'])
            ->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        $activeTickets = $project->tickets()->where('status', 'open')->count();

        // Set active_tickets_count on model BEFORE resource creation
        $project->active_tickets_count = $activeTickets;

        $resource = (new ProjectResource($project))->toArray(request());
        $resource['active_tickets_count'] = $activeTickets;
        $resource['agents'] = $project->agents;
        $resource['kb_categories'] = $project->kbCategories;
        $resource['owner'] = $project->owner ? [
            'id' => $project->owner->id,
            'name' => $project->owner->company_name ?: $project->owner->name,
            'email' => $project->owner->email,
        ] : null;

        return response()->json([
            'success' => true,
            'data' => $resource,
        ]);
    }

    /**
     * Create a project on behalf of a company (admin user)
     */
    public function storeProject(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id'     => 'required|exists:users,id',
            'name'        => 'required|string|max:255',
            'website'     => 'required|url|max:512',
            'color'       => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $owner = User::find($request->input('user_id'));

        if (!$owner) {
            return response()->json([
                'success' => false,
                'message' => 'Company user not found',
            ], 404);
        }

        $project = Project::create([
            'user_id'     => $owner->id,
            'name'        => $request->input('name'),
            'slug'        => Str::slug($request->input('name')) . '-' . Str::random(6),
            'widget_id'   => 'wc_' . Str::random(32),
            'website'     => $request->input('website'),
            'color'       => $request->input('color', '#4F46E5'),
            'description' => $request->input('description'),
            'status'      => 'active',
        ]);

        // Trigger KB generation from website
        if ($project->website) {
            GenerateKbFromWebsiteJob::dispatch($project, $owner->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data'    => $project,
        ], 201);
    }

    /**
     * Helper: Format average response time for agent's tickets
     */
    private function formatAvgResponseTime(int $agentId): string
    {
        $resolved = Ticket::where('assigned_to', $agentId)
            ->whereIn('status', ['resolved', 'closed'])
            ->get();
        if ($resolved->isEmpty()) {
            return '—';
        }
        $totalMinutes = $resolved->sum(function ($t) {
            $resolvedAt = $t->resolved_at ?? $t->updated_at;
            return $t->created_at->diffInMinutes($resolvedAt);
        });
        $avgMinutes = (int) round($totalMinutes / $resolved->count());
        if ($avgMinutes < 60) {
            return $avgMinutes . ' min';
        }
        $hours = (int) floor($avgMinutes / 60);
        $mins = $avgMinutes % 60;
        return $mins > 0 ? "{$hours}h {$mins}m" : "{$hours}h";
    }

    /**
     * Helper: Get company plan
     */
    private function getCompanyPlan(User $company): string
    {
        $projectCount = $company->ownedProjects()->count();
        
        return match(true) {
            $projectCount >= 5 => 'Enterprise',
            $projectCount >= 2 => 'Pro',
            default => 'Starter'
        };
    }

    /**
     * Get live visitors across all projects.
     */
    public function liveVisitors(Request $request)
    {
        $threshold = now()->subMinutes(2);

        $activeChats = Chat::where('customer_last_seen_at', '>=', $threshold)
            ->with('project:id,name,website')
            ->get();

        $visitors = $activeChats->map(function ($chat) {
            $meta = $chat->metadata ?? [];
            $pagesVisited = $meta['pages_visited'] ?? [];
            return [
                'id' => $chat->id,
                'customer_id' => $chat->customer_id,
                'customer_name' => $chat->customer_name,
                'customer_email' => $chat->customer_email,
                'current_page' => $meta['current_page'] ?? null,
                'referrer' => $meta['referrer'] ?? null,
                'referral_source' => $meta['referral_source'] ?? 'Direct',
                'browser' => $meta['browser'] ?? '—',
                'device' => $meta['device'] ?? '—',
                'project_name' => $chat->project->name ?? '—',
                'project_website' => $chat->project->website ?? '',
                'started_at' => $chat->created_at?->toIso8601String(),
                'last_seen_at' => $chat->customer_last_seen_at?->toIso8601String(),
                'pages_count' => count($pagesVisited),
                'pages_visited' => array_slice($pagesVisited, -10),
            ];
        });

        // Aggregate by project
        $byProject = $visitors->groupBy('project_name')->map->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_online' => $visitors->count(),
                'visitors' => $visitors->values(),
                'by_project' => $byProject,
            ],
        ]);
    }

    /**
     * Impersonate a user — returns a token for the target user.
     * Only superadmins can do this.
     */
    public function impersonate(Request $request, string $userId)
    {
        $superadmin = auth('api')->user();
        if (!$superadmin || $superadmin->role !== 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $targetUser = User::find($userId);
        if (!$targetUser) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        // Prevent impersonating other superadmins (escalation vector)
        if ($targetUser->role === 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Cannot impersonate superadmin accounts'], 403);
        }

        // Audit log
        \Illuminate\Support\Facades\Log::info('Superadmin impersonation', [
            'superadmin_id' => $superadmin->id,
            'superadmin_email' => $superadmin->email,
            'target_user_id' => $targetUser->id,
            'target_user_email' => $targetUser->email,
            'target_user_role' => $targetUser->role,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Create a token for the target user
        $token = $targetUser->createToken('impersonation', ['impersonated'], now()->addHours(2));
        $project = $targetUser->ownedProjects()->first() ?? $targetUser->projects()->first();

        return response()->json([
            'success' => true,
            'data' => [
                'access_token' => $token->plainTextToken,
                'user' => [
                    'id' => (string) $targetUser->id,
                    'first_name' => $targetUser->first_name ?? explode(' ', $targetUser->name ?? '')[0],
                    'last_name' => $targetUser->last_name ?? (explode(' ', $targetUser->name ?? '')[1] ?? ''),
                    'email' => $targetUser->email,
                    'role' => $targetUser->role,
                    'status' => $targetUser->status ?? 'Active',
                ],
                'project' => $project ? [
                    'id' => (string) $project->id,
                    'name' => $project->name,
                ] : null,
                'impersonated_by' => (string) $superadmin->id,
            ],
        ]);
    }
}
