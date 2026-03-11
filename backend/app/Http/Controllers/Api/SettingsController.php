<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\NotificationLog;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function getNotificationSettings(Request $request)
    {
        $user = $request->user();
        $company = Company::find($user->company_id);
        $settings = $company?->notification_settings ?? [];

        return response()->json(['data' => $settings]);
    }

    public function updateNotificationSettings(Request $request)
    {
        $user = $request->user();
        $company = Company::find($user->company_id);

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        $company->update(['notification_settings' => $request->all()]);

        return response()->json(['message' => 'Settings saved', 'data' => $company->notification_settings]);
    }

    public function notificationLog(Request $request)
    {
        $user = $request->user();
        $query = NotificationLog::query();

        if ($user->role !== 'superadmin') {
            $query->where('company_id', $user->company_id);
        }

        $logs = $query->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'title' => $log->title,
                    'body' => $log->body,
                    'recipient' => $log->recipient,
                    'company_name' => $log->company?->name ?? 'Unknown',
                    'company_id' => $log->company_id ?? 0,
                    'status' => $log->status,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json(['data' => $logs]);
    }

    public function activityLog(Request $request)
    {
        $user = $request->user();
        $query = ActivityLog::with(['user', 'project']);

        if ($user->role !== 'superadmin') {
            $query->where('company_id', $user->company_id);
        }

        $logs = $query->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'title' => $log->title,
                    'description' => $log->description,
                    'user_name' => $log->user?->name,
                    'project_name' => $log->project?->name,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json(['data' => $logs]);
    }
}
