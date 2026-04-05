<?php

namespace App\Http\Requests\Invitation;

use App\Http\Requests\BaseRequest;

class AcceptRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'password'   => 'required|string|min:8|confirmed',
        ];
    }
}
