<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Company extends Model {
    use HasFactory;
    protected $fillable = ['name', 'plan', 'notification_settings'];
    protected $casts = ['notification_settings' => 'array'];
    public function users() { return $this->hasMany(User::class); }
    public function projects() { return $this->hasMany(Project::class); }
    public function subscription() { return $this->hasOne(Subscription::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
}
