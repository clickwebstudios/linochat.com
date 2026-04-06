<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class UserController extends Controller {
    public function index(Request $request) {
        $authUser = auth('api')->user();
        $users = User::query()
            ->when(!$authUser->isSuperadmin(), fn($q) => $q->where('company_id', $authUser->company_id))
            ->when($authUser->isSuperadmin() && $request->company_id, fn($q, $v) => $q->where('company_id', $v))
            ->when($request->role, fn($q, $v) => $q->where('role', $v))
            ->with('company')
            ->paginate(50);
        return UserResource::collection($users);
    }
    public function show(User $user) {
        $authUser = auth('api')->user();
        if (!$authUser->isSuperadmin() && $user->company_id !== $authUser->company_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return new UserResource($user->load('company'));
    }
    public function update(Request $request, User $user) {
        $data = $request->validate(['name' => 'sometimes|string', 'email' => 'sometimes|email|unique:users,email,'.$user->id, 'status' => 'sometimes|string', 'avatar' => 'sometimes|nullable|string']);
        $user->update($data);
        return new UserResource($user);
    }
    public function updateStatus(Request $request, User $user) {
        $request->validate(['status' => 'required|string|in:Active,Away,Offline']);
        $user->update(['status' => $request->status]);
        broadcast(new \App\Events\AgentStatusChanged($user))->toOthers();
        return new UserResource($user);
    }
    public function profile(Request $request) { return new UserResource($request->user()->load('company')); }
    public function updateProfile(Request $request) {
        $user = $request->user();
        $data = $request->validate(['name' => 'sometimes|string', 'email' => 'sometimes|email|unique:users,email,'.$user->id, 'avatar' => 'sometimes|nullable|string']);
        $user->update($data);
        return new UserResource($user);
    }
    public function destroy(User $user) { $user->delete(); return response()->json(['message' => 'User deleted']); }
    public function store(Request $request) {
        $data = $request->validate(['name' => 'required|string', 'email' => 'required|email|unique:users', 'password' => 'required|string|min:8', 'role' => 'required|in:agent,admin', 'company_id' => 'nullable|exists:companies,id']);
        $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => \Hash::make($data['password']), 'role' => $data['role'], 'company_id' => $data['company_id'] ?? null]);
        return new UserResource($user);
    }
}
