<?php
// Copyright (c) 2026 Trent (PWL31). Original project: CUHKSZ-Ling-Cafe-Glass.
declare(strict_types=1);
if (!defined('LING_BACKEND')) { http_response_code(404); exit; }

final class ApiError extends RuntimeException {
    public int $status;
    public function __construct(string $message, int $status = 400) { parent::__construct($message); $this->status = $status; }
}
function send_json(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}
function text_value($value, int $length): string {
    if (!is_scalar($value) && $value !== null) throw new ApiError('Invalid text value.');
    $value = trim((string)($value ?? ''));
    if (!preg_match('//u', $value)) throw new ApiError('Invalid text encoding.');
    return implode('', array_slice(preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY), 0, $length));
}
function valid_date(string $date): bool {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) return false;
    [$y, $m, $d] = array_map('intval', explode('-', $date));
    return $y >= 2000 && $y <= 2100 && checkdate($m, $d, $y);
}
function valid_time(string $time): bool { return (bool)preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D', $time); }
function today(): string { return (new DateTimeImmutable('now', new DateTimeZone('Asia/Shanghai')))->format('Y-m-d'); }
function offset_date(string $date, int $days): string { return (new DateTimeImmutable($date, new DateTimeZone('Asia/Shanghai')))->modify("$days days")->format('Y-m-d'); }
function weekly_hours(array $s, string $date): array {
    $key = strtolower((new DateTimeImmutable($date))->format('D'));
    return $s['weekly'][$key] ?? ['open' => '09:00', 'close' => '22:00', 'closed' => false];
}
function resolved_hours(array $s, string $date): array {
    $override = $s['overrides'][$date] ?? null;
    $hours = $override ?? weekly_hours($s, $date);
    if ($hours['closed']) $hours = ['open' => '', 'close' => '', 'closed' => true];
    return array_merge($hours, ['source' => $override !== null ? 'override' : 'default']);
}
function check_hours(array $hours): void {
    if (empty($hours['closed']) && (!valid_time($hours['open'] ?? '') || !valid_time($hours['close'] ?? '') || $hours['open'] >= $hours['close'])) {
        throw new ApiError('Invalid opening hours.');
    }
}
function profile_input(array $body, array $current = [], int $index = 0): array {
    $colors = ['#c98592', '#8fb969', '#c98562', '#789ec9', '#a989c7', '#d0a85c', '#68a8a3', '#bc7488'];
    $name = text_value($body['name'] ?? $current['name'] ?? '', 60);
    $bio = text_value($body['bio'] ?? $current['bio'] ?? 'Ling Cafe barista', 90);
    $color = text_value($body['color'] ?? $current['color'] ?? $colors[$index % count($colors)], 7);
    if ($name === '') throw new ApiError('Barista name is required.');
    if (!preg_match('/^#[0-9a-fA-F]{6}$/D', $color)) throw new ApiError('Display color must be a 6-digit hex color.');
    return ['name' => $name, 'bio' => $bio, 'color' => strtolower($color)];
}
function item_index(array $items, int $id, string $error): int {
    foreach ($items as $index => $item) if ((int)$item['id'] === $id) return $index;
    throw new ApiError($error, 404);
}
function next_id(array &$s, string $list, string $counter): int {
    $max = 0; foreach ($s[$list] as $item) $max = max($max, (int)$item['id']);
    $next = max($max + 1, (int)($s[$counter] ?? 1)); $s[$counter] = $next + 1; return $next;
}
function validate_shift(array $s, array $shift, ?int $exclude = null, bool $active = true): void {
    if (!valid_date($shift['date'])) throw new ApiError('Valid date is required.', 409);
    if ($shift['date'] < today()) throw new ApiError('Past schedules are frozen and cannot be changed.', 409);
    if (!valid_time($shift['start']) || !valid_time($shift['end']) || $shift['start'] >= $shift['end']) throw new ApiError('Shift start must be before shift end.', 409);
    $barista = $s['baristas'][item_index($s['baristas'], $shift['baristaId'], 'Barista not found.')];
    if ($active && !$barista['active']) throw new ApiError('This barista has been removed from the active roster.', 409);
    $hours = resolved_hours($s, $shift['date']);
    if ($hours['closed']) throw new ApiError('The cafe is closed on this date.', 409);
    if ($shift['start'] < $hours['open'] || $shift['end'] > $hours['close']) throw new ApiError("Shift must stay within cafe hours ({$hours['open']}–{$hours['close']}).", 409);
    foreach ($s['shifts'] as $other) {
        if ((int)$other['id'] !== $exclude && $other['date'] === $shift['date'] && (int)$other['baristaId'] === $shift['baristaId'] && $shift['start'] < $other['end'] && $shift['end'] > $other['start']) {
            throw new ApiError('This barista already has an overlapping shift.', 409);
        }
    }
}

final class LingBackend {
    private PDO $db;
    private array $config;
    private string $prefix;
    private string $base;
    private string $cookie;
    public function __construct(array $config) {
        $this->config = $config;
        $this->prefix = (string)($config['table_prefix'] ?? 'ling_');
        if (!preg_match('/^[a-z][a-z0-9_]{0,30}$/D', $this->prefix)) throw new ApiError('Invalid database table prefix.', 503);
        $this->base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api.php')), '/') . '/';
        $this->cookie = 'ling_php_' . substr(hash('sha256', $this->base), 0, 12);
        $host = (string)($config['db_host'] ?? '127.0.0.1');
        $name = (string)($config['db_name'] ?? '');
        if (strpbrk($host . $name, ";\r\n") !== false) throw new ApiError('Invalid database configuration.', 503);
        $dsn = 'mysql:host=' . $host . ';port=' . (int)($config['db_port'] ?? 3306) . ';dbname=' . $name . ';charset=utf8mb4';
        $this->db = new PDO($dsn, $config['db_user'], $config['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    private function query(string $sql, array $values = []): PDOStatement {
        $query = $this->db->prepare(str_replace('PREFIX_', $this->prefix, $sql));
        $query->execute($values); return $query;
    }
    private function read(string $key, bool $lock = false): array {
        $row = $this->query('SELECT payload FROM PREFIX_state WHERE state_key = ?' . ($lock ? ' FOR UPDATE' : ''), [$key])->fetch();
        if (!$row) throw new ApiError('Database import required.', 503);
        return json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR);
    }
    private function mutate(string $key, callable $change): array {
        $this->db->beginTransaction();
        try {
            $s = $this->read($key, true);
            $result = $change($s);
            $this->query('UPDATE PREFIX_state SET payload = ? WHERE state_key = ?', [json_encode($s, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $key]);
            $this->db->commit(); return $result;
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    private function body(string $raw): array {
        try { $data = json_decode($raw, true, 64, JSON_THROW_ON_ERROR); }
        catch (Throwable $e) { throw new ApiError('Invalid request body.'); }
        if (!is_array($data) || !str_starts_with(ltrim($raw), '{')) throw new ApiError('Invalid request body.');
        return $data;
    }
    private function image_url(string $image): string {
        if (preg_match('~^/api/menu-images/(\d+)(?:\?v=([^&]+))?$~D', $image, $m)) {
            return $this->base . 'api.php?route=/menu-images/' . $m[1] . (isset($m[2]) ? '&v=' . rawurlencode($m[2]) : '');
        }
        if (preg_match('~^/?(menu-images/[a-zA-Z0-9._-]+|menu-placeholder\.svg|menu-sprite(?:-v\d+)?\.jpg)(\?[^\s]*)?$~D', $image)) {
            return $this->base . ltrim($image, '/');
        }
        if (str_starts_with($image, 'https://')) return $image;
        return $this->base . 'menu-placeholder.svg';
    }
    private function menu_view(array $items): array {
        return array_map(function ($item) { $item['image'] = $this->image_url((string)($item['image'] ?? '')); return $item; }, array_values($items));
    }
    private function session(): ?array {
        $token = $_COOKIE[$this->cookie] ?? '';
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
        $row = $this->query('SELECT username FROM PREFIX_sessions WHERE token_hash = ? AND expires_at > ?', [hash('sha256', $token), time()])->fetch();
        return $row ?: null;
    }
    private function cookie(string $token, int $expires): void {
        setcookie($this->cookie, $token, ['expires' => $expires, 'path' => $this->base,
            'secure' => (bool)($this->config['secure_cookie'] ?? true), 'httponly' => true, 'samesite' => 'Strict']);
    }
    private function login(string $raw): void {
        $body = $this->body($raw);
        $user = text_value($body['username'] ?? '', 80);
        $password = $body['password'] ?? '';
        if (!is_string($password) || strlen($password) > 512) throw new ApiError('Invalid username or password.', 401);
        $key = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? 'local'));
        $this->query('INSERT IGNORE INTO PREFIX_login_limits (client_hash, failures, window_start) VALUES (?, 0, ?)', [$key, time()]);
        $this->db->beginTransaction();
        try {
            $rate = $this->query('SELECT failures, window_start FROM PREFIX_login_limits WHERE client_hash = ? FOR UPDATE', [$key])->fetch();
            $fresh = (int)$rate['window_start'] > time() - 900;
            $count = $fresh ? (int)$rate['failures'] : 0;
            if ($count >= 20) throw new ApiError('Too many login attempts. Try again in 15 minutes.', 429);
            $valid = password_verify($password, (string)$this->config['admin_password_hash']) && hash_equals((string)$this->config['admin_username'], $user);
            $this->query('UPDATE PREFIX_login_limits SET failures = ?, window_start = ? WHERE client_hash = ?', [$valid ? 0 : $count + 1, $fresh ? (int)$rate['window_start'] : time(), $key]);
            $this->db->commit();
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
        if (!$valid) throw new ApiError('Invalid username or password.', 401);
        $old = $_COOKIE[$this->cookie] ?? '';
        if (is_string($old) && $old !== '') $this->query('DELETE FROM PREFIX_sessions WHERE token_hash = ?', [hash('sha256', $old)]);
        $token = bin2hex(random_bytes(32));
        $this->query('INSERT INTO PREFIX_sessions (token_hash, username, expires_at) VALUES (?, ?, ?)', [hash('sha256', $token), $user, time() + 28800]);
        $this->query('DELETE FROM PREFIX_sessions WHERE expires_at <= ?', [time()]);
        $this->cookie($token, time() + 28800);
        send_json(['ok' => true, 'authenticated' => true, 'username' => $user]);
    }
    private function public_schedule(array $s): array {
        $today = today();
        $start = (string)($_GET['start'] ?? '');
        if (!valid_date($start)) $start = offset_date($today, 1 - (int)(new DateTimeImmutable($today))->format('N'));
        $count = max(1, min(31, (int)($_GET['days'] ?? 7)));
        $profiles = []; foreach ($s['baristas'] as $b) $profiles[(int)$b['id']] = $b;
        $days = [];
        for ($i = 0; $i < $count; $i++) {
            $date = offset_date($start, $i);
            $shifts = array_values(array_filter($s['shifts'], fn($x) => $x['date'] === $date));
            usort($shifts, fn($a, $b) => strcmp($a['start'], $b['start']));
            foreach ($shifts as &$shift) {
                $p = $profiles[(int)$shift['baristaId']] ?? [];
                $shift = array_merge($shift, ['name' => $p['name'] ?? 'Former barista', 'color' => $p['color'] ?? '#789ec9', 'bio' => $p['bio'] ?? 'Ling Cafe barista']);
            } unset($shift);
            $days[] = array_merge(['date' => $date], resolved_hours($s, $date), ['shifts' => $shifts]);
        }
        $baristas = array_values(array_map(fn($b) => ['id' => $b['id'], 'name' => $b['name'], 'color' => $b['color'], 'bio' => $b['bio']], array_filter($s['baristas'], fn($b) => $b['active'])));
        return ['today' => $today, 'start' => $start, 'days' => $days, 'baristas' => $baristas];
    }
    public function dispatch(string $path, string $method, string $raw): void {
        if ($path === '/health' && $method === 'GET') {
            $menu = $this->read('menu'); $this->read('schedule');
            send_json(['ok' => true, 'backend' => 'php-mysql', 'menuBackend' => true, 'scheduleBackend' => true, 'items' => count($menu['items'])]); return;
        }
        if ($path === '/admin/login' && $method === 'POST') { $this->login($raw); return; }
        if ($path === '/admin/session' && $method === 'GET') {
            $session = $this->session(); send_json($session ? ['authenticated' => true, 'username' => $session['username']] : ['authenticated' => false]); return;
        }
        if ($path === '/admin/logout' && $method === 'POST') {
            $token = $_COOKIE[$this->cookie] ?? '';
            if (is_string($token)) $this->query('DELETE FROM PREFIX_sessions WHERE token_hash = ?', [hash('sha256', $token)]);
            $this->cookie('', time() - 3600); send_json(['ok' => true]); return;
        }
        if ($path === '/menu' && $method === 'GET') { send_json(['items' => $this->menu_view($this->read('menu')['items'])]); return; }
        if ($path === '/schedule' && $method === 'GET') { send_json($this->public_schedule($this->read('schedule'))); return; }
        if (preg_match('~^/menu-images/(\d+)$~D', $path, $match) && in_array($method, ['GET', 'HEAD'], true)) {
            $image = $this->query('SELECT content_type, image_bytes FROM PREFIX_images WHERE item_id = ?', [(int)$match[1]])->fetch();
            if (!$image) throw new ApiError('Menu image not found.', 404);
            header('Content-Type: ' . $image['content_type']); header('Cache-Control: public, max-age=300');
            header('Content-Length: ' . strlen($image['image_bytes']));
            if ($method !== 'HEAD') echo $image['image_bytes']; return;
        }
        if (str_starts_with($path, '/admin/')) {
            if (!$this->session()) throw new ApiError('Authentication required.', 401);
            if ($path === '/admin/schedule' && $method === 'GET') {
                $s = $this->read('schedule'); unset($s['nextBaristaId'], $s['nextShiftId']);
                $s['overrides'] = (object)$s['overrides']; send_json(array_merge(['today' => today()], $s)); return;
            }
            if (preg_match('~^/admin/menu(?:/(\d+))?(/image)?$~D', $path, $match)) {
                $this->menu_mutation($method, isset($match[1]) ? (int)$match[1] : null, isset($match[2]), $raw); return;
            }
            if (str_starts_with($path, '/admin/schedule/')) {
                $body = $method === 'DELETE' ? [] : $this->body($raw);
                $status = $method === 'POST' ? 201 : 200;
                $result = $this->mutate('schedule', fn(&$s) => $this->schedule_mutation($s, substr($path, strlen('/admin/schedule')), $method, $body));
                send_json($result, $status); return;
            }
        }
        throw new ApiError('Not found.', 404);
    }
    private function menu_mutation(string $method, ?int $id, bool $image, string $raw): void {
        if ($image && $method === 'PUT') {
            if (strlen($raw) === 0 || strlen($raw) > 1900000) throw new ApiError('Optimized image is too large. Keep it below 1.9 MB.', 413);
            $info = @getimagesizefromstring($raw);
            if (!$info || !in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) throw new ApiError('Use a JPG, PNG, or WebP image.', 415);
            [$w, $h] = $info;
            if ($h <= 0 || abs($w / $h - 4 / 3) > 0.01) throw new ApiError('Menu images must use a 4:3 aspect ratio.');
            $result = $this->mutate('menu', function (&$s) use ($id, $raw, $info, $w, $h) {
                $i = item_index($s['items'], $id, 'Menu item not found.'); $updated = (int)round(microtime(true) * 1000);
                $this->query('INSERT INTO PREFIX_images (item_id, content_type, image_bytes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE content_type = VALUES(content_type), image_bytes = VALUES(image_bytes)', [$id, $info['mime'], $raw]);
                $s['items'][$i]['image'] = '/api/menu-images/' . $id . '?v=' . $updated;
                $items = $this->menu_view($s['items']);
                return ['item' => $items[$i], 'items' => $items, 'image' => ['contentType' => $info['mime'], 'width' => $w, 'height' => $h, 'bytes' => strlen($raw), 'updatedAt' => $updated]];
            }); send_json($result); return;
        }
        if ($image || !in_array($method, ['POST', 'PUT', 'DELETE'], true) || ($method === 'POST' && $id !== null) || ($method !== 'POST' && $id === null)) throw new ApiError('Not found.', 404);
        $body = $method === 'DELETE' ? [] : $this->body($raw);
        $result = $this->mutate('menu', function (&$s) use ($id, $method, $body) {
            $index = $id !== null ? item_index($s['items'], $id, 'Menu item not found.') : count($s['items']);
            if ($method === 'DELETE') {
                array_splice($s['items'], $index, 1); $this->query('DELETE FROM PREFIX_images WHERE item_id = ?', [$id]);
                return ['ok' => true, 'items' => $this->menu_view($s['items'])];
            }
            $old = $s['items'][$index] ?? ['id' => next_id($s, 'items', 'nextId'), 'image' => '/menu-placeholder.svg', 'available' => true, 'popular' => false];
            $item = $old;
            foreach (['cat' => 40, 'name' => 80, 'desc' => 180] as $field => $length) $item[$field] = text_value($body[$field] ?? $old[$field] ?? '', $length);
            if (!$item['cat']) throw new ApiError('Category is required.');
            if (!$item['name']) throw new ApiError('Name is required.');
            $amount = $body['amount'] ?? $old['amount'] ?? 0;
            if (!is_numeric($amount) || !is_finite((float)$amount)) throw new ApiError('Invalid cost price.');
            $item['amount'] = max(0, min(9999, (float)$amount));
            foreach (['available', 'popular'] as $field) $item[$field] = (bool)($body[$field] ?? $old[$field]);
            $s['items'][$index] = $item;
            if (count(array_filter($s['items'], fn($m) => $m['popular'])) > 4) throw new ApiError('Popular drinks are limited to four.', 409);
            $items = $this->menu_view($s['items']); return ['item' => $items[$index], 'items' => $items];
        }); send_json($result, $method === 'POST' ? 201 : 200);
    }
    private function schedule_mutation(array &$s, string $path, string $method, array $body): array {
        if ($path === '/weekly' && $method === 'PUT') {
            $weekly = [];
            foreach (['mon','tue','wed','thu','fri','sat','sun'] as $day) {
                if (!isset($body['weekly'][$day]) || !is_array($body['weekly'][$day])) throw new ApiError("Missing $day hours.");
                $row = $body['weekly'][$day];
                $weekly[$day] = ['open' => text_value($row['open'] ?? '09:00', 5), 'close' => text_value($row['close'] ?? '22:00', 5), 'closed' => (bool)($row['closed'] ?? false)];
                check_hours($weekly[$day]);
            }
            $start = valid_date($s['historyStart'] ?? '') ? $s['historyStart'] : '2026-09-01';
            for ($date = $start; $date < today(); $date = offset_date($date, 1)) if (!isset($s['overrides'][$date])) $s['overrides'][$date] = weekly_hours($s, $date);
            $s['weekly'] = $weekly;
            foreach ($s['shifts'] as $shift) {
                if ($shift['date'] < today()) continue;
                $h = resolved_hours($s, $shift['date']);
                if ($h['closed'] || $shift['start'] < $h['open'] || $shift['end'] > $h['close']) throw new ApiError('Existing shifts fall outside the requested cafe hours. Adjust shifts first.', 409);
            }
            return ['ok' => true, 'weekly' => $weekly];
        }
        if (preg_match('~^/day/(\d{4}-\d{2}-\d{2})$~D', $path, $m) && $method === 'PUT') {
            $date = $m[1];
            if (!valid_date($date)) throw new ApiError('Valid date is required.');
            if ($date < today()) throw new ApiError('Past schedules are frozen and cannot be changed.', 409);
            $mode = $body['mode'] ?? '';
            if ($mode === 'default') unset($s['overrides'][$date]);
            elseif ($mode === 'closed') $s['overrides'][$date] = ['closed' => true, 'open' => '', 'close' => ''];
            elseif ($mode === 'custom') {
                $hours = ['closed' => false, 'open' => text_value($body['open'] ?? '', 5), 'close' => text_value($body['close'] ?? '', 5)]; check_hours($hours); $s['overrides'][$date] = $hours;
            } else throw new ApiError('Mode must be default, custom, or closed.');
            $hours = resolved_hours($s, $date);
            foreach ($s['shifts'] as $shift) if ($shift['date'] === $date && ($hours['closed'] || $shift['start'] < $hours['open'] || $shift['end'] > $hours['close'])) throw new ApiError('Existing shifts fall outside the requested cafe hours. Adjust shifts first.', 409);
            return ['ok' => true, 'override' => $s['overrides'][$date] ?? null];
        }
        if ($path === '/baristas' && $method === 'POST') {
            $profile = profile_input($body, [], count($s['baristas']));
            foreach ($s['baristas'] as $b) if ($b['active'] && strcasecmp($b['name'], $profile['name']) === 0) throw new ApiError('This barista is already active.', 409);
            $barista = array_merge(['id' => next_id($s, 'baristas', 'nextBaristaId')], $profile, ['active' => true, 'createdAt' => gmdate('c'), 'removedAt' => null]);
            $s['baristas'][] = $barista; return ['barista' => $barista];
        }
        if (preg_match('~^/baristas/(\d+)$~D', $path, $m) && in_array($method, ['PUT', 'DELETE'], true)) {
            $i = item_index($s['baristas'], (int)$m[1], 'Barista not found.');
            if ($method === 'DELETE') { $s['baristas'][$i]['active'] = false; $s['baristas'][$i]['removedAt'] = gmdate('c'); }
            else {
                $profile = profile_input($body, $s['baristas'][$i], $i);
                foreach ($s['baristas'] as $b) if ($b['active'] && (int)$b['id'] !== (int)$m[1] && strcasecmp($b['name'], $profile['name']) === 0) throw new ApiError('Another active barista already uses this name.', 409);
                $s['baristas'][$i] = array_merge($s['baristas'][$i], $profile, ['updatedAt' => gmdate('c')]);
            } return ['ok' => true, 'barista' => $s['baristas'][$i]];
        }
        if ($path === '/shifts' && $method === 'POST') {
            $shift = ['date' => text_value($body['date'] ?? '', 10), 'baristaId' => (int)($body['baristaId'] ?? 0), 'start' => text_value($body['start'] ?? '', 5), 'end' => text_value($body['end'] ?? '', 5)];
            validate_shift($s, $shift);
            $shift = array_merge(['id' => next_id($s, 'shifts', 'nextShiftId')], $shift); $s['shifts'][] = $shift; return ['shift' => $shift];
        }
        if (preg_match('~^/shifts/(\d+)$~D', $path, $m) && in_array($method, ['PUT', 'DELETE'], true)) {
            $i = item_index($s['shifts'], (int)$m[1], 'Shift not found.'); $old = $s['shifts'][$i];
            if ($old['date'] < today()) throw new ApiError('Past schedules are frozen and cannot be changed.', 409);
            if ($method === 'DELETE') { array_splice($s['shifts'], $i, 1); return ['ok' => true]; }
            $shift = array_merge($old, ['start' => text_value($body['start'] ?? $old['start'], 5), 'end' => text_value($body['end'] ?? $old['end'], 5)]);
            validate_shift($s, $shift, (int)$old['id'], false); $s['shifts'][$i] = $shift; return ['shift' => $shift];
        }
        throw new ApiError('Not found.', 404);
    }
}
