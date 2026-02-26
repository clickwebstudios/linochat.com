<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kb_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('kb_categories')->onDelete('cascade');
            $table->foreignId("project_id")->constrained('projects')->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->string('title', 255);
            $table->string('slug', 255);
            $table->longText('content');
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->boolean('is_published')->default(true);
            $table->integer('views')->default(0);
            $table->integer('views_count')->default(0);
            $table->integer('helpful_count')->default(0);
            $table->integer('not_helpful_count')->default(0);
            $table->timestamps();
            
            $table->index(['project_id', 'slug']);
            $table->index(['project_id', 'status']);
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kb_articles');
    }
};
