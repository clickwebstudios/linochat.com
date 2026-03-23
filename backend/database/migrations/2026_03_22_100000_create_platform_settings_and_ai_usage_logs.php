<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('chat_id');
            $table->string('model', 50);
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->decimal('base_cost', 10, 6)->default(0);
            $table->decimal('charged_cost', 10, 6)->default(0);
            $table->timestamps();

            $table->index(['project_id', 'created_at']);
            $table->index(['chat_id']);
        });

        // Seed default AI pricing
        \DB::table('platform_settings')->insert([
            'key' => 'ai_pricing',
            'value' => json_encode([
                'gpt-4o' => [
                    'mode' => 'markup',
                    'markup_percent' => 200,
                    'fixed_price' => 0.10,
                    'base_cost_input_per_1m' => 2.50,
                    'base_cost_output_per_1m' => 10.00,
                ],
                'gpt-4o-mini' => [
                    'mode' => 'markup',
                    'markup_percent' => 200,
                    'fixed_price' => 0.01,
                    'base_cost_input_per_1m' => 0.15,
                    'base_cost_output_per_1m' => 0.60,
                ],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('platform_settings');
    }
};
