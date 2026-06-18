<?php

use Carbon\Carbon;

if (!function_exists('format_date')) {
    function format_date($date, $format = 'Y-m-d')
    {
        if (!$date) {
            return '';
        }

        try {
            return Carbon::parse($date)->format($format);
        } catch (\Exception $e) {
            return '';
        }
    }
}

if (!function_exists('format_datetime')) {
    function format_datetime($date)
    {
        if (!$date) {
            return '';
        }

        try {
            return Carbon::parse($date)->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return '';
        }
    }
}

if (!function_exists('format_money')) {
    function format_money($amount, $currency = 'CNY')
    {
        $amount = (float) $amount;
        $formatted = number_format($amount, 2, '.', ',');

        $symbols = [
            'CNY' => '¥',
            'USD' => '$',
            'EUR' => '€',
            'JPY' => '¥',
        ];

        $symbol = $symbols[$currency] ?? $currency . ' ';

        return $symbol . $formatted;
    }
}

if (!function_exists('status_color')) {
    function status_color($status, $module)
    {
        $maps = config('farm.status_maps.' . $module, []);

        if (isset($maps[$status]['color'])) {
            return $maps[$status]['color'];
        }

        return 'gray';
    }
}

if (!function_exists('generate_no')) {
    function generate_no($prefix)
    {
        $date = now()->format('Ymd');
        $random = str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);

        return strtoupper($prefix) . $date . $random;
    }
}
