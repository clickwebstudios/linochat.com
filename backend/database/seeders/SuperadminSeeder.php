<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperadminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update superadmin
        User::updateOrCreate(
            ['email' => 'info@clickwebstudio.com'],
            [
                'first_name' => 'ClickWeb',
                'last_name' => 'Studio',
                'password' => Hash::make('z4ynP$G@n3!Fe%V59%M5'),
                'role' => 'superadmin',
                'status' => 'active',
                'email_verified_at' => now(),
                'join_date' => now(),
            ]
        );

        $this->command->info('Superadmin created successfully!');
        $this->command->info('Email: info@clickwebstudio.com');
    }
}
