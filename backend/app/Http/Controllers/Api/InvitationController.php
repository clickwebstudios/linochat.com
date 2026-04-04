<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invitation\AcceptRequest;
use App\Http\Requests\Invitation\InviteRequest;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class InvitationController extends Controller
{
    public function __construct(private readonly InvitationService $invitationService) {}

    /**
     * Send invitation to agent
     */
    public function invite(InviteRequest $request, string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if ($project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $email        = $request->input('email');
        $existingUser = User::where('email', $email)->first();

        if ($existingUser && $existingUser->projects()->where('projects.id', $project_id)->exists()) {
            return response()->json(['success' => false, 'message' => 'This user is already an agent on this project'], 422);
        }

        $existing = Invitation::where('project_id', $project_id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'An invitation has already been sent to this email'], 422);
        }

        $result     = $this->invitationService->create($email, $project, $request->only(['first_name', 'last_name']));
        $invitation = $result['invitation'];
        $message    = $this->invitationService->buildMessage($result['email_sent']);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [
                'invitation_id' => $invitation->id,
                'email'         => $invitation->email,
                'status'        => $invitation->status,
                'expires_at'    => $invitation->expires_at->toIso8601String(),
                'email_sent'    => $result['email_sent'] && $result['mail_driver'] !== 'log',
            ],
        ]);
    }

    /**
     * Get invitation details by token
     */
    public function show(string $token)
    {
        $invitation = Invitation::where('token', $token)->with('project')->first();

        if (!$invitation) {
            return response()->json(['success' => false, 'message' => 'Invalid invitation token'], 404);
        }
        if ($invitation->isExpired()) {
            return response()->json(['success' => false, 'message' => 'This invitation has expired', 'data' => ['expired' => true]], 410);
        }
        if ($invitation->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'This invitation has already been ' . $invitation->status], 410);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'invitation_id' => $invitation->id,
                'email'         => $invitation->email,
                'project'       => ['id' => $invitation->project->id, 'name' => $invitation->project->name],
                'expires_at'    => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Accept invitation and create account
     */
    public function accept(AcceptRequest $request, string $token)
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json(['success' => false, 'message' => 'Invalid invitation token'], 404);
        }
        if ($invitation->isExpired()) {
            return response()->json(['success' => false, 'message' => 'This invitation has expired'], 410);
        }
        if ($invitation->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'This invitation has already been ' . $invitation->status], 410);
        }

        $user    = User::where('email', $invitation->email)->first();
        $project = Project::find($invitation->project_id);

        if ($user) {
            $existingCompanyOwnerId = $user->getCompanyOwnerId();
            if ($existingCompanyOwnerId && $project && (int) $project->user_id !== $existingCompanyOwnerId) {
                return response()->json(['success' => false, 'message' => 'This email is already associated with another company. Please use a different email.'], 409);
            }
            $user->projects()->syncWithoutDetaching([$invitation->project_id]);
        } else {
            $user = User::create([
                'first_name' => $request->input('first_name'),
                'last_name'  => $request->input('last_name'),
                'email'      => $invitation->email,
                'password'   => Hash::make($request->input('password')),
                'role'       => 'agent',
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
                'auto_accept_chats'    => false,
                'max_concurrent_chats' => 3,
            ]);
            $user->projects()->attach($invitation->project_id);
        }

        $invitation->update(['status' => 'accepted', 'accepted_at' => now()]);

        // Token generation uses JWT (tymon/jwt-auth) — preserved as-is
        $accessToken  = auth('api')->login($user);
        $refreshToken = auth('api')->claims(['refresh' => true])->fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Invitation accepted successfully',
            'data'    => [
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
                'token_type'    => 'bearer',
                'expires_in'    => auth('api')->factory()->getTTL() * 60,
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
            return response()->json(['success' => false, 'message' => 'Invalid invitation token'], 404);
        }
        if ($invitation->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'This invitation has already been ' . $invitation->status], 410);
        }

        $invitation->update(['status' => 'rejected']);

        return response()->json(['success' => true, 'message' => 'Invitation rejected']);
    }

    /**
     * List invitations for a project
     */
    public function list(Request $request, string $project_id)
    {
        $user    = auth('api')->user();
        $project = Project::where('id', $project_id)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if ($project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $invitations = Invitation::where('project_id', $project_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $invitations]);
    }

    /**
     * Cancel invitation
     */
    public function cancel(Request $request, string $invitation_id)
    {
        $user       = auth('api')->user();
        $invitation = Invitation::where('id', $invitation_id)->first();

        if (!$invitation) {
            return response()->json(['success' => false, 'message' => 'Invitation not found'], 404);
        }

        $project = Project::where('id', $invitation->project_id)->first();

        if (!$project || $project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        if ($invitation->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Cannot cancel a ' . $invitation->status . ' invitation'], 422);
        }

        $invitation->update(['status' => 'expired']);

        return response()->json(['success' => true, 'message' => 'Invitation cancelled']);
    }
}
