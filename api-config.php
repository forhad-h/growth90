<?php
/**
 * Growth90 API Proxy Configuration
 */

// API Configuration
define('API_BASE_URL', 'https://cmecp50gmck7l66evnyeuwawz.agent.a.smyth.ai');
define('REQUEST_TIMEOUT', 30);
define('MAX_RETRIES', 3);
define('RETRY_DELAY', 1);

// Rate Limiting
define('RATE_LIMIT_REQUESTS', 100); // requests per hour per IP
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// Security
define('ALLOWED_ORIGINS', '*'); // Change to specific domains in production
define('ENABLE_LOGGING', true);
define('LOG_FILE', __DIR__ . '/api-proxy.log');
define('RATE_LIMIT_FILE', __DIR__ . '/rate_limits.json');

// Allowed API endpoints (for security)
$ALLOWED_ENDPOINTS = [
    '/api/initialize_user_profile',
    '/api/update_user_preferences',
    '/api/dashboard_summary',
    '/api/generate_learning_path',
    '/api/update_progress_metrics',
    '/api/get_daily_lesson',
    '/api/get_supplementary_insights',
    '/api/generate_assessment_questions',
    '/api/evaluate_learner_response',
    '/api/contextual_query',
    '/api/learning_assistant'
];

?>
