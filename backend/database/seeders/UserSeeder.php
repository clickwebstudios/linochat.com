<?php
namespace Database\Seeders;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder {
    public function run(): void {
        // ── Superadmin (no company) ────────────────────────────────────────────
        User::create([
            'name'       => 'Super Admin',
            'email'      => 'superadmin@linochat.com',
            'password'   => Hash::make('password'),
            'role'       => 'superadmin',
            'status'     => 'Active',
            'company_id' => null,
        ]);

        // ── TechCorp Solutions — Admin + Agents ───────────────────────────────
        $techcorp = Company::where('name', 'TechCorp Solutions')->first();

        User::create([
            'name'       => 'Admin User',
            'email'      => 'admin@linochat.com',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'status'     => 'Active',
            'company_id' => $techcorp?->id,
        ]);

        $techcorpAgents = [
            ['name' => 'Sarah Chen',      'email' => 'sarah.chen@techcorp.com',      'status' => 'Active'],
            ['name' => 'Mike Johnson',    'email' => 'mike.johnson@techcorp.com',    'status' => 'Active'],
            ['name' => 'Emma Davis',      'email' => 'emma.davis@techcorp.com',      'status' => 'Away'],
            ['name' => 'James Wilson',    'email' => 'james.wilson@techcorp.com',    'status' => 'Active'],
            ['name' => 'Alex Rodriguez', 'email' => 'alex.rodriguez@techcorp.com', 'status' => 'Offline'],
        ];
        foreach ($techcorpAgents as $a) {
            User::create([
                'name'       => $a['name'],
                'email'      => $a['email'],
                'password'   => Hash::make('password'),
                'role'       => 'agent',
                'status'     => $a['status'],
                'company_id' => $techcorp?->id,
            ]);
        }

        // Easy-login demo agent for TechCorp
        User::create([
            'name'       => 'Demo Agent',
            'email'      => 'agent@linochat.com',
            'password'   => Hash::make('password'),
            'role'       => 'agent',
            'status'     => 'Active',
            'company_id' => $techcorp?->id,
        ]);

        // ── StartupXYZ — Admin + Agents ───────────────────────────────────────
        $startup = Company::where('name', 'StartupXYZ')->first();

        User::create([
            'name'       => 'Jake Miller',
            'email'      => 'admin@startupxyz.com',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'status'     => 'Active',
            'company_id' => $startup?->id,
        ]);

        $startupAgents = [
            ['name' => 'Priya Sharma',   'email' => 'priya@startupxyz.com',   'status' => 'Active'],
            ['name' => 'Leo Fischer',    'email' => 'leo@startupxyz.com',     'status' => 'Active'],
            ['name' => 'Nina Petrova',   'email' => 'nina@startupxyz.com',    'status' => 'Away'],
        ];
        foreach ($startupAgents as $a) {
            User::create([
                'name'       => $a['name'],
                'email'      => $a['email'],
                'password'   => Hash::make('password'),
                'role'       => 'agent',
                'status'     => $a['status'],
                'company_id' => $startup?->id,
            ]);
        }

        // ── Global Services Inc — Admin + Agents ──────────────────────────────
        $global = Company::where('name', 'Global Services Inc')->first();

        User::create([
            'name'       => 'Carlos Mendez',
            'email'      => 'admin@globalservices.com',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'status'     => 'Active',
            'company_id' => $global?->id,
        ]);

        $globalAgents = [
            ['name' => 'Yuki Tanaka',    'email' => 'yuki@globalservices.com',   'status' => 'Active'],
            ['name' => 'Amir Hassan',    'email' => 'amir@globalservices.com',   'status' => 'Active'],
        ];
        foreach ($globalAgents as $a) {
            User::create([
                'name'       => $a['name'],
                'email'      => $a['email'],
                'password'   => Hash::make('password'),
                'role'       => 'agent',
                'status'     => $a['status'],
                'company_id' => $global?->id,
            ]);
        }
    }
}
