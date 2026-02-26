<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained('chats')->onDelete('cascade');
            $table->enum('sender_type', ['customer', 'agent', 'ai', 'system']);
            $table->string('sender_id', 255)->nullable(); // user_id or customer_id
            $table->longText('content');
            $table->boolean('is_ai')->default(false);
            $table->json('metadata')->nullable(); // for AI context, attachments, etc.
            $table->timestamps();
            
            $table->index('chat_id');
            $table->index('sender_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
