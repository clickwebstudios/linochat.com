<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->json('widget_settings')->nullable()->after('color');
            $table->timestamp('settings_updated_at')->nullable()->after('widget_settings');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['widget_settings', 'settings_updated_at']);
        });
    }
};
