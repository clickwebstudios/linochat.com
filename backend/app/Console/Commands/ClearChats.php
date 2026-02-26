<?php

namespace App\Console\Commands;

use App\Models\Chat;
use Illuminate\Console\Command;

class ClearChats extends Command
{
    protected $signature = 'db:clear-chats {--force : Skip confirmation}';

    protected $description = 'Delete all chats and their messages';

    public function handle(): int
    {
        $count = Chat::count();

        if ($count === 0) {
            $this->info('No chats to clear.');
            return 0;
        }

        if (!$this->option('force') && !$this->confirm("This will permanently delete {$count} chat(s) and their messages. Continue?")) {
            $this->info('Aborted.');
            return 0;
        }

        Chat::query()->delete();

        $this->info("Cleared {$count} chat(s).");

        return 0;
    }
}
