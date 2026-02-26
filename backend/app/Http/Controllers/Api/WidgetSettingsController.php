<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WidgetSettingsController extends Controller
{
    /**
     * Get widget settings
     */
    public function show(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $settings = $project->widget_settings ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'widget_id' => $project->widget_id,
                'color' => $settings['color'] ?? $project->color ?? '#4F46E5',
                'position' => $settings['position'] ?? 'bottom-right',
                'welcome_message' => $settings['welcome_message'] ?? "Hi there! How can we help you today?",
                'button_text' => $settings['button_text'] ?? '💬',
                'widget_title' => $settings['widget_title'] ?? $project->name,
                'show_agent_name' => $settings['show_agent_name'] ?? true,
                'show_agent_avatar' => $settings['show_agent_avatar'] ?? true,
                'auto_open' => $settings['auto_open'] ?? false,
                'auto_open_delay' => $settings['auto_open_delay'] ?? 5,
                'settings_updated_at' => $project->settings_updated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update widget settings
     */
    public function update(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'position' => 'nullable|string|in:bottom-right,bottom-left,top-right,top-left',
            'welcome_message' => 'nullable|string|max:500',
            'button_text' => 'nullable|string|max:10',
            'widget_title' => 'nullable|string|max:100',
            'show_agent_name' => 'nullable|boolean',
            'show_agent_avatar' => 'nullable|boolean',
            'auto_open' => 'nullable|boolean',
            'auto_open_delay' => 'nullable|integer|min:1|max:60',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Get current settings
        $settings = $project->widget_settings ?? [];

        // Update only provided fields
        $updatableFields = [
            'color', 'position', 'welcome_message', 'button_text',
            'widget_title', 'show_agent_name', 'show_agent_avatar',
            'auto_open', 'auto_open_delay'
        ];

        foreach ($updatableFields as $field) {
            if ($request->has($field)) {
                $settings[$field] = $request->input($field);
            }
        }

        // Save settings and update timestamp
        $project->update([
            'widget_settings' => $settings,
            'settings_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Widget settings updated successfully',
            'data' => [
                'settings_updated_at' => $project->fresh()->settings_updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Reset widget settings to defaults
     */
    public function reset(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $project->update([
            'widget_settings' => null,
            'settings_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Widget settings reset to defaults',
        ]);
    }

    /**
     * Get embed code
     */
    public function embedCode(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        $hasAccess = $project->user_id === $user->id ||
                     $user->projects()->where('projects.id', $project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $apiUrl = env('APP_URL', 'http://localhost:8000');
        $widgetId = $project->widget_id;

        $embedCode = <<<HTML
<!-- LinoChat Widget -->
<script>
(function() {
    var w = window;
    var d = document;
    var l = function() {
        var s = d.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = '{$apiUrl}/widget/loader.js?id={$widgetId}';
        s.charset = 'UTF-8';
        s.setAttribute('data-widget-id', '{$widgetId}');
        var x = d.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
    };
    if (w.attachEvent) {
        w.attachEvent('onload', l);
    } else {
        w.addEventListener('load', l, false);
    }
})();
</script>
<!-- End LinoChat Widget -->
HTML;

        return response()->json([
            'success' => true,
            'data' => [
                'widget_id' => $widgetId,
                'embed_code' => $embedCode,
                'install_instructions' => 'Paste this code before the closing </body> tag on your website',
            ],
        ]);
    }
}
