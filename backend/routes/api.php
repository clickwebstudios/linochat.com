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
use App\Http\Controllers\Api\WidgetSettingsController;

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

Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'updateProfile']);
    });
});

// DEBUG: Test token validation (public)
Route::get('/debug/token', function (Request $request) {
    $token = $request->bearerToken();
    
    try {
        $user = auth('api')->user();
        return response()->json([
            'success' => true,
            'token_received' => $token ? 'YES' : 'NO',
            'token_length' => $token ? strlen($token) : 0,
            'user_authenticated' => $user ? 'YES' : 'NO',
            'user_id' => $user ? $user->id : null,
            'auth_guard' => config('auth.defaults.guard'),
            'jwt_secret_set' => !empty(config('jwt.secret')),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'token_received' => $token ? 'YES' : 'NO',
        ]);
    }
});

// DEBUG: Test with auth middleware
Route::middleware('auth:api')->get('/debug/auth-test', function (Request $request) {
    return response()->json([
        'success' => true,
        'user_id' => auth('api')->id(),
        'user_email' => auth('api')->user()->email,
    ]);
});

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Health check route
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

// Widget Public API (no auth required)
Route::options('widget/{widget_id}/{path?}', fn () => response('', 204)->withHeaders([
    'Access-Control-Allow-Origin' => '*',
    'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers' => 'Content-Type, ngrok-skip-browser-warning',
    'Access-Control-Max-Age' => '86400',
]))->where('path', '(config|init|message|messages|typing|handover|check-ticket-needed|create-ticket|status)');

Route::group([
    'prefix' => 'widget/{widget_id}',
    'middleware' => [\App\Http\Middleware\WidgetApiCors::class],
], function () {
    Route::get('/config', [WidgetController::class, 'config']);
    Route::get('/status', [WidgetController::class, 'agentStatus']);
    Route::match(['get', 'post'], '/init', [WidgetController::class, 'init']);
    Route::match(['get', 'post'], '/message', [WidgetController::class, 'sendMessage']);
    Route::post('/typing', [WidgetController::class, 'typing']);
    Route::get('/messages', [WidgetController::class, 'messages']);
    Route::post('/handover', [WidgetController::class, 'requestHuman']);
    Route::post('/check-ticket-needed', [WidgetController::class, 'checkTicketNeeded']);
    Route::post('/create-ticket', [WidgetController::class, 'submitContactAndCreateTicket']);
});

// Widget Settings API (auth required)
Route::middleware('auth:api')->group(function () {
    Route::get('/projects/{project_id}/widget-settings', [WidgetSettingsController::class, 'show']);
    Route::put('/projects/{project_id}/widget-settings', [WidgetSettingsController::class, 'update']);
    Route::delete('/projects/{project_id}/widget-settings', [WidgetSettingsController::class, 'reset']);
    Route::get('/projects/{project_id}/embed-code', [WidgetSettingsController::class, 'embedCode']);
});

// Agent Dashboard API (auth required)
Route::middleware('auth:api')->prefix('agent')->group(function () {
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
    Route::post('/tickets/{ticket_id}/take', [TicketController::class, 'take']);
    Route::post('/tickets/{ticket_id}/assign', [TicketController::class, 'assign']);
    Route::post('/tickets/{ticket_id}/status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket_id}/reply', [TicketController::class, 'reply']);
    Route::delete('/tickets/{ticket_id}', [TicketController::class, 'destroy']);
});

// Dashboard API (auth required)
Route::middleware('auth:api')->prefix('dashboard')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/ticket-volume', [DashboardController::class, 'ticketVolume']);
});

// Invitation API
Route::get('/invitations/{token}', [InvitationController::class, 'show']);
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);
Route::post('/invitations/{token}/reject', [InvitationController::class, 'reject']);

Route::middleware('auth:api')->group(function () {
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
});

// Alternative route for messages (with 's')
Route::middleware('auth:api')->post('/agent/chats/{chat_id}/messages', [AgentController::class, 'sendMessage']);

// AI Chat API (public with rate limiting)
Route::prefix('ai')->group(function () {
    Route::post('/chat', [AIChatController::class, 'chat']);
    Route::get('/model', [AIChatController::class, 'modelInfo']);
    Route::get('/rate-limit', [AIChatController::class, 'rateLimitStatus']);
});

// Superadmin API (requires superadmin role)
Route::middleware('auth:api')->prefix('superadmin')->group(function () {
    Route::get('/companies', [SuperadminController::class, 'companies']);
    Route::get('/companies/{companyId}', [SuperadminController::class, 'companyDetails']);
    Route::get('/companies/{companyId}/chats', [SuperadminController::class, 'companyChats']);
    Route::get('/dashboard-stats', [SuperadminController::class, 'dashboardStats']);
    Route::get('/stats', [SuperadminController::class, 'platformStats']);
    Route::get('/chats', [SuperadminController::class, 'allChats']);
    Route::get('/projects', [SuperadminController::class, 'allProjects']);
    Route::get('/agents', [SuperadminController::class, 'allAgents']);
    Route::get('/agents/{agentId}', [SuperadminController::class, 'agentDetails']);
});
