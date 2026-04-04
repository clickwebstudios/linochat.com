<?php

namespace App\Http\Requests\Ticket;

use App\Enums\TicketPriority;
use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateTicketRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'subject'     => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'priority'    => ['sometimes', Rule::in(TicketPriority::values())],
            'category'    => 'sometimes|nullable|string',
        ];
    }
}
