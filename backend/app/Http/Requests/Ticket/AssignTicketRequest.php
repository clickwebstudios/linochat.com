<?php

namespace App\Http\Requests\Ticket;

use App\Http\Requests\BaseRequest;

class AssignTicketRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'agent_id' => 'nullable|exists:users,id',
        ];
    }
}
