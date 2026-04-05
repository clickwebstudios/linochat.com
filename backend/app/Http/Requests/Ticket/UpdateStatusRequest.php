<?php

namespace App\Http\Requests\Ticket;

use App\Enums\TicketStatus;
use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateStatusRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(TicketStatus::values())],
        ];
    }
}
