<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $fillable = ['company_id', 'type', 'title', 'body', 'recipient', 'status'];

    public function company() { return $this->belongsTo(Company::class); }

    public static function record(string $type, string $title, string $body, string $recipient, string $status = 'sent', ?int $companyId = null): self
    {
        return self::create([
            'company_id' => $companyId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'recipient' => $recipient,
            'status' => $status,
        ]);
    }
}
