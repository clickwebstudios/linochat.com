<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PublicTicketController extends Controller
{
    /**
     * View a ticket by its access token (no auth required).
     */
    public function show(string $token)
    {
        $ticket = Ticket::with(['project', 'messages'])
            ->where('access_token', $token)
            ->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'ticket_number' => $ticket->ticket_number,
                'subject'       => $ticket->subject,
                'description'   => $ticket->description,
                'status'        => $ticket->status,
                'priority'      => $ticket->priority,
                'category'      => $ticket->category,
                'customer_name' => $ticket->customer_name,
                'created_at'    => $ticket->created_at,
                'updated_at'    => $ticket->updated_at,
                'project_name'  => $ticket->project?->name,
                'messages'      => $ticket->messages
                    ->where('sender_type', '!=', 'internal')
                    ->map(fn ($m) => [
                        'id'          => $m->id,
                        'content'     => $m->content,
                        'sender_type' => $m->sender_type, // 'agent' | 'customer' | 'system'
                        'created_at'  => $m->created_at,
                    ])
                    ->values(),
            ],
        ]);
    }

    /**
     * Customer replies to their ticket (no auth required, just the token).
     */
    public function reply(Request $request, string $token)
    {
        $ticket = Ticket::where('access_token', $token)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        if ($ticket->status === 'closed') {
            return response()->json(['success' => false, 'message' => 'This ticket is closed'], 422);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'customer',
            'sender_id'   => $ticket->customer_email,
            'content'     => $request->input('message'),
        ]);

        // Reopen if it was pending
        if ($ticket->status === 'pending') {
            $ticket->update(['status' => 'open']);
        }

        return response()->json(['success' => true, 'message' => 'Reply sent']);
    }
}
