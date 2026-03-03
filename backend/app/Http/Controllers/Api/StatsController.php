<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;

class StatsController extends Controller {
    public function index(Request $request) {
        return response()->json([
            'active_chats' => Chat::where('status', 'active')->count(),
            'open_tickets' => Ticket::whereIn('status', ['open', 'pending'])->count(),
            'resolved_today' => Ticket::where('status', 'closed')->whereDate('updated_at', today())->count(),
            'new_tickets' => Ticket::whereDate('created_at', today())->count(),
            'avg_response_time' => '2.5 min',
            'satisfaction' => '94%',
            'total_agents' => User::where('role', 'agent')->count(),
            'total_companies' => \App\Models\Company::count(),
        ]);
    }
}
