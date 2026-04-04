<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseRequest;

class ForgotPasswordRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
        ];
    }
}
