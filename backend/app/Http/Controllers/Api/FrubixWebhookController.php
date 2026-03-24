<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Project;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FrubixWebhookController extends Controller
{
    /**
     * Handle incoming Frubix webhook events.
     * Public endpoint verified by X-Frubix-Signature header.
     */
    public function handle(Request $request)
    {
        $event = $request->input('event');
        $payload = $request->input('data', []);
        $projectId = $request->input('project_id');

        if (!$event || !$projectId) {
            return response()->json(['success' => false, 'message' => 'Missing event or project_id'], 422);
        }

        // Find the project with active Frubix integration
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $frubixConfig = $project->integrations['frubix'] ?? null;
        if (!$frubixConfig || empty($frubixConfig['enabled'])) {
            return response()->json(['success' => false, 'message' => 'Frubix not connected for this project'], 400);
        }

        // Verify webhook signature (required — fail closed if no secret configured)
        $secret = $frubixConfig['webhook_secret'] ?? null;
        if (!$secret) {
            Log::error('Frubix webhook rejected: no webhook_secret configured', ['project_id' => $projectId]);
            return response()->json(['success' => false, 'message' => 'Webhook secret not configured'], 403);
        }
        $signature = $request->header('X-Frubix-Signature');
        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        if (!$signature || !hash_equals($expected, $signature)) {
            Log::warning('Frubix webhook signature mismatch', ['project_id' => $projectId]);
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 403);
        }

        Log::info('Frubix webhook received', ['event' => $event, 'project_id' => $projectId]);

        try {
            match ($event) {
                'appointment.created'   => $this->handleAppointmentCreated($project, $payload),
                'appointment.updated'   => $this->handleAppointmentUpdated($project, $payload),
                'appointment.cancelled' => $this->handleAppointmentCancelled($project, $payload),
                'lead.updated'          => $this->handleLeadUpdated($project, $payload),
                default                 => Log::info('Frubix webhook: unhandled event', ['event' => $event]),
            };
        } catch (\Exception $e) {
            Log::error('Frubix webhook processing failed', ['event' => $event, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Processing failed'], 500);
        }

        return response()->json(['success' => true]);
    }

    private function handleAppointmentCreated(Project $project, array $data): void
    {
        $this->addSystemMessageToChat($project, $data, 'appointment_created',
            'Appointment scheduled' . ($data['scheduled_date'] ?? '' ? ' for ' . ($data['scheduled_date'] ?? '') : '') . '.'
        );
    }

    private function handleAppointmentUpdated(Project $project, array $data): void
    {
        $this->addSystemMessageToChat($project, $data, 'appointment_updated',
            'Appointment rescheduled' . ($data['scheduled_date'] ?? '' ? ' to ' . ($data['scheduled_date'] ?? '') : '') . '.'
        );
    }

    private function handleAppointmentCancelled(Project $project, array $data): void
    {
        $this->addSystemMessageToChat($project, $data, 'appointment_cancelled',
            'Appointment cancelled.'
        );
    }

    private function handleLeadUpdated(Project $project, array $data): void
    {
        $email = $data['email'] ?? null;
        if (!$email) return;

        // Find ticket by customer email and update status if lead status changed
        $leadStatus = $data['status'] ?? null;
        if ($leadStatus) {
            $ticket = Ticket::where('project_id', $project->id)
                ->where('customer_email', $email)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($ticket) {
                $ticket->update([
                    'metadata' => array_merge($ticket->metadata ?? [], ['frubix_lead_status' => $leadStatus]),
                ]);
                Log::info('Frubix lead status synced to ticket', ['ticket_id' => $ticket->id, 'status' => $leadStatus]);
            }
        }
    }

    private function addSystemMessageToChat(Project $project, array $data, string $type, string $message): void
    {
        $email = $data['customer_email'] ?? $data['email'] ?? null;
        $phone = $data['customer_phone'] ?? $data['phone'] ?? null;

        if (!$email && !$phone) return;

        // Find the most recent active chat for this customer
        $query = Chat::where('project_id', $project->id)
            ->whereIn('status', ['active', 'waiting', 'ai_handling']);

        if ($email) {
            $query->where('customer_email', $email);
        }

        $chat = $query->orderBy('updated_at', 'desc')->first();
        if (!$chat) return;

        ChatMessage::create([
            'chat_id'     => $chat->id,
            'sender_type' => 'system',
            'content'     => "[Frubix] {$message}",
        ]);
    }
}
