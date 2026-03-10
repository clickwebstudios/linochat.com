<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('original_name');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size');
            $table->string('file_type', 20);
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->unsignedBigInteger('kb_article_id')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_documents');
    }
};
