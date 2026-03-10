<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('ticket_number')->nullable()->unique()->after('id');
            $table->unsignedBigInteger('chat_id')->nullable()->after('project_id');
        });

        // Back-fill existing tickets
        $tickets = DB::table('tickets')->orderBy('id')->get();
        foreach ($tickets as $ticket) {
            $year = date('Y', strtotime($ticket->created_at));
            $number = 'TKT-' . $year . '-' . str_pad($ticket->id, 5, '0', STR_PAD_LEFT);
            DB::table('tickets')->where('id', $ticket->id)->update(['ticket_number' => $number]);
        }
    }

    public function down(): void {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['ticket_number', 'chat_id']);
        });
    }
};
