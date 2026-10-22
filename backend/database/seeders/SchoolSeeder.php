<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $schools = [
            ['name' => 'Colégio do Zango', 'active' => true],
            ['name' => 'Colégio Talatona', 'active' => true],
            ['name' => 'Colégio Kilamba', 'active' => false],
        ];

        foreach ($schools as $school) {
            School::updateOrCreate(['name' => $school['name']], $school);
        }
    }
}
