<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;


    protected $fillable = [
        'project_id',
        'assigned_to',
        'customer_email',
        'customer_name',
        'subject',
        'description',
        'status',
        'priority',
        'category',
        'resolved_at',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class);
    }
}
