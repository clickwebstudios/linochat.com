<?php

namespace App\Http\Requests\Ticket;

use App\Enums\TicketPriority;
use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'project_id'     => 'required|exists:projects,id',
            'customer_email' => 'required|email',
            'customer_name'  => 'nullable|string',
            'subject'        => 'required|string|max:255',
            'description'    => 'required|string',
            'priority'       => ['nullable', Rule::in(TicketPriority::values())],
            'category'       => 'nullable|string',
            'assigned_to'    => 'nullable|exists:users,id',
            'chat_id'        => 'nullable|exists:chats,id',
        ];
    }
}
