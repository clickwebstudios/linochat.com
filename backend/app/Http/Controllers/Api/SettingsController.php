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

        $allowed = [
            'ticket_created_admin', 'ticket_created_customer', 'ticket_reply',
            'ticket_closed', 'chat_handover', 'new_chat', 'booking_created', 'agent_assigned',
        ];
        $settings = collect($request->only($allowed))->map(fn ($v) => is_array($v) ? array_intersect_key($v, array_flip(['email', 'sms'])) : $v)->all();
        $company->update(['notification_settings' => $settings]);

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

        // Filters
        if ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $perPage = min((int) $request->input('per_page', 50), 200);
        $paginated = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $paginated->map(function ($log) {
            return [
                'id' => $log->id,
                'type' => $log->type,
                'title' => $log->title,
                'description' => $log->description,
                'user_name' => $log->user?->name,
                'project_name' => $log->project?->name,
                'company_name' => $log->company?->name ?? null,
                'created_at' => $log->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }
}
