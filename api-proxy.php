<?php
// Growth90 API Proxy - allows long-running requests (up to 10 minutes)
// Security note: In production, restrict allowed endpoints and validate inputs.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-Request-ID, X-Timestamp');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Extend PHP execution window to 10 minutes
@ini_set('max_execution_time', '600');
@set_time_limit(600);
ignore_user_abort(true);

$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    exit;
}

$endpoint = isset($payload['endpoint']) ? $payload['endpoint'] : '';
$method = isset($payload['method']) ? strtoupper($payload['method']) : 'GET';
$headers = isset($payload['headers']) && is_array($payload['headers']) ? $payload['headers'] : [];
$data = isset($payload['data']) ? $payload['data'] : null;
$params = isset($payload['params']) && is_array($payload['params']) ? $payload['params'] : [];

// Base URL - keep in sync with js/api.js API_CONFIG.baseURL
$baseURL = 'https://cmecp50gmck7l66evnyeuwawz.agent.a.smyth.ai';

// Build final URL
$url = rtrim($baseURL, '/') . $endpoint;
if ($method === 'GET' && !empty($params)) {
    $qs = http_build_query($params);
    $url .= (strpos($url, '?') === false ? '?' : '&') . $qs;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Forward headers
$curlHeaders = [];
foreach ($headers as $k => $v) {
    $curlHeaders[] = $k . ': ' . $v;
}
// Ensure JSON for bodies
$curlHeaders[] = 'Content-Type: application/json';
curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);

if ($method !== 'GET' && $data !== null) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
}

// Timeouts: connect 30s, overall 600s
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($ch, CURLOPT_TIMEOUT, 600);

// Follow redirects if any
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$responseBody = curl_exec($ch);
$errno = curl_errno($ch);
$error = curl_error($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'status' => 502,
        'message' => 'Proxy error: ' . $error,
    ]);
    exit;
}

// Try to JSON decode the upstream response
$parsed = json_decode($responseBody, true);
$isJson = json_last_error() === JSON_ERROR_NONE;

// Wrap response in a stable envelope expected by the frontend
echo json_encode([
    'success' => ($status >= 200 && $status < 300),
    'status' => $status,
    'data' => $isJson ? $parsed : $responseBody,
]);
exit;

