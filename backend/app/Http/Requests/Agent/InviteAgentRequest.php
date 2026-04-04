<?php

namespace App\Http\Requests\Agent;

use App\Http\Requests\BaseRequest;

class InviteAgentRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'email'        => 'required|email|max:255',
            'first_name'   => 'nullable|string|max:100',
            'last_name'    => 'nullable|string|max:100',
            'role'         => 'nullable|string|in:agent,admin',
            'project_ids'  => 'required|array',
            'project_ids.*'=> 'required|string|exists:projects,id',
        ];
    }
}
