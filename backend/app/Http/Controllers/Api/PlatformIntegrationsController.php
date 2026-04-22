<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class PlatformIntegrationsController extends Controller
{
    private function ensureSuperadmin()
    {
        $user = auth('api')->user();
        if (!$user || $user->role !== 'superadmin') {
            abort(response()->json(['success' => false, 'message' => 'Unauthorized'], 403));
        }
        return $user;
    }

    private function registry(): array
    {
        return config('integrations', []);
    }

    public function index()
    {
        $this->ensureSuperadmin();

        $items = [];
        foreach ($this->registry() as $key => $def) {
            $items[] = $this->present($key, $def);
        }
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(string $provider)
    {
        $this->ensureSuperadmin();
        $def = $this->registry()[$provider] ?? null;
        if (!$def) {
            return response()->json(['success' => false, 'message' => 'Unknown integration'], 404);
        }
        return response()->json(['success' => true, 'data' => $this->present($provider, $def)]);
    }

    public function update(Request $request, string $provider)
    {
        $user = $this->ensureSuperadmin();
        $def = $this->registry()[$provider] ?? null;
        if (!$def) {
            return response()->json(['success' => false, 'message' => 'Unknown integration'], 404);
        }

        $input = $request->input('fields', []);
        if (!is_array($input)) {
            return response()->json(['success' => false, 'message' => 'fields must be an object'], 422);
        }

        // Load existing saved values so we can preserve secrets the client did not re-send.
        $existing = PlatformSetting::getValue("integrations.{$provider}", []) ?: [];
        $next = [];

        foreach ($def['fields'] as $field) {
            $fkey = $field['key'];
            $provided = Arr::has($input, $fkey);
            $value = Arr::get($input, $fkey);

            if ($field['secret'] ?? false) {
                // If client sent empty/null AND field was provided, treat as "clear".
                // If client did not include the key at all, keep existing.
                if (!$provided) {
                    if (Arr::has($existing, $fkey)) {
                        Arr::set($next, $fkey, Arr::get($existing, $fkey));
                    }
                    continue;
                }
                if ($value === null || $value === '') {
                    continue; // cleared
                }
                // Skip "masked" placeholders the UI may send back unchanged.
                if (is_string($value) && str_starts_with($value, '••••')) {
                    if (Arr::has($existing, $fkey)) {
                        Arr::set($next, $fkey, Arr::get($existing, $fkey));
                    }
                    continue;
                }
                try {
                    Arr::set($next, $fkey, ['_enc' => Crypt::encryptString((string) $value)]);
                } catch (\Throwable $e) {
                    Log::warning('Integration encrypt failed', ['provider' => $provider, 'field' => $fkey]);
                }
            } else {
                if (!$provided) {
                    if (Arr::has($existing, $fkey)) {
                        Arr::set($next, $fkey, Arr::get($existing, $fkey));
                    }
                    continue;
                }
                if ($value === null || $value === '') {
                    continue;
                }
                Arr::set($next, $fkey, $value);
            }
        }

        PlatformSetting::setValue("integrations.{$provider}", $next, $user->id);

        // Apply to live config immediately so subsequent requests in same app boot see it.
        app(\App\Providers\IntegrationConfigServiceProvider::class)
            ->applyProvider($provider, $def, $next);

        return response()->json([
            'success' => true,
            'data' => $this->present($provider, $def),
            'message' => 'Integration saved',
        ]);
    }

    private function present(string $key, array $def): array
    {
        $saved = PlatformSetting::getValue("integrations.{$key}", []) ?: [];
        $values = [];
        $configured = true;
        $hasAnyValue = false;

        foreach ($def['fields'] as $field) {
            $fkey = $field['key'];
            $savedVal = Arr::get($saved, $fkey);
            $envVal = Arr::get(config($def['config_path']) ?? [], $fkey);

            if ($field['secret'] ?? false) {
                // For secrets, never return plaintext — just a masked preview.
                $plain = null;
                if (is_array($savedVal) && isset($savedVal['_enc'])) {
                    try {
                        $plain = Crypt::decryptString($savedVal['_enc']);
                    } catch (\Throwable $e) {
                        $plain = null;
                    }
                } elseif (is_string($savedVal) && $savedVal !== '') {
                    $plain = $savedVal; // legacy unencrypted
                }

                $source = null;
                $preview = null;
                if ($plain !== null && $plain !== '') {
                    $source = 'db';
                    $preview = '••••' . substr($plain, -4);
                    $hasAnyValue = true;
                } elseif (is_string($envVal) && $envVal !== '') {
                    $source = 'env';
                    $preview = '••••' . substr($envVal, -4);
                    $hasAnyValue = true;
                }

                $values[$fkey] = [
                    'preview' => $preview,
                    'source' => $source,
                    'set' => $preview !== null,
                ];

                if (($field['required'] ?? false) && $preview === null) {
                    $configured = false;
                }
            } else {
                $value = $savedVal;
                $source = 'db';
                if ($value === null || $value === '') {
                    $value = $envVal;
                    $source = ($value !== null && $value !== '') ? 'env' : null;
                } elseif ($savedVal !== null && $savedVal !== '') {
                    $hasAnyValue = true;
                }
                if ($value !== null && $value !== '') $hasAnyValue = true;

                $values[$fkey] = [
                    'value' => $value,
                    'source' => $source,
                    'set' => $value !== null && $value !== '',
                ];

                if (($field['required'] ?? false) && ($value === null || $value === '')) {
                    $configured = false;
                }
            }
        }

        return [
            'key' => $key,
            'name' => $def['name'],
            'description' => $def['description'] ?? '',
            'category' => $def['category'] ?? 'other',
            'icon' => $def['icon'] ?? 'Plug',
            'docs_url' => $def['docs_url'] ?? null,
            'fields' => array_map(fn($f) => [
                'key' => $f['key'],
                'label' => $f['label'],
                'type' => $f['type'],
                'secret' => (bool) ($f['secret'] ?? false),
                'required' => (bool) ($f['required'] ?? false),
                'placeholder' => $f['placeholder'] ?? null,
            ], $def['fields']),
            'values' => $values,
            'configured' => $configured && $hasAnyValue,
        ];
    }
}
