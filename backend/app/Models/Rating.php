<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
     use HasFactory;

    public $timestamps = false;
    protected $fillable = [
        'service_session_id', 'stars', 'comment', 'device_hash', 'ip_hash',
        'invalidated_at', 'invalidated_by', 'invalidation_reason',
    ];

    protected $casts = [
        'stars' => 'integer',
        'invalidated_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function serviceSession() { return $this->belongsTo(ServiceSession::class); }
    public function invalidatedBy() { return $this->belongsTo(User::class, 'invalidated_by'); }
}
