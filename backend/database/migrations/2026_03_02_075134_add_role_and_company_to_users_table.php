<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete()->after('id');
            $table->string('role')->default('agent')->after('email'); // agent, admin, superadmin
            $table->string('status')->default('Active')->after('role'); // Active, Away, Offline, Invited
            $table->string('avatar')->nullable()->after('status');
            $table->timestamp('last_active')->nullable()->after('avatar');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_id', 'role', 'status', 'avatar', 'last_active']);
        });
    }
};
