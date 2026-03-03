<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Project;
use App\Models\Chat;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Icon references for activity feed (used in agent details response)
// CheckCircle, MessageCircle, AlertCircle, FileText

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
            $totalAgents = $company->ownedProjects->sum('agents_count');
            
            // Use company_name if available, fallback to user's full name
            $companyName = $company->company_name ?: $company->name;
            
            return [
                'id' => $company->id,
                'name' => $companyName,
                'email' => $company->email,
                'plan' => $this->getCompanyPlan($company),
                'projects_count' => $company->owned_projects_count,
                'agents_count' => $totalAgents,
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
                'id' => $company->id,
                'name' => $companyName,
                'email' => $company->email,
                'phone' => $company->phone,
                'location' => $company->location,
                'plan' => $this->getCompanyPlan($company),
                'status' => $company->status,
                'created_at' => $company->created_at,
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
            ->with(['project:id,name', 'agent:id,first_name,last_name'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $chats
        ]);
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
        
        $chats = Chat::with(['project:id,name', 'agent:id,first_name,last_name', 'customer:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        $data = $chats->map(function($chat) {
            return [
                'id' => $chat->id,
                'chat_id' => '#CH-' . $chat->id,
                'status' => $chat->status,
                'company' => $chat->project?->name ?? 'Unknown',
                'agent' => $chat->agent ? $chat->agent->first_name . ' ' . $chat->agent->last_name : null,
                'customer_name' => $chat->customer?->name ?? 'Anonymous',
                'created_at' => $chat->created_at,
                'updated_at' => $chat->updated_at,
                'messages_count' => $chat->messages_count ?? 0,
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
        
        $projects = Project::withCount(['agents', 'chats', 'tickets'])
            ->with('owner:id,company_name,name,email')
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
                'owner' => $project->owner?->company_name ?? $project->owner?->name ?? 'Unknown',
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
        
        $data = $agents->map(function($agent) {
            return [
                'id' => $agent->id,
                'name' => $agent->first_name . ' ' . $agent->last_name,
                'email' => $agent->email,
                'status' => $agent->status,
                'project' => $agent->projects->first()?->name ?? 'Unassigned',
                'active_tickets' => 0, // TODO: calculate
                'resolved_today' => 0, // TODO: calculate
                'avg_response_time' => '1h 30m', // TODO: calculate
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
            $firstProject = Project::with('owner:id,company_name,name,email')->find($allProjects->first()->id);
            if ($firstProject && $firstProject->owner) {
                $company = [
                    'id' => $firstProject->owner->id,
                    'name' => $firstProject->owner->company_name ?: $firstProject->owner->name,
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
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'color' => $project->color ?? '#3b82f6',
                        'website' => $project->website,
                        'status' => $project->status === 'active' ? 'Active' : 'Inactive',
                        'active_tickets' => 0, // TODO: calculate
                    ];
                })->values(),
                'stats' => [
                    'total_tickets' => $agent->total_tickets ?? 0,
                    'tickets_resolved' => $ticketsResolved,
                    'active_tickets' => $activeTickets,
                    'total_chats' => $agent->total_chats ?? 0,
                    'avg_response_time' => '2.5 min',
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
     * Get project details
     */
    public function projectDetails($projectId)
    {
        $project = Project::with(['owner', 'agents', 'chats', 'tickets'])
            ->withCount(['chats', 'tickets', 'agents'])
            ->findOrFail($projectId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $project->id,
                'name' => $project->name,
                'website' => $project->website,
                'owner' => $project->owner ? [
                    'id' => $project->owner->id,
                    'name' => $project->owner->name,
                    'email' => $project->owner->email,
                ] : null,
                'chats_count' => $project->chats_count,
                'tickets_count' => $project->tickets_count,
                'agents_count' => $project->agents_count,
                'created_at' => $project->created_at,
                'widget_id' => $project->widget_id,
                'settings' => $project->widget_settings,
            ]
        ]);
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
}
