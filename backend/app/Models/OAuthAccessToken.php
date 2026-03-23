<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OAuthAccessToken extends Model
{
    protected $table = 'oauth_access_tokens';

    protected $fillable = [
        'oauth_client_id',
        'user_id',
        'token',
        'scopes',
        'expires_at',
        'revoked_at',
    ];

    protected $casts = [
        'scopes' => 'array',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(OAuthClient::class, 'oauth_client_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isValid(): bool
    {
        return is_null($this->revoked_at) && $this->expires_at->isFuture();
    }
}
