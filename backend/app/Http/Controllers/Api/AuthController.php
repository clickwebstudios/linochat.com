<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\SendVerificationCodeRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\VerifyEmailCodeRequest;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetMail;
use App\Mail\VerificationCodeMail;
use App\Mail\WelcomeMail;
use App\Models\EmailVerificationCode;
use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\Project;
use App\Models\User;
use App\Services\WebsiteAnalyzerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Login and return a Sanctum token with the same shape the frontend expects.
     */
    public function login(LoginRequest $request)
    {
        // Per-email lockout: 5 failed attempts within 15 minutes
        $lockoutKey = 'login_attempts:' . strtolower($request->input('email'));
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($lockoutKey, 5)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($lockoutKey);
            return response()->json([
                'success' => false,
                'message' => "Too many login attempts. Try again in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $request->input('email'))->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            \Illuminate\Support\Facades\RateLimiter::hit($lockoutKey, 900);
            \Log::warning('Failed login attempt', [
                'email'      => $request->input('email'),
                'ip'         => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors'  => ['email' => ['Invalid credentials']],
            ], 401);
        }

        \Illuminate\Support\Facades\RateLimiter::clear($lockoutKey);

        return $this->respondWithToken($user);
    }

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request, WebsiteAnalyzerService $analyzer)
    {
        $user = User::create([
            'first_name'   => $request->first_name,
            'last_name'    => $request->last_name,
            'company_name' => $request->company_name,
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'role'         => 'admin',
            'status'       => 'Active',
            'join_date'    => now(),
        ]);

        $user->notificationPreferences()->create([
            'email_notifications'   => true,
            'desktop_notifications' => true,
            'sound_alerts'          => false,
            'weekly_summary'        => true,
        ]);

        $user->availabilitySettings()->create([
            'auto_accept_chats'    => true,
            'max_concurrent_chats' => 5,
        ]);

        $project = Project::create([
            'user_id'     => $user->id,
            'name'        => $request->company_name,
            'slug'        => Str::slug($request->company_name) . '-' . Str::random(6),
            'widget_id'   => 'wc_' . Str::random(32),
            'website'     => $request->website,
            'color'       => '#4F46E5',
            'status'      => 'active',
            'description' => 'Auto-generated from website analysis',
        ]);

        $analysisResult = $analyzer->analyze($request->website);

        if ($analysisResult['success']) {
            $this->createKbFromAnalysis($project, $analysisResult['data'], $user->id);
        }

        try {
            Mail::to($user->email)->send(new WelcomeMail($user, $project));
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email', ['error' => $e->getMessage()]);
        }

        $accessToken  = $user->createToken('access-token')->plainTextToken;
        $refreshToken = $user->createToken('refresh-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data'    => [
                'access_token'      => $accessToken,
                'refresh_token'     => $refreshToken,
                'token_type'        => 'bearer',
                'expires_in'        => 3600,
                'user'              => $user,
                'project'           => $project,
                'analysis'          => $analysisResult['success'] ? 'completed' : 'failed',
                'kb_articles_count' => $analysisResult['success']
                    ? collect($analysisResult['data']['categories'] ?? [])->pluck('articles')->flatten()->count()
                    : 0,
            ],
        ]);
    }

    protected function createKbFromAnalysis(Project $project, array $data, string $userId): void
    {
        if (!empty($data['description'])) {
            $project->update(['description' => $data['description']]);
        }

        foreach ($data['categories'] ?? [] as $categoryData) {
            $category = KbCategory::create([
                'project_id'  => $project->id,
                'name'        => $categoryData['name'],
                'slug'        => Str::slug($categoryData['name']),
                'description' => null,
            ]);

            foreach ($categoryData['articles'] ?? [] as $articleData) {
                KbArticle::create([
                    'category_id'  => $category->id,
                    'project_id'   => $project->id,
                    'author_id'    => $userId,
                    'title'        => $articleData['title'],
                    'slug'         => Str::slug($articleData['title']) . '-' . Str::random(4),
                    'content'      => $articleData['content'],
                    'is_published' => true,
                    'views'        => 0,
                ]);
            }
        }

        if (!empty($data['faq'])) {
            $faqCategory = KbCategory::create([
                'project_id'  => $project->id,
                'name'        => 'FAQ',
                'slug'        => 'faq',
                'description' => 'Frequently asked questions',
            ]);

            foreach ($data['faq'] as $faq) {
                KbArticle::create([
                    'category_id'  => $faqCategory->id,
                    'project_id'   => $project->id,
                    'author_id'    => $userId,
                    'title'        => $faq['question'],
                    'slug'         => Str::slug(substr($faq['question'], 0, 50)) . '-' . Str::random(4),
                    'content'      => $faq['answer'],
                    'is_published' => true,
                    'views'        => 0,
                ]);
            }
        }
    }

    /**
     * Send a 6-digit verification code to the given email.
     */
    public function sendVerificationCode(SendVerificationCodeRequest $request)
    {
        $email = $request->input('email');

        if (User::where('email', $email)->exists()) {
            return response()->json(['success' => false, 'message' => 'This email is already registered.'], 422);
        }

        $recent = EmailVerificationCode::where('email', $email)
            ->where('created_at', '>', now()->subSeconds(60))
            ->first();

        if ($recent) {
            return response()->json(['success' => false, 'message' => 'Please wait before requesting a new code.'], 429);
        }

        EmailVerificationCode::where('email', $email)->delete();

        $code = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);

        EmailVerificationCode::create([
            'email'      => $email,
            'code'       => $code,
            'expires_at' => now()->addMinutes(15),
        ]);

        try {
            Mail::to($email)->send(new VerificationCodeMail($code, $email));
        } catch (\Exception $e) {
            Log::error('Failed to send verification code email', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to send verification email. Please try again.'], 500);
        }

        return response()->json(['success' => true, 'message' => 'Verification code sent to your email.']);
    }

    /**
     * Verify the 6-digit email code.
     */
    public function verifyEmailCode(VerifyEmailCodeRequest $request)
    {
        $record = EmailVerificationCode::where('email', $request->input('email'))
            ->where('code', $request->input('code'))
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Invalid verification code.'], 422);
        }

        if ($record->isExpired()) {
            $record->delete();
            return response()->json(['success' => false, 'message' => 'Verification code has expired. Please request a new one.'], 422);
        }

        $record->delete();

        return response()->json(['success' => true, 'message' => 'Email verified successfully.']);
    }

    /**
     * Get the authenticated User.
     */
    public function me(Request $request)
    {
        return response()->json(['success' => true, 'data' => new UserResource($request->user())]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data'    => $user->fresh(),
        ]);
    }

    /**
     * Log the user out (revoke all tokens).
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['success' => true, 'message' => 'Successfully logged out']);
    }

    /**
     * Refresh token — revoke current and issue new ones.
     */
    public function refresh(Request $request)
    {
        $refreshToken = $request->input('refresh_token');

        if (!$refreshToken) {
            return response()->json(['success' => false, 'message' => 'Refresh token is required'], 422);
        }

        [$id, $token] = array_pad(explode('|', $refreshToken, 2), 2, null);
        $pat = \Laravel\Sanctum\PersonalAccessToken::find($id);

        if (!$pat || !hash_equals($pat->token, hash('sha256', $token))) {
            return response()->json(['success' => false, 'message' => 'Invalid refresh token'], 401);
        }

        if ($pat->expires_at && $pat->expires_at->isPast()) {
            $pat->delete();
            return response()->json(['success' => false, 'message' => 'Refresh token has expired'], 401);
        }

        $user = $pat->tokenable;
        $user->tokens()->delete();

        return $this->respondWithToken($user);
    }

    /**
     * Forgot password.
     */
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $user  = User::where('email', $request->input('email'))->first();
        $token = Str::random(64);

        \DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $resetUrl = rtrim(config('app.frontend_url', 'https://linochat.com'), '/') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to send reset email. Please try again later.'], 500);
        }

        return response()->json(['success' => true, 'message' => 'Password reset link sent to your email']);
    }

    /**
     * Reset password.
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        $resetRecord = \DB::table('password_resets')
            ->where('email', $request->input('email'))
            ->first();

        if (!$resetRecord) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired reset token'], 400);
        }

        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            \DB::table('password_resets')->where('email', $request->input('email'))->delete();
            return response()->json(['success' => false, 'message' => 'Reset token has expired. Please request a new one.'], 400);
        }

        if (!Hash::check($request->input('token'), $resetRecord->token)) {
            return response()->json(['success' => false, 'message' => 'Invalid reset token'], 400);
        }

        $user = User::where('email', $request->input('email'))->first();
        $user->update(['password' => Hash::make($request->input('password'))]);
        \DB::table('password_resets')->where('email', $request->input('email'))->delete();

        return response()->json(['success' => true, 'message' => 'Password reset successfully']);
    }

    /**
     * Handle Google login/register via ID token from frontend.
     */
    public function googleCallback(Request $request)
    {
        $validated = $request->validate(['credential' => 'required|string']);

        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromToken($validated['credential']);
        } catch (\Exception $e) {
            Log::error('Google auth failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Invalid Google credentials'], 401);
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }
            if ($googleUser->getAvatar() && !$user->avatar_url) {
                $user->update(['avatar_url' => $googleUser->getAvatar()]);
            }
        } else {
            $nameParts = explode(' ', $googleUser->getName(), 2);
            $user      = User::create([
                'first_name' => $nameParts[0] ?? '',
                'last_name'  => $nameParts[1] ?? '',
                'email'      => $googleUser->getEmail(),
                'google_id'  => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'password'   => Hash::make(Str::random(32)),
                'role'       => 'admin',
                'status'     => 'Active',
                'join_date'  => now(),
            ]);
            $user->notificationPreferences()->create([
                'email_notifications'   => true,
                'desktop_notifications' => true,
                'sound_alerts'          => false,
                'weekly_summary'        => true,
            ]);
            $user->availabilitySettings()->create([
                'auto_accept_chats'    => true,
                'max_concurrent_chats' => 5,
            ]);
        }

        return $this->respondWithToken($user);
    }

    /**
     * Build the standard token response the frontend expects.
     */
    protected function respondWithToken(User $user)
    {
        $accessToken  = $user->createToken('access-token')->plainTextToken;
        $refreshToken = $user->createToken('refresh-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data'    => [
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
                'token_type'    => 'bearer',
                'expires_in'    => 3600,
                'user'          => $user,
            ],
        ]);
    }
}
