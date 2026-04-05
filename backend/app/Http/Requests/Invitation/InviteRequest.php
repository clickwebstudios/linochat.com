<?php

namespace App\Http\Requests\Invitation;

use App\Http\Requests\BaseRequest;

class InviteRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'email'      => 'required|email|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name'  => 'nullable|string|max:100',
        ];
    }
}
