<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AgentInvitationMail;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    /**
     * Send invitation to agent
     */
    public function invite(Request $request, string $project_id)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check if user owns this project
        if ($project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $email = $request->input('email');

        // Check if user with this email already exists and is assigned to project
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $isAlreadyAssigned = $existingUser->projects()->where('projects.id', $project_id)->exists();
            if ($isAlreadyAssigned) {
                return response()->json([
                    'success' => false,
                    'message' => 'This user is already an agent on this project',
                ], 422);
            }
        }

        // Check if there's a pending invitation for this email
        $existingInvitation = Invitation::where('project_id', $project_id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'success' => false,
                'message' => 'An invitation has already been sent to this email',
            ], 422);
        }

        // Create invitation
        $invitation = Invitation::create([
            'project_id' => $project_id,
            'email' => $email,
            'token' => Str::random(32),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        // Send email
        $emailSent = false;
        $mailDriver = config('mail.default');
        try {
            Mail::to($email)->send(new AgentInvitationMail($invitation, $project));
            $emailSent = true;
        } catch (\Exception $e) {
            \Log::error('Failed to send invitation email', [
                'error' => $e->getMessage(),
                'invitation_id' => $invitation->id,
            ]);
        }

        $message = 'Invitation sent successfully';
        if (!$emailSent) {
            $message = 'Invitation created but email could not be sent. Check mail configuration.';
        } elseif ($mailDriver === 'log') {
            $message = 'Invitation created. Configure MAIL_MAILER=smtp in .env to send emails to recipients.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'invitation_id' => $invitation->id,
                'email' => $invitation->email,
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'email_sent' => $emailSent && $mailDriver !== 'log',
            ],
        ]);
    }

    /**
     * Get invitation details by token
     */
    public function show(string $token)
    {
        $invitation = Invitation::where('token', $token)
            ->with('project')
            ->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invitation token',
            ], 404);
        }

        if ($invitation->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has expired',
                'data' => ['expired' => true],
            ], 410);
        }

        if ($invitation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has already been ' . $invitation->status,
            ], 410);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'invitation_id' => $invitation->id,
                'email' => $invitation->email,
                'project' => [
                    'id' => $invitation->project->id,
                    'name' => $invitation->project->name,
                ],
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Accept invitation and create account
     */
    public function accept(Request $request, string $token)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invitation token',
            ], 404);
        }

        if ($invitation->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has expired',
            ], 410);
        }

        if ($invitation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has already been ' . $invitation->status,
            ], 410);
        }

        // Check if user already exists
        $user = User::where('email', $invitation->email)->first();

        if ($user) {
            // User exists, just link to project
            $user->projects()->attach($invitation->project_id);
        } else {
            // Create new user
            $user = User::create([
                'first_name' => $request->input('first_name'),
                'last_name' => $request->input('last_name'),
                'email' => $invitation->email,
                'password' => Hash::make($request->input('password')),
                'role' => 'agent',
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
                'auto_accept_chats' => false,
                'max_concurrent_chats' => 3,
            ]);

            // Link to project
            $user->projects()->attach($invitation->project_id);
        }

        // Mark invitation as accepted
        $invitation->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        // Generate Sanctum tokens for auto-login
        $accessToken  = $user->createToken('access-token')->plainTextToken;
        $refreshToken = $user->createToken('refresh-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Invitation accepted successfully',
            'data' => [
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
                'token_type'    => 'bearer',
                'expires_in'    => 3600,
                'user'          => $user,
            ],
        ]);
    }

    /**
     * Reject invitation
     */
    public function reject(string $token)
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invitation token',
            ], 404);
        }

        if ($invitation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has already been ' . $invitation->status,
            ], 410);
        }

        $invitation->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Invitation rejected',
        ]);
    }

    /**
     * List invitations for a project
     */
    public function list(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check if user owns this project
        if ($project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $invitations = Invitation::where('project_id', $project_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $invitations,
        ]);
    }

    /**
     * Cancel invitation
     */
    public function cancel(Request $request, string $invitation_id)
    {
        $user = auth('api')->user();
        
        $invitation = Invitation::where('id', $invitation_id)->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invitation not found',
            ], 404);
        }

        $project = Project::where('id', $invitation->project_id)->first();

        // Check if user owns this project
        if (!$project || $project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($invitation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel a ' . $invitation->status . ' invitation',
            ], 422);
        }

        $invitation->update(['status' => 'expired']);

        return response()->json([
            'success' => true,
            'message' => 'Invitation cancelled',
        ]);
    }
}
