<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId("project_id")->constrained('projects')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('customer_email', 255)->nullable();
            $table->string('customer_name', 255)->nullable();
            $table->string('customer_id', 255)->nullable(); // anon user id from browser
            $table->enum('status', ['active', 'closed', 'waiting', 'ai_handling'])->default('active');
            $table->string('subject', 255)->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            
            $table->index('project_id');
            $table->index('agent_id');
            $table->index('status');
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
