<?php

namespace App\Http\Requests\Project;

use App\Http\Requests\BaseRequest;

class StoreProjectRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'website'     => 'required|url|max:512',
            'color'       => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'description' => 'nullable|string',
        ];
    }
}
