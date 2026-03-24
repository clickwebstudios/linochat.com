<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // #21: Index for unread message count queries
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->index(['chat_id', 'sender_type', 'read_at'], 'chat_messages_unread_idx');
        });

        // #29: Index for chat ordering
        Schema::table('chats', function (Blueprint $table) {
            $table->index('last_message_at');
        });

        // #29: Index for ticket date queries
        Schema::table('tickets', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex('chat_messages_unread_idx');
        });
        Schema::table('chats', function (Blueprint $table) {
            $table->dropIndex(['last_message_at']);
        });
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });
    }
};
