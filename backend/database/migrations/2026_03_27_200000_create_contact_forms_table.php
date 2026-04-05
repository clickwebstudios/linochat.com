<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->json('fields');
            $table->boolean('is_active')->default(true);
            $table->string('submit_button_text')->default('Submit');
            $table->string('success_message')->default('Thank you! We will get back to you soon.');
            $table->timestamps();

            $table->index('project_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_forms');
    }
};
