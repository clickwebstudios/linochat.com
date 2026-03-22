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

        $defaultWeekly = [];
        foreach (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as $day) {
            $enabled = !in_array($day, ['saturday', 'sunday']);
            $defaultWeekly[$day] = ['enabled' => $enabled, 'slots' => [['start' => '09:00', 'end' => '17:00']]];
        }

        $schedule = $settings['schedule'] ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'widget_id' => $project->widget_id,
                'color' => $settings['color'] ?? $project->color ?? '#4F46E5',
                'design' => $settings['design'] ?? 'modern',
                'position' => $settings['position'] ?? 'bottom-right',
                'welcome_message' => $settings['welcome_message'] ?? "Hi there! How can we help you today?",
                'button_text' => $settings['button_text'] ?? '💬',
                'widget_title' => $settings['widget_title'] ?? $project->name,
                'show_agent_name' => $settings['show_agent_name'] ?? true,
                'show_agent_avatar' => $settings['show_agent_avatar'] ?? true,
                'widget_active' => $settings['widget_active'] ?? true,
                'auto_open' => $settings['auto_open'] ?? false,
                'auto_open_delay' => $settings['auto_open_delay'] ?? 5,
                'greeting_enabled' => $settings['greeting_enabled'] ?? false,
                'greeting_delay' => $settings['greeting_delay'] ?? 3,
                'greeting_message' => $settings['greeting_message'] ?? '👋 Hi there! How can we help you today?',
                'font_size' => $settings['font_size'] ?? 14,
                'animation' => $settings['animation'] ?? 'none',
                'animation_repeat' => $settings['animation_repeat'] ?? 'infinite',
                'animation_delay' => $settings['animation_delay'] ?? '0',
                'animation_duration' => $settings['animation_duration'] ?? 'default',
                'animation_stop_after' => $settings['animation_stop_after'] ?? '0',
                'gradient' => $settings['gradient'] ?? 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)',
                'offline_behavior' => $settings['offline_behavior'] ?? 'hide',
                'offline_message' => $settings['offline_message'] ?? "We're currently offline. Our team is available Mon-Fri, 9am-5pm EST.",
                'schedule' => [
                    'mode' => $schedule['mode'] ?? 'always',
                    'timezone' => $schedule['timezone'] ?? 'America/New_York',
                    'weekly' => $schedule['weekly'] ?? $defaultWeekly,
                    'offline_behavior' => $schedule['offline_behavior'] ?? $settings['offline_behavior'] ?? 'hide',
                    'offline_message' => $schedule['offline_message'] ?? $settings['offline_message'] ?? "We're currently offline. Our team is available Mon-Fri, 9am-5pm EST.",
                    'offline_redirect_url' => $schedule['offline_redirect_url'] ?? '',
                    'offline_redirect_label' => $schedule['offline_redirect_label'] ?? 'Email us',
                    'offline_form_enabled' => $schedule['offline_form_enabled'] ?? false,
                    'exceptions' => $schedule['exceptions'] ?? [],
                ],
                'popover' => $settings['popover'] ?? [
                    'enabled' => false,
                    'design' => 'modern',
                    'heading' => 'How can we help you today?',
                    'description' => 'Our team is ready to assist with your needs.',
                    'badge_text' => 'SUPPORT ONLINE',
                    'primary_button' => ['text' => 'Schedule Service', 'url' => '', 'action' => 'open_chat'],
                    'secondary_button' => ['text' => 'Ask a Question', 'url' => '', 'action' => 'open_chat'],
                    'show_online_status' => true,
                    'online_status_text' => 'Support Online',
                    'trigger' => 'delay',
                    'trigger_delay' => 3,
                    'trigger_scroll_percent' => 50,
                    'show_once_per_session' => true,
                    'show_on_pages' => 'all',
                    'page_urls' => [],
                ],
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
            'design' => 'nullable|string|in:modern,minimal,classic,bubble,compact,professional,friendly,gradient',
            'position' => 'nullable|string|in:bottom-right,bottom-left,top-right,top-left',
            'welcome_message' => 'nullable|string|max:500',
            'button_text' => 'nullable|string|max:10',
            'widget_title' => 'nullable|string|max:100',
            'show_agent_name' => 'nullable|boolean',
            'show_agent_avatar' => 'nullable|boolean',
            'widget_active' => 'nullable|boolean',
            'auto_open' => 'nullable|boolean',
            'auto_open_delay'   => 'nullable|integer|min:1|max:60',
            'greeting_enabled'  => 'nullable|boolean',
            'greeting_delay'    => 'nullable|integer|min:0|max:3600',
            'greeting_message'  => 'nullable|string|max:500',
            'font_size'         => 'nullable|integer|in:12,14,16',
            'animation'         => 'nullable|string|max:50',
            'animation_repeat'  => 'nullable|string|max:20',
            'animation_delay'   => 'nullable|string|max:10',
            'animation_duration' => 'nullable|string|max:10',
            'animation_stop_after' => 'nullable|string|max:10',
            'gradient'          => 'nullable|string|max:200',
            'offline_behavior'  => 'nullable|string|in:hide,show_message,ai_only,contact_form,redirect',
            'offline_message'   => 'nullable|string|max:500',
            'schedule'                              => 'nullable|array',
            'schedule.mode'                         => 'nullable|string|in:always,business_hours,agent_availability',
            'schedule.timezone'                     => 'nullable|string|max:100',
            'schedule.weekly'                       => 'nullable|array',
            'schedule.weekly.*.enabled'             => 'nullable|boolean',
            'schedule.weekly.*.slots'               => 'nullable|array|max:4',
            'schedule.weekly.*.slots.*.start'       => 'nullable|string|date_format:H:i',
            'schedule.weekly.*.slots.*.end'         => 'nullable|string|date_format:H:i',
            'schedule.offline_behavior'             => 'nullable|string|in:hide,show_message,ai_only,contact_form,redirect',
            'schedule.offline_message'              => 'nullable|string|max:500',
            'schedule.offline_redirect_url'         => 'nullable|string|max:500',
            'schedule.offline_redirect_label'       => 'nullable|string|max:100',
            'schedule.offline_form_enabled'         => 'nullable|boolean',
            'schedule.exceptions'                   => 'nullable|array|max:50',
            'schedule.exceptions.*.id'              => 'nullable|string|max:50',
            'schedule.exceptions.*.date'            => 'nullable|date_format:Y-m-d',
            'schedule.exceptions.*.label'           => 'nullable|string|max:100',
            'schedule.exceptions.*.all_day_off'     => 'nullable|boolean',
            'schedule.exceptions.*.offline_behavior_override' => 'nullable|string|in:hide,show_message,ai_only,contact_form,redirect',
            'schedule.exceptions.*.offline_message_override'  => 'nullable|string|max:500',
            'popover'                              => 'nullable|array',
            'popover.enabled'                      => 'nullable|boolean',
            'popover.design'                       => 'nullable|string|in:urgent,luxury,modern,bold,minimal',
            'popover.heading'                      => 'nullable|string|max:200',
            'popover.description'                  => 'nullable|string|max:500',
            'popover.badge_text'                   => 'nullable|string|max:50',
            'popover.primary_button'               => 'nullable|array',
            'popover.primary_button.text'           => 'nullable|string|max:100',
            'popover.primary_button.url'            => 'nullable|string|max:500',
            'popover.primary_button.action'         => 'nullable|string|in:url,open_chat,none',
            'popover.secondary_button'             => 'nullable|array',
            'popover.secondary_button.text'         => 'nullable|string|max:100',
            'popover.secondary_button.url'          => 'nullable|string|max:500',
            'popover.secondary_button.action'       => 'nullable|string|in:url,open_chat,none',
            'popover.show_online_status'            => 'nullable|boolean',
            'popover.online_status_text'            => 'nullable|string|max:100',
            'popover.trigger'                      => 'nullable|string|in:immediate,delay,scroll,exit_intent',
            'popover.trigger_delay'                => 'nullable|integer|min:0|max:300',
            'popover.trigger_scroll_percent'       => 'nullable|integer|min:1|max:100',
            'popover.show_once_per_session'         => 'nullable|boolean',
            'popover.show_on_pages'                => 'nullable|string|in:all,specific',
            'popover.page_urls'                    => 'nullable|array|max:20',
            'popover.page_urls.*'                  => 'nullable|string|max:500',
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
            'widget_active', 'auto_open', 'auto_open_delay', 'design',
            'greeting_enabled', 'greeting_delay', 'greeting_message', 'font_size',
            'animation', 'animation_repeat', 'animation_delay', 'animation_duration',
            'animation_stop_after', 'gradient', 'offline_behavior', 'offline_message',
            'schedule', 'popover',
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
