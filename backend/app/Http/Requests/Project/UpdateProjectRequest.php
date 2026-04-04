<?php

namespace App\Http\Requests\Project;

use App\Http\Requests\BaseRequest;

class UpdateProjectRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'website'     => 'sometimes|url|max:512',
            'color'       => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:active,inactive,archived',
        ];
    }
}
