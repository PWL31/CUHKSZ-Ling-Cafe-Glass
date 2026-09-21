<?php
// Copyright (c) 2026 Trent (PWL31). Keep this file as PHP, never rename to .txt.
if (!defined('LING_BACKEND')) { http_response_code(404); exit; }
return [
    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'YOUR_DATABASE_NAME',
    'db_user' => 'YOUR_DATABASE_USER',
    'db_password' => 'YOUR_DATABASE_PASSWORD',
    'table_prefix' => 'ling_',
    'admin_username' => 'Trent',
    'admin_password_hash' => 'REPLACE_WITH_PASSWORD_HASH',
    // Keep true for the HTTPS public site. False is only for local HTTP testing.
    'secure_cookie' => true,
];
