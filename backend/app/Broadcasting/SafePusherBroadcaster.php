<?php

namespace App\Broadcasting;

use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Psr\Log\LoggerInterface;

/**
 * Wraps PusherBroadcaster to gracefully handle connection failures (e.g. when Reverb is not running).
 * Logs the error instead of failing the queue job.
 */
class SafePusherBroadcaster extends PusherBroadcaster
{
    public function broadcast(array $channels, $event, array $payload = [])
    {
        $socket = Arr::pull($payload, 'socket');

        $parameters = $socket !== null ? ['socket_id' => $socket] : [];

        $channels = new Collection($this->formatChannels($channels));

        try {
            $channels->chunk(100)->each(function ($channels) use ($event, $payload, $parameters) {
                $this->pusher->trigger($channels->toArray(), $event, $payload, $parameters);
            });
        } catch (\Throwable $e) {
            $message = $e->getMessage();
            $isConnectionError = str_contains($message, 'Failed to connect') ||
                str_contains($message, 'Could not connect') ||
                str_contains($message, 'Connection refused');

            if ($isConnectionError) {
                app(LoggerInterface::class)->warning('Broadcast skipped (Reverb/Pusher unreachable): ' . $message);
                return;
            }

            throw new BroadcastException('Pusher error: ' . $message, 0, $e);
        }
    }
}
