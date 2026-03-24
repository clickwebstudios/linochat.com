<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Ticket;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats(Request $request)
    {
        $user = auth('api')->user();
        $allProjectIds = $user->getCompanyProjectIds();

        $stats = [
            'active_chats' => Chat::whereIn('project_id', $allProjectIds)
                ->whereIn('status', ['active', 'waiting', 'ai_handling'])
                ->count(),
            'open_tickets' => Ticket::whereIn('project_id', $allProjectIds)
                ->where('status', 'open')
                ->count(),
            'avg_response_time' => '2.5 min',
            'satisfaction_score' => '94%',
            'total_customers' => 10000,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get ticket volume for chart
     */
    public function ticketVolume(Request $request)
    {
        $user = auth('api')->user();
        $allProjectIds = $user->getCompanyProjectIds();

        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $startDate = now()->subDays(6)->startOfDay();

        $counts = Ticket::whereIn('project_id', $allProjectIds)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupByRaw('DATE(created_at)')
            ->pluck('count', 'date');

        $volume = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $volume[] = [
                'day' => $days[$date->dayOfWeekIso - 1],
                'count' => $counts[$date->toDateString()] ?? 0,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $volume,
        ]);
    }
}
