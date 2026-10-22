<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'active'];
    protected $casts = ['active' => 'boolean'];

    public function serviceSessions()
    {
        return $this->hasMany(ServiceSession::class);
    }
}
