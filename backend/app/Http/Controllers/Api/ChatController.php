<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Http\Resources\ChatResource;
use Illuminate\Http\Request;

class ChatController extends Controller {
    public function index(Request $request) {
        $user = auth('api')->user();
        $companyProjectIds = $user->isSuperadmin() ? null : $user->getCompanyProjectIds();
        $chats = Chat::query()
            ->when($companyProjectIds !== null, fn($q) => $q->whereIn('project_id', $companyProjectIds->isEmpty() ? [0] : $companyProjectIds))
            ->when($request->project_id, fn($q, $v) => $q->where('project_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->with('lastMessage', 'project')
            ->latest('last_message_at')
            ->paginate(50);
        return ChatResource::collection($chats);
    }
    public function show(Chat $chat) {
        $user = auth('api')->user();
        if (!$user->isSuperadmin() && !$user->getCompanyProjectIds()->contains($chat->project_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return new ChatResource($chat->load('project', 'assignedTo', 'lastMessage'));
    }
    public function store(Request $request) {
        $data = $request->validate(['project_id' => 'required|exists:projects,id', 'customer_name' => 'required|string', 'customer_avatar' => 'nullable|string', 'is_ai_bot' => 'boolean']);
        return new ChatResource(Chat::create($data));
    }
    public function update(Request $request, Chat $chat) {
        $chat->update($request->validate(['status' => 'sometimes|in:active,offline,closed', 'assigned_to' => 'nullable|exists:users,id']));
        return new ChatResource($chat);
    }
    public function destroy(Chat $chat) { $chat->delete(); return response()->json(['message' => 'Chat deleted']); }
}
