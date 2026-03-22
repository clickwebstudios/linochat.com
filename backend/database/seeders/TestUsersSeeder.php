<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Seed test users for each role.
     */
    public function run(): void
    {
        // Test Superadmin
        User::updateOrCreate(
            ['email' => 'superadmin@test.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'Superadmin',
                'password' => Hash::make('password123'),
                'role' => 'superadmin',
                'status' => 'Active',
                'email_verified_at' => now(),
                'join_date' => now(),
            ]
        );

        // Test Admin
        User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'Active',
                'email_verified_at' => now(),
                'join_date' => now(),
            ]
        );

        // Test Agent
        User::updateOrCreate(
            ['email' => 'agent@test.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'Agent',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'status' => 'Active',
                'email_verified_at' => now(),
                'join_date' => now(),
            ]
        );

        $this->command->info('Test users created successfully!');
        $this->command->info('superadmin@test.com / password123');
        $this->command->info('admin@test.com     / password123');
        $this->command->info('agent@test.com     / password123');
    }
}
