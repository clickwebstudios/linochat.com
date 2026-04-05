<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('token_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('action_type');
            $table->bigInteger('tokens_amount');
            $table->unsignedBigInteger('balance_after');
            $table->string('reference_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->index('company_id');
            $table->index(['company_id', 'action_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('token_transactions');
    }
};
