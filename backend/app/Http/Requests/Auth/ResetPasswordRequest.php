<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseRequest;

class ResetPasswordRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
