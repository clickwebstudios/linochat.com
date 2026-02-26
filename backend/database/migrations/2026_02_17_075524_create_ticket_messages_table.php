<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->enum('sender_type', ['customer', 'agent']);
            $table->string('sender_id', 255)->nullable(); // user_id or email
            $table->longText('content');
            $table->json('metadata')->nullable(); // email headers, attachments
            $table->timestamps();
            
            $table->index('ticket_id');
            $table->index('sender_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_messages');
    }
};
