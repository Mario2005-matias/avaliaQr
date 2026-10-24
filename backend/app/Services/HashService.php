<?php

namespace App\Services;

use RuntimeException;

class HashService
{
    private string $key;

    public function __construct()
    {
        $this->key = config('app.hmac_key') ?? '';
        if (empty($this->key)) {
            throw new RuntimeException('APP_HMAC_KEY não está definida no .env.');
        }
    }

    /**
     * Gera um hash HMAC-SHA256 seguro.
     */
    public function hash(string $value): string
    {
        return hash_hmac('sha256', $value, $this->key);
    }

    /**
     * Gera um token aleatório longo e o seu hash.
     * Retorna ['plain' => 'token em claro', 'hash' => 'token_hash']
     */
    public function generateToken(): array
    {
        $plain = bin2hex(random_bytes(32)); // 64 caracteres
        return [
            'plain' => $plain,
            'hash' => $this->hash($plain),
        ];
    }

    /**
     * Gera o hash do dispositivo e IP para as avaliações.
     */
    public function hashDeviceAndIp(?string $deviceId, string $ip): array
    {
        return [
            'device_hash' => $this->hash($deviceId ?? 'unknown-device'),
            'ip_hash' => $this->hash($ip),
        ];
    }
}
