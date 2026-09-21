<?php
// Copyright (c) 2026 Trent (PWL31). Original: PWL31/CUHKSZ-Ling-Cafe-Glass.
declare(strict_types=1);
define('LING_BACKEND', true);
require __DIR__ . '/backend.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('Asia/Shanghai');
try {
    if (!is_file(__DIR__ . '/config.php')) {
        throw new ApiError('Backend setup required: configure config.php and import the database.', 503);
    }
    $config = require __DIR__ . '/config.php';
    $app = new LingBackend($config);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($method === 'POST' && isset($_GET['_method'])) {
        $method = strtoupper((string)$_GET['_method']);
        if (!in_array($method, ['PUT', 'DELETE'], true)) throw new ApiError('Invalid method.', 405);
    }
    if (!in_array($method, ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'], true)) throw new ApiError('Method not allowed.', 405);
    if (!in_array($method, ['GET', 'HEAD'], true)) {
        // Custom same-origin header + no CORS prevents cross-site form writes.
        if (($_SERVER['HTTP_X_LING_REQUEST'] ?? '') !== '1' ||
            ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
            throw new ApiError('Same-origin request required.', 403);
        }
    }
    $path = (string)($_GET['route'] ?? '/health');
    if (!preg_match('~^/[a-zA-Z0-9/_-]+$~D', $path)) throw new ApiError('Not found.', 404);
    $raw = file_get_contents('php://input', false, null, 0, 2000001);
    if (strlen($raw) > 2000000) throw new ApiError('Request is too large.', 413);
    $app->dispatch($path, $method, $raw);
} catch (ApiError $e) {
    send_json(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    error_log('Ling backend: ' . $e->getMessage());
    send_json(['error' => 'Backend unavailable. Check the PHP/MySQL configuration and database import.'], 503);
}
