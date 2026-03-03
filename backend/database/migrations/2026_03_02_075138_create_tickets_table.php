<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->string('status')->default('open'); // open, pending, closed
            $table->string('priority')->default('medium'); // low, medium, high
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('tickets'); }
};
