<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kb_articles', function (Blueprint $table) {
            $table->string('source_url')->nullable()->after('status')->comment('URL источника контента для AI-генерации');
            $table->boolean('is_ai_generated')->default(false)->after('source_url')->comment('Флаг AI-генерации');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kb_articles', function (Blueprint $table) {
            $table->dropColumn(['source_url', 'is_ai_generated']);
        });
    }
};
