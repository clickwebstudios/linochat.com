<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Http\Resources\ChatMessageResource;
use App\Events\MessageSent;
use Illuminate\Http\Request;

class ChatMessageController extends Controller {
    public function index(Chat $chat) {
        $messages = $chat->messages()->oldest()->paginate(100);
        return ChatMessageResource::collection($messages);
    }
    public function store(Request $request, Chat $chat) {
        $data = $request->validate(['sender' => 'required|in:customer,agent,system', 'text' => 'required|string']);
        $message = $chat->messages()->create($data);
        $chat->update(['last_message_at' => now()]);
        broadcast(new MessageSent($message))->toOthers();
        return new ChatMessageResource($message);
    }
}
