<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('access_token', 64)->nullable()->unique()->after('ticket_number');
        });

        // Back-fill existing tickets
        DB::table('tickets')->whereNull('access_token')->chunkById(100, function ($tickets) {
            foreach ($tickets as $ticket) {
                DB::table('tickets')->where('id', $ticket->id)
                    ->update(['access_token' => Str::random(48)]);
            }
        });
    }

    public function down(): void {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('access_token');
        });
    }
};
