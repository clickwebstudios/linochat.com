<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_settings_versions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->json('settings');
            $table->string('status')->default('draft');
            $table->unsignedInteger('version_number')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('published_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'version_number']);
        });

        // Seed initial published versions for projects that already have ai_settings
        DB::table('projects')->whereNotNull('ai_settings')->get()->each(function ($project) {
            DB::table('ai_settings_versions')->insert([
                'project_id' => $project->id,
                'settings' => $project->ai_settings,
                'status' => 'published',
                'version_number' => 1,
                'published_at' => $project->updated_at,
                'published_by' => $project->user_id,
                'created_by' => $project->user_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_settings_versions');
    }
};
