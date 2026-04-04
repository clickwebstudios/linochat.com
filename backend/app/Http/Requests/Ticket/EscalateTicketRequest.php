<?php

namespace App\Http\Requests\Ticket;

use App\Http\Requests\BaseRequest;

class EscalateTicketRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'escalate_to' => 'required|exists:users,id',
            'reason'      => 'nullable|string|max:1000',
        ];
    }
}
