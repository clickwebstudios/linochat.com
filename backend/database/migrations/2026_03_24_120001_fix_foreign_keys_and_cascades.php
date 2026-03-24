<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // #33: Add missing foreign keys to activity_logs
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });

        // #34: Change KB article author cascade from DELETE to SET NULL
        Schema::table('kb_articles', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->onDelete('set null');
        });

        // #47: Add unique constraint on (project_id, slug) to prevent duplicate slugs
        Schema::table('kb_articles', function (Blueprint $table) {
            $table->dropIndex(['project_id', 'slug']); // drop existing non-unique index
            $table->unique(['project_id', 'slug'], 'kb_articles_project_slug_unique');
        });
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
