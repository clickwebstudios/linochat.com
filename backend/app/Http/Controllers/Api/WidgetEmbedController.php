<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class WidgetEmbedController extends Controller
{
    /**
     * Get embed code for website
     */
    public function embed(string $widget_id)
    {
        $project = Project::where('widget_id', $widget_id)
            ->where('status', 'active')
            ->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Widget not found',
            ], 404);
        }

        $apiUrl = config('app.url', 'http://localhost:8000');
        $welcomeMessage = "Hi there! How can we help you today?";
        
        // Generate embed code (single script: widget.js?id=)
        // crossOrigin="anonymous" required for CORS when embedding on customer sites
        $embedCode = <<<HTML
<!-- LinoChat Widget -->
<script>
(function() {
    var s = document.createElement('script');
    s.src = '{$apiUrl}/widget/?id={$widget_id}';
    s.async = true;
    s.crossOrigin = 'anonymous';
    (document.body || document.documentElement).appendChild(s);
})();
</script>
<!-- End LinoChat Widget -->
HTML;

        return response()->json([
            'success' => true,
            'data' => [
                'widget_id' => $widget_id,
                'company_name' => $project->name,
                'embed_code' => $embedCode,
                'install_instructions' => 'Paste this code before the closing </body> tag on your website',
            ],
        ]);
    }
}
