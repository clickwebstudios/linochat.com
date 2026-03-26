<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // #33: Add missing foreign keys to activity_logs (skip if already exists)
        $existingFks = collect(\DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))->pluck('CONSTRAINT_NAME')->all();

        if (!in_array('activity_logs_user_id_foreign', $existingFks)) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            });
        }
        if (!in_array('activity_logs_project_id_foreign', $existingFks)) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
            });
        }

        // #34 + #47: KB article changes (skip if already done)
        try {
            Schema::table('kb_articles', function (Blueprint $table) {
                $table->dropForeign(['author_id']);
                $table->foreign('author_id')->references('id')->on('users')->onDelete('set null');
            });
        } catch (\Exception $e) {
            // Already modified
        }

        try {
            Schema::table('kb_articles', function (Blueprint $table) {
                $table->dropIndex(['project_id', 'slug']);
                $table->unique(['project_id', 'slug'], 'kb_articles_project_slug_unique');
            });
        } catch (\Exception $e) {
            // Already modified
        }
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['project_id']);
        });

        Schema::table('kb_articles', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropUnique('kb_articles_project_slug_unique');
            $table->index(['project_id', 'slug']);
        });
    }
};
