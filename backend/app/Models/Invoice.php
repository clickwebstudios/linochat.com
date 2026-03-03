<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model {
    protected $fillable = ['company_id', 'amount', 'status', 'issued_at'];
    protected $casts = ['issued_at' => 'datetime', 'amount' => 'decimal:2'];
    public function company() { return $this->belongsTo(Company::class); }
}
