<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OAuthClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'client_id',
        'client_secret',
        'redirect_uri',
        'scopes',
        'is_active',
    ];

    protected $casts = [
        'scopes' => 'array',
        'is_active' => 'boolean',
    ];

    protected $hidden = ['client_secret'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function authorizationCodes()
    {
        return $this->hasMany(OAuthAuthorizationCode::class);
    }

    public function accessTokens()
    {
        return $this->hasMany(OAuthAccessToken::class);
    }
}
