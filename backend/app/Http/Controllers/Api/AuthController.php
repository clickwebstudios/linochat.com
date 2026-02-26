<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use App\Models\Project;
use App\Models\KbCategory;
use App\Models\KbArticle;
use App\Services\WebsiteAnalyzerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Illuminate\Support\Str;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Authentication",
 *     description="User authentication, registration, and password management"
 * )
 */
class AuthController extends ApiController
{
    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register', 'refresh', 'forgotPassword', 'resetPassword']]);
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Register a new user.
     */
    public function register(Request $request, WebsiteAnalyzerService $analyzer)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'website' => 'required|url|max:255',
            'company_name' => 'required|string|max:255',
            'role' => 'sometimes|string|in:admin,agent,superadmin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $role = $request->input('role', 'admin');

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'company_name' => $request->company_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $role,
            'status' => 'Active',
            'join_date' => now(),
        ]);

        // Create notification preferences
        $user->notificationPreferences()->create([
            'email_notifications' => true,
            'desktop_notifications' => true,
            'sound_alerts' => false,
            'weekly_summary' => true,
        ]);

        // Create availability settings
        $user->availabilitySettings()->create([
            'auto_accept_chats' => true,
            'max_concurrent_chats' => 5,
        ]);

        // Create project with website
        $project = Project::create([
            'user_id' => $user->id,
            'name' => $request->company_name,
            'slug' => Str::slug($request->company_name) . '-' . Str::random(6),
            'widget_id' => 'wc_' . Str::random(32),
            'website' => $request->website,
            'color' => '#4F46E5',
            'status' => 'active',
            'description' => 'Auto-generated from website analysis',
        ]);

        // Analyze website and create KB
        $analysisResult = $analyzer->analyze($request->website);
        
        if ($analysisResult['success']) {
            $this->createKbFromAnalysis($project, $analysisResult['data'], $user->id);
        }

        // Send welcome email
        try {
            Mail::to($user->email)->send(new WelcomeMail($user, $project));
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email', ['error' => $e->getMessage()]);
        }

        $token = auth('api')->login($user);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'access_token' => $token,
                'refresh_token' => auth('api')->claims(['refresh' => true])->fromUser($user),
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => $user,
                'project' => $project,
                'analysis' => $analysisResult['success'] ? 'completed' : 'failed',
                'kb_articles_count' => $analysisResult['success'] 
                    ? collect($analysisResult['data']['categories'] ?? [])->pluck('articles')->flatten()->count() 
                    : 0,
            ],
        ]);
    }

    /**
     * Create KB categories and articles from AI analysis
     */
    protected function createKbFromAnalysis(Project $project, array $data, string $userId): void
    {
        // Update project description if AI found better info
        if (!empty($data['description'])) {
            $project->update(['description' => $data['description']]);
        }

        // Create categories and articles
        foreach ($data['categories'] ?? [] as $categoryData) {
            $category = KbCategory::create([
                'project_id' => $project->id,
                'name' => $categoryData['name'],
                'slug' => Str::slug($categoryData['name']),
                'description' => null,
            ]);

            foreach ($categoryData['articles'] ?? [] as $articleData) {
                KbArticle::create([
                    'category_id' => $category->id,
                    'project_id' => $project->id,
                    'author_id' => $userId,
                    'title' => $articleData['title'],
                    'slug' => Str::slug($articleData['title']) . '-' . Str::random(4),
                    'content' => $articleData['content'],
                    'is_published' => true,
                    'views' => 0,
                ]);
            }
        }

        // Create FAQ category if there are FAQs
        if (!empty($data['faq'])) {
            $faqCategory = KbCategory::create([
                'project_id' => $project->id,
                'name' => 'FAQ',
                'slug' => 'faq',
                'description' => 'Frequently asked questions',
            ]);

            foreach ($data['faq'] as $faq) {
                KbArticle::create([
                    'category_id' => $faqCategory->id,
                    'project_id' => $project->id,
                    'author_id' => $userId,
                    'title' => $faq['question'],
                    'slug' => Str::slug(substr($faq['question'], 0, 50)) . '-' . Str::random(4),
                    'content' => $faq['answer'],
                    'is_published' => true,
                    'views' => 0,
                ]);
            }
        }
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource(auth('api')->user()),
        ]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request)
    {
        $user = auth('api')->user();
        
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:10',
            'bio' => 'nullable|string|max:2000',
            'location' => 'nullable|string|max:255',
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        auth('api')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Refresh a token.
     */
    public function refresh(Request $request)
    {
        try {
            $refreshToken = $request->input('refresh_token');
            
            if (!$refreshToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Refresh token is required',
                ], 422);
            }

            // Parse the refresh token and get new access token
            $token = JWTAuth::setToken($refreshToken);
            $user = $token->toUser();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid refresh token',
                ], 401);
            }

            // Generate new tokens
            $newToken = auth('api')->login($user);
            
            return $this->respondWithToken($newToken);
        } catch (TokenExpiredException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Refresh token expired',
            ], 401);
        } catch (TokenInvalidException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid refresh token',
            ], 401);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not refresh token',
            ], 500);
        }
    }

    /**
     * Forgot password.
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->input('email'))->first();

        // Generate reset token
        $token = Str::random(64);

        // Store token in password_resets table
        \DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $resetUrl = rtrim(config('app.frontend_url', 'http://localhost:5174'), '/') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

        // Send password reset email
        Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));

        return response()->json([
            'success' => true,
            'message' => 'Password reset link sent to your email',
        ]);
    }

    /**
     * Reset password.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find the reset record
        $resetRecord = \DB::table('password_resets')
            ->where('email', $request->input('email'))
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token',
            ], 400);
        }

        // Check if token is expired (60 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            \DB::table('password_resets')->where('email', $request->input('email'))->delete();
            return response()->json([
                'success' => false,
                'message' => 'Reset token has expired. Please request a new one.',
            ], 400);
        }

        // Verify the token
        if (!Hash::check($request->input('token'), $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid reset token',
            ], 400);
        }

        // Update user password
        $user = User::where('email', $request->input('email'))->first();
        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        // Delete the reset token
        \DB::table('password_resets')->where('email', $request->input('email'))->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
        ]);
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token)
    {
        $user = auth('api')->user();
        
        // Generate refresh token (longer lived)
        $refreshToken = auth('api')->claims([
            'refresh' => true,
        ])->fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data' => [
                'access_token' => $token,
                'refresh_token' => $refreshToken,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => $user,
            ],
        ]);
    }
}
