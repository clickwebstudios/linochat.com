<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactForm;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\ActivityLog;
use App\Models\NotificationLog;
use App\Mail\TicketCreatedMail;
use App\Mail\NewTicketMail;
use App\Services\FrubixService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ContactFormController extends Controller
{
    /**
     * List contact forms for user's projects.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $projectIds = $user->getCompanyProjectIds();

        $forms = ContactForm::whereIn('project_id', $projectIds)
            ->with('project:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $forms]);
    }

    /**
     * Create a new contact form.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'project_id' => 'required|exists:projects,id',
            'fields' => 'required|array',
            'fields.*.key' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.enabled' => 'required|boolean',
            'fields.*.required' => 'required|boolean',
            'is_active' => 'boolean',
            'submit_button_text' => 'nullable|string|max:100',
            'success_message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $form = ContactForm::create($request->only([
            'name', 'project_id', 'fields', 'is_active', 'submit_button_text', 'success_message',
        ]));

        $form->load('project:id,name');

        return response()->json(['success' => true, 'data' => $form], 201);
    }

    /**
     * Show a single contact form.
     */
    public function show(Request $request, string $id)
    {
        $form = ContactForm::with('project:id,name')->findOrFail($id);

        return response()->json(['success' => true, 'data' => $form]);
    }

    /**
     * Update a contact form.
     */
    public function update(Request $request, string $id)
    {
        $form = ContactForm::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'project_id' => 'sometimes|exists:projects,id',
            'fields' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
            'submit_button_text' => 'nullable|string|max:100',
            'success_message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $form->update($request->only([
            'name', 'project_id', 'fields', 'is_active', 'submit_button_text', 'success_message',
        ]));

        $form->load('project:id,name');

        return response()->json(['success' => true, 'data' => $form]);
    }

    /**
     * Delete a contact form.
     */
    public function destroy(string $id)
    {
        $form = ContactForm::findOrFail($id);
        $form->delete();

        return response()->json(['success' => true, 'message' => 'Form deleted']);
    }

    /**
     * Public: get form config for rendering (no auth).
     */
    public function showPublic(string $slug)
    {
        $form = ContactForm::where('slug', $slug)->where('is_active', true)->first();

        if (!$form) {
            return response()->json(['success' => false, 'message' => 'Form not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $form->name,
                'fields' => $form->fields,
                'submit_button_text' => $form->submit_button_text,
                'success_message' => $form->success_message,
            ],
        ]);
    }

    /**
     * Public: handle form submission — creates a ticket (no auth).
     */
    public function submit(Request $request, string $slug)
    {
        $form = ContactForm::where('slug', $slug)->where('is_active', true)->first();

        if (!$form) {
            return response()->json(['success' => false, 'message' => 'Form not found'], 404);
        }

        // Build dynamic validation rules from the form's field config
        $rules = [];
        foreach ($form->fields as $field) {
            if (!$field['enabled']) {
                continue;
            }
            $rule = $field['required'] ? 'required' : 'nullable';
            if ($field['key'] === 'email') {
                $rule .= '|email|max:255';
            } elseif ($field['key'] === 'message') {
                $rule .= '|string';
            } else {
                $rule .= '|string|max:255';
            }
            $rules[$field['key']] = $rule;
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Create ticket
        $ticket = Ticket::create([
            'project_id' => $form->project_id,
            'customer_email' => $data['email'] ?? 'unknown@unknown.com',
            'customer_name' => $data['name'] ?? null,
            'customer_phone' => $data['phone'] ?? null,
            'subject' => $data['subject'] ?? 'Contact Form Submission',
            'description' => $data['message'] ?? ($data['subject'] ?? 'Contact form submission from ' . ($data['name'] ?? $data['email'] ?? 'visitor')),
            'priority' => 'medium',
            'status' => 'open',
            'category' => 'contact-form',
        ]);

        $ticket->refresh();

        // Create initial ticket message
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_id' => $data['email'] ?? 'unknown',
            'content' => $this->buildMessageContent($data, $form),
        ]);

        // Send emails and log activity
        $project = Project::find($form->project_id);
        $companyId = $project->company_id ?? null;

        // Customer confirmation email
        try {
            $ticketUrl = config('app.frontend_url', 'http://localhost:5174') . '/ticket/' . $ticket->access_token;
            Mail::to($ticket->customer_email)->send(new TicketCreatedMail($ticket, $project->name ?? 'Support', $ticketUrl));
            NotificationLog::record('email', 'Ticket Created — Customer', "Ticket #{$ticket->ticket_number} created via contact form", $ticket->customer_email, 'sent', $companyId);
        } catch (\Exception $e) {
            Log::error('Failed to send ticket email from contact form', ['error' => $e->getMessage()]);
        }

        // Admin notification emails
        if ($project) {
            $adminEmails = $project->agents()->pluck('email')->filter()->toArray();
            if ($project->user && $project->user->email) {
                $adminEmails[] = $project->user->email;
            }
            foreach (array_unique($adminEmails) as $adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new NewTicketMail($ticket));
                    NotificationLog::record('email', 'New Ticket — Admin', "Contact form ticket #{$ticket->ticket_number}", $adminEmail, 'sent', $companyId);
                } catch (\Exception $e) {
                    Log::error('Failed to send admin ticket email', ['email' => $adminEmail, 'error' => $e->getMessage()]);
                }
            }
        }

        // Activity log
        ActivityLog::log('ticket_created', "Ticket #{$ticket->ticket_number} created via contact form", "{$ticket->customer_name} — {$ticket->subject}", [
            'company_id' => $companyId,
            'project_id' => $form->project_id,
        ]);

        // Frubix lead
        if ($project) {
            $frubixConfig = $project->integrations['frubix'] ?? null;
            if ($frubixConfig && !empty($frubixConfig['enabled']) && !empty($frubixConfig['access_token'])) {
                try {
                    FrubixService::createLead($frubixConfig, [
                        'name' => $ticket->customer_name ?: explode('@', $ticket->customer_email)[0],
                        'email' => $ticket->customer_email,
                        'phone' => $ticket->customer_phone ?? null,
                        'source' => 'linochat',
                        'status' => 'new',
                        'notes' => "[LinoChat Contact Form] {$ticket->subject}\n\n{$ticket->description}",
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to create Frubix lead from contact form', ['error' => $e->getMessage()]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => $form->success_message,
        ]);
    }

    private function buildMessageContent(array $data, ContactForm $form): string
    {
        $lines = ["Submitted via contact form: {$form->name}"];
        foreach ($form->fields as $field) {
            if ($field['enabled'] && isset($data[$field['key']]) && $data[$field['key']]) {
                $lines[] = "{$field['label']}: {$data[$field['key']]}";
            }
        }
        return implode("\n", $lines);
    }
}
