<?php

namespace App\Providers;

use App\Models\PlatformSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

/**
 * Merges superadmin-configured integration values (stored in platform_settings)
 * into the live config() tree, so existing consumers (e.g. config('services.stripe.secret'))
 * transparently pick up DB overrides without knowing about platform_settings.
 *
 * Secrets are decrypted here. Missing/invalid values are silently skipped —
 * the baseline .env-derived config remains in place.
 */
class IntegrationConfigServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Skip if DB is not yet migrated (initial install/test boot before migrations run).
        try {
            if (!Schema::hasTable('platform_settings')) return;
        } catch (\Throwable $e) {
            return;
        }

        $registry = config('integrations', []);
        if (empty($registry)) return;

        $rows = [];
        try {
            $rows = DB::table('platform_settings')
                ->where('key', 'like', 'integrations.%')
                ->get(['key', 'value']);
        } catch (\Throwable $e) {
            return;
        }

        foreach ($rows as $row) {
            $provider = substr($row->key, strlen('integrations.'));
            $def = $registry[$provider] ?? null;
            if (!$def) continue;

            $saved = json_decode($row->value ?? 'null', true);
            if (!is_array($saved)) continue;

            $this->applyProvider($provider, $def, $saved);
        }
    }

    /**
     * Merge a single provider's saved values into config. Public so the
     * controller can re-apply after a save within the same request lifecycle.
     */
    public function applyProvider(string $provider, array $def, array $saved): void
    {
        $path = $def['config_path'] ?? null;
        if (!$path) return;

        $current = config($path) ?? [];

        foreach ($def['fields'] as $field) {
            $fkey = $field['key'];
            $val = Arr::get($saved, $fkey);
            if ($val === null || $val === '') continue;

            if (($field['secret'] ?? false) && is_array($val) && isset($val['_enc'])) {
                try {
                    $val = Crypt::decryptString($val['_enc']);
                } catch (\Throwable $e) {
                    continue;
                }
            }

            Arr::set($current, $fkey, $val);
        }

        Config::set($path, $current);
    }
}
