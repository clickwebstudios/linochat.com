<?php
namespace Database\Seeders;
use App\Models\Project;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder {
    public function run(): void {
        // ── TechCorp Solutions ────────────────────────────────────────────────
        $techcorp = Company::where('name', 'TechCorp Solutions')->first();
        $techAgents = User::where('role', 'agent')->where('company_id', $techcorp?->id)->get();

        $techProjects = [
            ['name' => 'E-Commerce Site',      'color' => '#3b82f6', 'description' => 'Main e-commerce platform support',    'website' => 'https://clickwebstudio.com'],
            ['name' => 'Mobile App Support',   'color' => '#10b981', 'description' => 'iOS and Android app support channel', 'website' => 'https://app.techcorp.com'],
            ['name' => 'Enterprise Dashboard', 'color' => '#f59e0b', 'description' => 'B2B dashboard support',               'website' => 'https://dashboard.techcorp.com'],
            ['name' => 'API Documentation',    'color' => '#8b5cf6', 'description' => 'Developer API support',               'website' => 'https://api.techcorp.com'],
            ['name' => 'Customer Portal',      'color' => '#ef4444', 'description' => 'Customer self-service portal',        'website' => 'https://portal.techcorp.com'],
        ];
        foreach ($techProjects as $data) {
            $project = Project::create(array_merge($data, ['company_id' => $techcorp?->id]));
            if ($techAgents->isNotEmpty()) {
                $project->members()->attach($techAgents->random(min(3, $techAgents->count()))->pluck('id'));
            }
        }

        // ── StartupXYZ ────────────────────────────────────────────────────────
        $startup = Company::where('name', 'StartupXYZ')->first();
        $startupAgents = User::where('role', 'agent')->where('company_id', $startup?->id)->get();

        $startupProjects = [
            ['name' => 'Web Platform',   'color' => '#06b6d4', 'description' => 'Core SaaS web platform support',    'website' => 'https://app.startupxyz.com'],
            ['name' => 'Marketing Site', 'color' => '#f97316', 'description' => 'Marketing and landing page queries', 'website' => 'https://startupxyz.com'],
            ['name' => 'Integrations',   'color' => '#a855f7', 'description' => 'Third-party integration support',   'website' => 'https://integrations.startupxyz.com'],
        ];
        foreach ($startupProjects as $data) {
            $project = Project::create(array_merge($data, ['company_id' => $startup?->id]));
            if ($startupAgents->isNotEmpty()) {
                $project->members()->attach($startupAgents->random(min(2, $startupAgents->count()))->pluck('id'));
            }
        }

        // ── Global Services Inc ───────────────────────────────────────────────
        $global = Company::where('name', 'Global Services Inc')->first();
        $globalAgents = User::where('role', 'agent')->where('company_id', $global?->id)->get();

        $globalProjects = [
            ['name' => 'Client Portal',  'color' => '#14b8a6', 'description' => 'Client-facing support portal', 'website' => 'https://portal.globalservices.com'],
            ['name' => 'Internal Tools', 'color' => '#64748b', 'description' => 'Internal staff support',       'website' => 'https://internal.globalservices.com'],
        ];
        foreach ($globalProjects as $data) {
            $project = Project::create(array_merge($data, ['company_id' => $global?->id]));
            if ($globalAgents->isNotEmpty()) {
                $project->members()->attach($globalAgents->pluck('id'));
            }
        }
    }
}
