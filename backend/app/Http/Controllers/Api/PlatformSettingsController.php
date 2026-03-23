<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformSettingsController extends Controller
{
    public function show(string $key)
    {
        $setting = PlatformSetting::where('key', $key)->first();

        return response()->json([
            'success' => true,
            'data' => $setting ? $setting->value : null,
        ]);
    }

    public function update(Request $request, string $key)
    {
        $user = auth('api')->user();

        if ($user->role !== 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $value = $request->input('value');
        PlatformSetting::setValue($key, $value, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Setting updated',
        ]);
    }

    public function aiUsageStats(Request $request)
    {
        $user = auth('api')->user();
        if ($user->role !== 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 30);
        $since = now()->subDays($days);

        // Totals
        $totals = AiUsageLog::where('created_at', '>=', $since)
            ->selectRaw('
                COUNT(*) as total_calls,
                SUM(input_tokens) as total_input_tokens,
                SUM(output_tokens) as total_output_tokens,
                SUM(base_cost) as total_base_cost,
                SUM(charged_cost) as total_charged_cost
            ')
            ->first();

        // By model
        $byModel = AiUsageLog::where('created_at', '>=', $since)
            ->selectRaw('
                model,
                COUNT(*) as calls,
                SUM(input_tokens) as input_tokens,
                SUM(output_tokens) as output_tokens,
                SUM(base_cost) as base_cost,
                SUM(charged_cost) as charged_cost
            ')
            ->groupBy('model')
            ->get();

        // By project (top 10)
        $byProject = AiUsageLog::where('ai_usage_logs.created_at', '>=', $since)
            ->join('projects', 'projects.id', '=', 'ai_usage_logs.project_id')
            ->selectRaw('
                projects.name as project_name,
                projects.id as project_id,
                COUNT(*) as calls,
                SUM(ai_usage_logs.base_cost) as base_cost,
                SUM(ai_usage_logs.charged_cost) as charged_cost
            ')
            ->groupBy('projects.id', 'projects.name')
            ->orderByRaw('SUM(ai_usage_logs.charged_cost) DESC')
            ->limit(10)
            ->get();

        // Daily trend
        $dailyTrend = AiUsageLog::where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as date, SUM(base_cost) as base_cost, SUM(charged_cost) as charged_cost, COUNT(*) as calls')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'totals' => [
                    'calls' => (int) ($totals->total_calls ?? 0),
                    'input_tokens' => (int) ($totals->total_input_tokens ?? 0),
                    'output_tokens' => (int) ($totals->total_output_tokens ?? 0),
                    'base_cost' => round((float) ($totals->total_base_cost ?? 0), 4),
                    'charged_cost' => round((float) ($totals->total_charged_cost ?? 0), 4),
                    'profit' => round((float) (($totals->total_charged_cost ?? 0) - ($totals->total_base_cost ?? 0)), 4),
                ],
                'by_model' => $byModel,
                'by_project' => $byProject,
                'daily_trend' => $dailyTrend,
            ],
        ]);
    }
}
