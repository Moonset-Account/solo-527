<?php

use App\Enums\ConfigKey;
use App\Services\ConfigService;

if (!function_exists('config_value')) {
    function config_value(ConfigKey $key, mixed $default = null): mixed
    {
        try {
            return app(ConfigService::class)->get($key);
        } catch (Exception $e) {
            return $default ?? $key->defaultValue();
        }
    }
}

if (!function_exists('format_currency')) {
    function format_currency(float $amount, string $currency = 'CNY', int $decimals = 2): string
    {
        $symbols = [
            'CNY' => '¥',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥',
            'HKD' => 'HK$',
        ];

        $symbol = $symbols[$currency] ?? $currency . ' ';

        return $symbol . number_format($amount, $decimals, '.', ',');
    }
}

if (!function_exists('format_number')) {
    function format_number(float $number, int $decimals = 2): string
    {
        return number_format($number, $decimals, '.', ',');
    }
}

if (!function_exists('format_percentage')) {
    function format_percentage(float $value, int $decimals = 2): string
    {
        return number_format($value * 100, $decimals) . '%';
    }
}

if (!function_exists('format_date')) {
    function format_date(?DateTimeInterface $date, string $format = 'Y-m-d'): string
    {
        if (!$date) {
            return '';
        }
        return $date->format($format);
    }
}

if (!function_exists('format_datetime')) {
    function format_datetime(?DateTimeInterface $date, string $format = 'Y-m-d H:i:s'): string
    {
        if (!$date) {
            return '';
        }
        return $date->format($format);
    }
}

if (!function_exists('relative_time')) {
    function relative_time(?DateTimeInterface $date): string
    {
        if (!$date) {
            return '';
        }

        $now = now();
        $diff = $now->diff($date);

        if ($diff->y > 0) {
            return $diff->y . '年前';
        }
        if ($diff->m > 0) {
            return $diff->m . '个月前';
        }
        if ($diff->d > 0) {
            return $diff->d . '天前';
        }
        if ($diff->h > 0) {
            return $diff->h . '小时前';
        }
        if ($diff->i > 0) {
            return $diff->i . '分钟前';
        }
        return '刚刚';
    }
}

if (!function_exists('generate_serial_number')) {
    function generate_serial_number(string $prefix, int $length = 4): string
    {
        $date = now()->format('Ymd');
        $random = str_pad((string) random_int(0, pow(10, $length) - 1), $length, '0', STR_PAD_LEFT);
        return $prefix . $date . $random;
    }
}

if (!function_exists('mask_string')) {
    function mask_string(string $string, int $start = 3, int $end = 3, string $mask = '*'): string
    {
        $length = strlen($string);
        if ($length <= $start + $end) {
            return str_repeat($mask, $length);
        }
        return substr($string, 0, $start)
            . str_repeat($mask, $length - $start - $end)
            . substr($string, -$end);
    }
}

if (!function_exists('mask_phone')) {
    function mask_phone(string $phone): string
    {
        return mask_string($phone, 3, 4);
    }
}

if (!function_exists('mask_email')) {
    function mask_email(string $email): string
    {
        [$name, $domain] = explode('@', $email, 2);
        $length = strlen($name);
        if ($length <= 2) {
            return str_repeat('*', $length) . '@' . $domain;
        }
        return substr($name, 0, 1) . str_repeat('*', $length - 2) . substr($name, -1) . '@' . $domain;
    }
}

if (!function_exists('truncate_text')) {
    function truncate_text(string $text, int $length = 100, string $suffix = '...'): string
    {
        if (mb_strlen($text) <= $length) {
            return $text;
        }
        return mb_substr($text, 0, $length - mb_strlen($suffix)) . $suffix;
    }
}

if (!function_exists('sanitize_filename')) {
    function sanitize_filename(string $filename): string
    {
        $filename = preg_replace('/[^\p{L}\p{N}\s\-_.]/u', '', $filename);
        $filename = preg_replace('/\s+/', '_', $filename);
        return trim($filename, '._');
    }
}

if (!function_exists('human_file_size')) {
    function human_file_size(int $bytes, int $decimals = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        $factor = (int) floor(log($bytes, 1024));
        $factor = min($factor, count($units) - 1);
        return number_format($bytes / pow(1024, $factor), $decimals) . ' ' . $units[$factor];
    }
}

if (!function_exists('is_active_route')) {
    function is_active_route(string|array $routes, string $activeClass = 'active', string $inactiveClass = ''): string
    {
        $routes = is_array($routes) ? $routes : [$routes];
        foreach ($routes as $route) {
            if (request()->is($route)) {
                return $activeClass;
            }
        }
        return $inactiveClass;
    }
}

if (!function_exists('company_name')) {
    function company_name(): string
    {
        return config_value(ConfigKey::COMPANY_NAME, '办公用品采购系统');
    }
}

if (!function_exists('financial_review_threshold')) {
    function financial_review_threshold(): float
    {
        return (float) config_value(ConfigKey::FINANCIAL_REVIEW_THRESHOLD, 50000);
    }
}

if (!function_exists('quotation_expiry_days')) {
    function quotation_expiry_days(): int
    {
        return (int) config_value(ConfigKey::QUOTATION_EXPIRY_DAYS, 30);
    }
}

if (!function_exists('batch_max_retries')) {
    function batch_max_retries(): int
    {
        return (int) config_value(ConfigKey::BATCH_MAX_RETRIES, 3);
    }
}

if (!function_exists('batch_retry_interval')) {
    function batch_retry_interval(): int
    {
        return (int) config_value(ConfigKey::BATCH_RETRY_INTERVAL_MINUTES, 60);
    }
}

if (!function_exists('is_maintenance_mode')) {
    function is_maintenance_mode(): bool
    {
        return (bool) config_value(ConfigKey::MAINTENANCE_MODE, false);
    }
}

if (!function_exists('array_group_by')) {
    function array_group_by(array $array, string|int|callable $key): array
    {
        $result = [];
        foreach ($array as $item) {
            if (is_callable($key)) {
                $k = $key($item);
            } elseif (is_object($item)) {
                $k = $item->$key;
            } else {
                $k = $item[$key];
            }
            $result[$k][] = $item;
        }
        return $result;
    }
}

if (!function_exists('array_sort_by')) {
    function array_sort_by(array $array, string|callable $key, bool $descending = false): array
    {
        usort($array, function ($a, $b) use ($key, $descending) {
            if (is_callable($key)) {
                $va = $key($a);
                $vb = $key($b);
            } elseif (is_object($a)) {
                $va = $a->$key;
                $vb = $b->$key;
            } else {
                $va = $a[$key];
                $vb = $b[$key];
            }

            if ($va == $vb) {
                return 0;
            }

            return ($descending ? $va < $vb : $va > $vb) ? 1 : -1;
        });

        return $array;
    }
}
