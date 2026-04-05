<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AIChatController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\KbController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SuperadminController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\WidgetController;
use App\Http\Controllers\Api\TransferRequestController;
use App\Http\Controllers\Api\AISettingsController;
use App\Http\Controllers\Api\TrainingDocumentController;
use App\Http\Controllers\Api\WidgetSettingsController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OAuthController;
use App\Http\Controllers\Api\OAuthClientController;
use App\Http\Controllers\Api\PublicTicketController;
use App\Http\Controllers\Api\InboundEmailController;
use App\Http\Controllers\Api\IntegrationsController;
use App\Http\Controllers\Api\MessengerController;
use App\Http\Controllers\Api\ContactFormController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\TwilioWebhookController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\WhatsAppController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Public ticket view (no auth — guest customers, rate limited)
Route::middleware('throttle:15,1')->group(function () {
    Route::get('/public/tickets/{token}', [PublicTicketController::class, 'show']);
    Route::post('/public/tickets/{token}/reply', [PublicTicketController::class, 'reply']);
});

// Public contact forms (no auth — embedded on external sites)
Route::middleware('throttle:10,1')->group(function () {
    Route::get('/public/contact-forms/{slug}', [ContactFormController::class, 'showPublic']);
    Route::post('/public/contact-forms/{slug}/submit', [ContactFormController::class, 'submit']);
});

// Public help center (no auth — serves published KB articles)
Route::prefix('help')->group(function () {
    Route::get('/categories', [\App\Http\Controllers\Api\HelpController::class, 'categories']);
    Route::get('/articles', [\App\Http\Controllers\Api\HelpController::class, 'articles']);
    Route::get('/articles/{slug}', [\App\Http\Controllers\Api\HelpController::class, 'show']);
    Route::post('/articles/{id}/feedback', [\App\Http\Controllers\Api\HelpController::class, 'feedback']);
    Route::post('/search', [\App\Http\Controllers\Api\HelpController::class, 'search']);
});

// Inbound email webhook — called by SendGrid Inbound Parse (no auth)
Route::post('/email/inbound', [InboundEmailController::class, 'handle']);
Route::post('/email/inbound/{token}', [InboundEmailController::class, 'handle']);

Route::group(['prefix' => 'auth'], function () {
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);
        Route::post('google', [AuthController::class, 'googleCallback']);
    });
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::post('send-verification-code', [AuthController::class, 'sendVerificationCode']);
    });
    Route::middleware('throttle:10,1')->post('refresh', [AuthController::class, 'refresh']);
    Route::middleware('throttle:5,1')->post('verify-email-code', [AuthController::class, 'verifyEmailCode']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'updateProfile']);
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'service' => 'linochat-api',
    ]);
});

// Widget assets — must be BEFORE widget/{widget_id} to avoid route conflict
Route::get('widget-assets/widget.js', [\App\Http\Controllers\WidgetLoaderController::class, 'widget'])
    ->middleware(\App\Http\Middleware\WidgetCorsHeaders::class);
Route::get('widget-assets/style.css', [\App\Http\Controllers\WidgetLoaderController::class, 'style'])
    ->middleware(\App\Http\Middleware\WidgetCorsHeaders::class);

// Widget Public API — preflight OPTIONS handled by WidgetApiCors middleware
Route::options('widget/{widget_id}/{path?}', fn () => response('', 204))
    ->where('path', '(config|init|message|messages|typing|handover|check-ticket-needed|create-ticket|status)')
    ->middleware(\App\Http\Middleware\WidgetApiCors::class);

Route::group([
    'prefix' => 'widget/{widget_id}',
    'middleware' => [
        \App\Http\Middleware\WidgetApiCors::class,
        \App\Http\Middleware\ValidateWidgetDomain::class,
    ],
], function () {
    // Read-only endpoints — generous limit (120 req/min per IP)
    Route::middleware('throttle:120,1')->group(function () {
        Route::get('/config', [WidgetController::class, 'config']);
        Route::get('/status', [WidgetController::class, 'agentStatus']);
        Route::get('/messages', [WidgetController::class, 'messages']);
        Route::match(['get', 'post'], '/init', [WidgetController::class, 'init']);
        Route::match(['get', 'post'], '/heartbeat', [WidgetController::class, 'heartbeat']);
        Route::post('/page-view', [WidgetController::class, 'pageView']);
        Route::post('/message-feedback', [WidgetController::class, 'messageFeedback']);
    });

    // Typing/lightweight write — generous limit (shared with reads)
    Route::middleware('throttle:120,1')->group(function () {
        Route::post('/typing', [WidgetController::class, 'typing']);
    });

    // Message/AI endpoints — moderate limit (60 req/min per IP)
    Route::middleware('throttle:60,1')->group(function () {
        Route::match(['get', 'post'], '/message', [WidgetController::class, 'sendMessage']);
        Route::post('/handover', [WidgetController::class, 'requestHuman']);
        Route::post('/check-ticket-needed', [WidgetController::class, 'checkTicketNeeded']);
        Route::post('/create-ticket', [WidgetController::class, 'submitContactAndCreateTicket']);
    });
});

// Widget Settings API (auth required)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects/{project_id}/widget-settings', [WidgetSettingsController::class, 'show']);
    Route::put('/projects/{project_id}/widget-settings', [WidgetSettingsController::class, 'update']);
    Route::delete('/projects/{project_id}/widget-settings', [WidgetSettingsController::class, 'reset']);
    Route::get('/projects/{project_id}/embed-code', [WidgetSettingsController::class, 'embedCode']);
    Route::post('/projects/{project_id}/verify-widget', [WidgetSettingsController::class, 'verifyInstallation']);
});

// AI Settings API (auth required)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects/{project_id}/ai-settings', [AISettingsController::class, 'show']);
    Route::put('/projects/{project_id}/ai-settings/draft', [AISettingsController::class, 'saveDraft']);
    Route::post('/projects/{project_id}/ai-settings/publish', [AISettingsController::class, 'publish']);
    Route::get('/projects/{project_id}/ai-settings/versions', [AISettingsController::class, 'versions']);
    Route::post('/projects/{project_id}/ai-settings/restore/{version_id}', [AISettingsController::class, 'restore']);
    Route::post('/projects/{project_id}/ai-settings/generate-prompt', [AISettingsController::class, 'generatePrompt']);
    Route::get('/projects/{project_id}/ai-stats', [AISettingsController::class, 'stats']);
});

// Training Documents API (auth required)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects/{project_id}/training-documents', [TrainingDocumentController::class, 'index']);
    Route::post('/projects/{project_id}/training-documents', [TrainingDocumentController::class, 'store']);
    Route::delete('/projects/{project_id}/training-documents/{doc_id}', [TrainingDocumentController::class, 'destroy']);
});

// Agent Dashboard API (auth required)
Route::middleware('auth:sanctum')->prefix('agent')->group(function () {
    Route::get('/chats', [AgentController::class, 'chats']);
    Route::get('/chats/{chat_id}', [AgentController::class, 'show']);
    Route::get('/chats/{chat_id}/activity', [AgentController::class, 'activity']);
    Route::post('/chats/{chat_id}/take', [AgentController::class, 'take']);
    Route::post('/chats/{chat_id}/message', [AgentController::class, 'sendMessage']);
    Route::post('/chats/{chat_id}/close', [AgentController::class, 'close']);
    Route::post('/chats/{chat_id}/typing', [AgentController::class, 'typing']);
    Route::post('/chats/{chat_id}/mark-read', [AgentController::class, 'markRead']);
    Route::post('/chats/{id}/toggle-ai', [AgentController::class, 'toggleAi']);
    Route::get('/stats', [AgentController::class, 'stats']);

    // Ticket routes
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/volume', [TicketController::class, 'volume']);
    Route::get('/tickets/stats', [TicketController::class, 'stats']);
    Route::get('/tickets/{ticket_id}', [TicketController::class, 'show']);
    Route::put('/tickets/{ticket_id}', [TicketController::class, 'update']);
    Route::post('/tickets/{ticket_id}/take', [TicketController::class, 'take']);
    Route::post('/tickets/{ticket_id}/assign', [TicketController::class, 'assign']);
    Route::post('/tickets/{ticket_id}/escalate', [TicketController::class, 'escalate']);
    Route::post('/tickets/{ticket_id}/status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket_id}/reply', [TicketController::class, 'reply']);
    Route::delete('/tickets/{ticket_id}', [TicketController::class, 'destroy']);
});

// Dashboard API (auth required)
Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/ticket-volume', [DashboardController::class, 'ticketVolume']);
});

// Invitation API
Route::get('/invitations/{token}', [InvitationController::class, 'show']);
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);
Route::post('/invitations/{token}/reject', [InvitationController::class, 'reject']);

Route::middleware('auth:sanctum')->group(function () {
    // Projects API
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects/analyze', [ProjectController::class, 'analyze']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project_id}', [ProjectController::class, 'show']);
    Route::put('/projects/{project_id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project_id}', [ProjectController::class, 'destroy']);
    Route::get('/projects/{project_id}/agents', [ProjectController::class, 'agents']);
    Route::delete('/projects/{project_id}/agents/{agent_id}', [ProjectController::class, 'removeAgent']);
    
    // Project tickets and chats
    Route::get('/projects/{project_id}/tickets', [ProjectController::class, 'tickets']);
    Route::get('/projects/{project_id}/chats', [ProjectController::class, 'chats']);
    
    Route::post('/projects/{project_id}/invitations', [InvitationController::class, 'invite']);
    Route::get('/projects/{project_id}/invitations', [InvitationController::class, 'list']);
    Route::delete('/invitations/{invitation_id}', [InvitationController::class, 'cancel']);
    
    // Knowledge Base API
    Route::get('/kb/articles/{article_id}', [KbController::class, 'articleById']);
    Route::get('/projects/{project_id}/kb/categories', [KbController::class, 'categories']);
    Route::post('/projects/{project_id}/kb/categories', [KbController::class, 'createCategory']);
    Route::get('/projects/{project_id}/kb/categories/{category_id}/articles', [KbController::class, 'articles']);
    Route::post('/projects/{project_id}/kb/categories/{category_id}/articles', [KbController::class, 'createArticle']);
    Route::post('/projects/{project_id}/kb/categories/{category_id}/generate-article', [KbController::class, 'generateSingleArticle']);
    Route::get('/projects/{project_id}/kb/articles', [KbController::class, 'allArticles']);
    Route::get('/projects/{project_id}/kb/articles/{article_id}', [KbController::class, 'article']);
    Route::put('/projects/{project_id}/kb/articles/{article_id}', [KbController::class, 'updateArticle']);
    Route::delete('/projects/{project_id}/kb/articles/{article_id}', [KbController::class, 'deleteArticle']);
    
    // KB Generation API
    Route::post('/projects/{project_id}/kb/generate', [KbController::class, 'generateFromWebsite']);
    Route::get('/projects/{project_id}/kb/generation-status', [KbController::class, 'generationStatus']);
    Route::delete('/projects/{project_id}/kb/ai-articles', [KbController::class, 'deleteAiArticles']);
    
    // KB Search API (for AI and frontend)
    Route::post('/projects/{project_id}/kb/search', [KbController::class, 'search']);
    
    // Project Activities
    Route::get('/projects/{project_id}/activities', [ProjectController::class, 'activities']);
    
    // Agent/Users list
    Route::get('/agent/users', [AgentController::class, 'users']);
    Route::post('/agent/invitations', [AgentController::class, 'inviteAgent']);
    Route::post('/agent/invitations/{id}/resend', [AgentController::class, 'resendInvitation']);

    // Chat transfer requests (real-time)
    Route::get('/agent/transfer-requests', [TransferRequestController::class, 'index']);
    Route::post('/agent/transfer-requests', [TransferRequestController::class, 'store']);
    Route::post('/agent/transfer-requests/{id}/accept', [TransferRequestController::class, 'accept']);
    Route::post('/agent/transfer-requests/{id}/reject', [TransferRequestController::class, 'reject']);
    // Pending AI→human handovers (chats waiting for an agent)
    Route::get('/agent/pending-handovers', [TransferRequestController::class, 'pendingHandovers']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Device token registration (push notifications)
    Route::post('/devices/register', [\App\Http\Controllers\Api\DeviceTokenController::class, 'register']);
    Route::post('/devices/unregister', [\App\Http\Controllers\Api\DeviceTokenController::class, 'unregister']);

    // Settings: notification preferences, notification log & activity log
    Route::get('/settings/notifications', [App\Http\Controllers\Api\SettingsController::class, 'getNotificationSettings']);
    Route::put('/settings/notifications', [App\Http\Controllers\Api\SettingsController::class, 'updateNotificationSettings']);
    Route::get('/notifications/log', [App\Http\Controllers\Api\SettingsController::class, 'notificationLog']);
    Route::get('/activity-log', [App\Http\Controllers\Api\SettingsController::class, 'activityLog']);

    // Contact Forms
    Route::get('/contact-forms', [ContactFormController::class, 'index']);
    Route::post('/contact-forms', [ContactFormController::class, 'store']);
    Route::get('/contact-forms/{id}', [ContactFormController::class, 'show']);
    Route::put('/contact-forms/{id}', [ContactFormController::class, 'update']);
    Route::delete('/contact-forms/{id}', [ContactFormController::class, 'destroy']);

    // Billing API
    Route::get('/billing/plans', [BillingController::class, 'plans']);
    Route::get('/billing/subscription', [BillingController::class, 'subscription']);
    Route::put('/billing/subscription', [BillingController::class, 'updateSubscription']);
    Route::get('/billing/invoices', [BillingController::class, 'invoices']);
    Route::post('/billing/checkout', [BillingController::class, 'createCheckoutSession']);
    Route::post('/billing/portal', [BillingController::class, 'createPortalSession']);
    Route::delete('/billing/subscription', [BillingController::class, 'cancelSubscription']);
    Route::get('/billing/token-balance', [BillingController::class, 'tokenBalance']);
    Route::get('/billing/topup-packs', [BillingController::class, 'topUpPacks']);
    Route::post('/billing/topup', [BillingController::class, 'createTopUpIntent']);
    Route::post('/billing/topup-checkout', [BillingController::class, 'createTopUpCheckout']);

    // Integrations
    Route::get('/projects/{projectId}/integrations', [IntegrationsController::class, 'getSettings']);
    Route::get('/projects/{projectId}/integrations/frubix/authorize', [IntegrationsController::class, 'frubixAuthorizeUrl']);
    Route::get('/projects/{projectId}/integrations/frubix/clients', [IntegrationsController::class, 'frubixClients']);
    Route::get('/projects/{projectId}/integrations/frubix/schedule', [IntegrationsController::class, 'frubixSchedule']);
    Route::post('/projects/{projectId}/integrations/frubix/schedule', [IntegrationsController::class, 'frubixCreateAppointment']);
    Route::patch('/projects/{projectId}/integrations/frubix/schedule/{appointmentId}', [IntegrationsController::class, 'frubixUpdateAppointment']);
    Route::delete('/projects/{projectId}/integrations/frubix', [IntegrationsController::class, 'disconnectFrubix']);
    Route::post('/integrations/frubix/callback', [IntegrationsController::class, 'frubixCallback']);
    Route::post('/agent/tickets/{ticketId}/frubix-lead', [TicketController::class, 'createFrubixLead']);

    // Messenger integration
    Route::get('/integrations/messenger/status', [MessengerController::class, 'status']);
    Route::post('/integrations/messenger/connect', [MessengerController::class, 'connect']);
    Route::delete('/integrations/messenger/disconnect', [MessengerController::class, 'disconnect']);

    // WhatsApp sandbox
    Route::get('/integrations/whatsapp/sandbox/status', [WhatsAppController::class, 'sandboxStatus']);
    Route::post('/integrations/whatsapp/sandbox/connect', [WhatsAppController::class, 'sandboxConnect']);

    // Email channel (per-project)
    Route::get('/projects/{projectId}/integrations/email', [\App\Http\Controllers\Api\EmailChannelController::class, 'status']);
    Route::post('/projects/{projectId}/integrations/email', [\App\Http\Controllers\Api\EmailChannelController::class, 'connect']);
    Route::delete('/projects/{projectId}/integrations/email', [\App\Http\Controllers\Api\EmailChannelController::class, 'disconnect']);
    Route::post('/projects/{projectId}/integrations/email/test', [\App\Http\Controllers\Api\EmailChannelController::class, 'test']);
});

// Frubix webhooks (public, verified by signature)
Route::post('/webhooks/frubix', [\App\Http\Controllers\Api\FrubixWebhookController::class, 'handle']);

// Twilio webhooks — public, no auth
Route::post('/webhooks/twilio/{subaccount_sid}', [TwilioWebhookController::class, 'handle'])
    ->name('webhooks.twilio');

// Stripe webhooks — public
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle'])->name('webhooks.stripe');

// Alternative route for messages (with 's')
Route::middleware('auth:sanctum')->post('/agent/chats/{chat_id}/messages', [AgentController::class, 'sendMessage']);

// AI Chat API (public with rate limiting)
Route::prefix('ai')->group(function () {
    Route::post('/chat', [AIChatController::class, 'chat']);
    Route::get('/model', [AIChatController::class, 'modelInfo']);
    Route::get('/rate-limit', [AIChatController::class, 'rateLimitStatus']);
});

// Superadmin API (requires superadmin role)
Route::middleware('auth:sanctum')->prefix('superadmin')->group(function () {
    Route::get('/companies', [SuperadminController::class, 'companies']);
    Route::get('/companies/{companyId}', [SuperadminController::class, 'companyDetails']);
    Route::put('/companies/{companyId}', [SuperadminController::class, 'updateCompany']);
    Route::delete('/companies/{companyId}', [SuperadminController::class, 'deleteCompany']);
    Route::get('/companies/{companyId}/chats', [SuperadminController::class, 'companyChats']);
    Route::get('/companies/{companyId}/projects', [SuperadminController::class, 'companyProjects']);
    Route::get('/companies/{companyId}/agents', [SuperadminController::class, 'companyAgents']);
    Route::get('/companies/{companyId}/tickets', [SuperadminController::class, 'companyTickets']);
    Route::get('/companies/{companyId}/kb-articles', [SuperadminController::class, 'companyKbArticles']);
    Route::get('/companies/{companyId}/invoices', [SuperadminController::class, 'companyInvoices']);
    Route::post('/companies/{companyId}/invite', [SuperadminController::class, 'companyInvite']);
    Route::get('/companies/{companyId}/invitations', [SuperadminController::class, 'companyInvitations']);
    Route::get('/dashboard-stats', [SuperadminController::class, 'dashboardStats']);
    Route::get('/stats', [SuperadminController::class, 'platformStats']);
    Route::get('/chats', [SuperadminController::class, 'allChats']);
    Route::get('/projects', [SuperadminController::class, 'allProjects']);
    Route::post('/projects', [SuperadminController::class, 'storeProject']);
    Route::get('/projects/{projectId}', [SuperadminController::class, 'projectDetails']);
    Route::get('/agents', [SuperadminController::class, 'allAgents']);
    Route::get('/agents/{agentId}', [SuperadminController::class, 'agentDetails']);
    Route::put('/agents/{agentId}', [SuperadminController::class, 'updateAgent']);
    Route::delete('/agents/{agentId}', [SuperadminController::class, 'deleteAgent']);
    Route::post('/agents/invite', [SuperadminController::class, 'inviteAgent']);
    Route::get('/live-visitors', [SuperadminController::class, 'liveVisitors']);
    Route::get('/analytics/overview', [SuperadminController::class, 'analyticsOverview']);
    Route::get('/platform-settings/{key}', [\App\Http\Controllers\Api\PlatformSettingsController::class, 'show']);
    Route::put('/platform-settings/{key}', [\App\Http\Controllers\Api\PlatformSettingsController::class, 'update']);
    Route::get('/ai-usage-stats', [\App\Http\Controllers\Api\PlatformSettingsController::class, 'aiUsageStats']);
    Route::post('/impersonate/{userId}', [SuperadminController::class, 'impersonate']);
});

// ─────────────────────────────────────────────────────────────────────────────
// OAuth 2.0 Provider
// ─────────────────────────────────────────────────────────────────────────────

// Authorization endpoints (user must be logged in with JWT to use these)
Route::middleware('auth:sanctum')->prefix('oauth')->group(function () {
    // Show consent page data (GET) and handle approve/deny (POST)
    Route::get('/authorize', [OAuthController::class, 'authorizeForm']);
    Route::post('/authorize', [OAuthController::class, 'approveAuthorize']);
    // List available scopes
    Route::get('/scopes', [OAuthController::class, 'scopes']);
});

// Token endpoint — no user auth required (client authenticates with secret)
// Throttled to prevent brute-force
Route::middleware('throttle:30,1')->post('/oauth/token', [OAuthController::class, 'token']);

// Revoke endpoint
Route::post('/oauth/revoke', [OAuthController::class, 'revoke']);

// OAuth client management (authenticated users managing their own apps)
Route::middleware('auth:sanctum')->prefix('oauth/clients')->group(function () {
    Route::get('/', [OAuthClientController::class, 'index']);
    Route::post('/', [OAuthClientController::class, 'store']);
    Route::get('/{client}', [OAuthClientController::class, 'show']);
    Route::put('/{client}', [OAuthClientController::class, 'update']);
    Route::post('/{client}/rotate-secret', [OAuthClientController::class, 'rotateSecret']);
    Route::delete('/{client}', [OAuthClientController::class, 'destroy']);
});

// ─── OAuth-protected V1 API endpoints (accessible by 3rd-party apps like Frubix) ──
// Usage: middleware('oauth:scope') — validates Bearer token + required scope

// Projects
Route::middleware('oauth:projects:read')->get('/v1/projects', [ProjectController::class, 'index']);
Route::middleware('oauth:projects:read')->get('/v1/projects/{id}', [ProjectController::class, 'show']);

// Chats
Route::middleware('oauth:chats:read')->get('/v1/chats', [AgentController::class, 'chats']);
Route::middleware('oauth:chats:read')->get('/v1/chats/{chatId}', [AgentController::class, 'show']);
Route::middleware('oauth:chats:write')->post('/v1/chats/{chatId}/message', [AgentController::class, 'sendMessage']);
Route::middleware('oauth:chats:write')->post('/v1/chats/{chatId}/typing', [AgentController::class, 'typing']);
Route::middleware('oauth:chats:write')->post('/v1/chats/{chatId}/toggle-ai', [AgentController::class, 'toggleAi']);
Route::middleware('oauth:chats:read')->post('/v1/chats/{chatId}/suggest-replies', [AgentController::class, 'suggestReplies']);

// Frubix managed connection (register/unregister from Frubix side)
Route::middleware('oauth:projects:write')->post('/v1/projects/{projectId}/frubix-connect', [IntegrationsController::class, 'frubixRegisterConnection']);
Route::middleware('oauth:projects:write')->post('/v1/projects/{projectId}/frubix-disconnect', [IntegrationsController::class, 'frubixUnregisterConnection']);
Route::middleware('oauth:projects:write')->post('/v1/projects/{projectId}/agent-status', [IntegrationsController::class, 'frubixAgentStatus']);
