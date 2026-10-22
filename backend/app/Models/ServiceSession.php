<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceSession extends Model
{
    use HasFactory;

    protected $table = 'service_sessions';
    protected $fillable = [
        'technician_id',
        'school_id',
        'token_hash',
        'expires_at',
        'max_ratings',
        'revoked_at',
    ];
    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'max_ratings' => 'integer',
    ];

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
    public function school()
    {
        return $this->belongsTo(School::class);
    }
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
    public function validRatings()
    {
        return $this->ratings()->whereNull('invalidated_at');
    }
}
