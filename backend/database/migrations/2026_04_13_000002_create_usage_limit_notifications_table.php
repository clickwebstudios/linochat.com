<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_limit_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('limit_type', 30); // chats, tokens
            $table->string('threshold', 10);  // warning (80%), reached (100%)
            $table->date('billing_period_start');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->unique(['company_id', 'limit_type', 'threshold', 'billing_period_start'], 'usage_limit_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_limit_notifications');
    }
};
