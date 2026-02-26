<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained('chats')->onDelete('cascade');
            $table->string('customer_id', 255)->nullable();
            $table->string('customer_name', 255)->nullable();
            $table->foreignId('from_agent_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_agent_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->text('reason');
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('to_agent_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_transfers');
    }
};
