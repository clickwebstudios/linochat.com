<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            $table->string('resolution_type')->nullable()->after('status');
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('feedback')->nullable()->after('metadata');
        });
    }

    public function down(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            $table->dropColumn('resolution_type');
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn('feedback');
        });
    }
};
