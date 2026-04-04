<?php

namespace App\Http\Requests\Agent;

use App\Http\Requests\BaseRequest;

class SendMessageRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'message' => 'required|string|max:5000',
        ];
    }
}
