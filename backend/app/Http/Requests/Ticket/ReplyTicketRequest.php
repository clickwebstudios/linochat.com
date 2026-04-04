<?php

namespace App\Http\Requests\Ticket;

use App\Http\Requests\BaseRequest;

class ReplyTicketRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'message'    => 'required|string|max:5000',
            'send_email' => 'boolean',
        ];
    }
}
