<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TechnicianSeeder extends Seeder
{
    public function run(): void
    {
        $placeholder = 'technical/placeholder.jpg';
        if (! Storage::disk('public')->exists($placeholder)) {
            Storage::disk('public')->makeDirectory('technical');
            $jpeg = base64_decode(
                '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'
                    . 'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAA'
                    . 'AAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAA'
                    . 'AP/aAAwDAQACEQMRAD8AmwA/9k='
            );
            Storage::disk('public')->put($placeholder, $jpeg);
        }

        $technicians = [
            ['name' => 'João Técnico',  'email' => 'joao@exemplo.com',  'active' => true],
            ['name' => 'Maria Silva',   'email' => 'maria@exemplo.com', 'active' => true],
            ['name' => 'Pedro Costa',   'email' => 'pedro@exemplo.com', 'active' => false],
        ];

        foreach ($technicians as $technician) {
            User::updateOrCreate(
                ['email' => $technician['email']],
                [
                    'name' => $technician['name'],
                    'password' => Hash::make('password'),
                    'role' => Role::Technician,
                    'active' => $technician['active'],
                    'photo_path' => $placeholder,
                ]
            );
        }
    }
}
