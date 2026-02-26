<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WipeProjectsAndUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:wipe-projects-users {--force : Skip confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove all projects and users (and their related data) from the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (!$this->option('force') && !$this->confirm('This will permanently delete all projects, users, and related data. Continue?')) {
            $this->info('Aborted.');
            return 0;
        }

        Schema::disableForeignKeyConstraints();

        try {
            // Delete in order to respect foreign keys
            $tables = [
                'chat_messages',
                'chat_transfers',
                'chats',
                'ticket_messages',
                'tickets',
                'kb_articles',
                'kb_categories',
                'invitations',
                'project_user',
                'projects',
                'user_notification_preferences',
                'user_availability_settings',
                'sessions',
                'users',
            ];

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    $count = DB::table($table)->count();
                    DB::table($table)->delete();
                    $this->line("Deleted {$count} rows from: {$table}");
                }
            }

            $this->info('All projects and users have been removed.');
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        return 0;
    }
}
