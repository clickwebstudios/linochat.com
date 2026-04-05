<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseRequest;

class SendVerificationCodeRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'email' => 'required|string|email|max:255',
        ];
    }
}
