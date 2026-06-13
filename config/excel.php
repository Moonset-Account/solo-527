<?php

return [
    'excel' => [
        'exports' => [
            'chunk_size' => 1000,
            'temp_path' => sys_get_temp_dir(),
            'pre_calculate_formulas' => false,
            'strict_null_comparison' => false,
            'csv' => [
                'delimiter' => ',',
                'enclosure' => '"',
                'line_ending' => PHP_EOL,
                'use_bom' => false,
                'include_separator_line' => false,
                'excel_compatibility' => false,
            ],
            'properties' => [
                'creator' => '牙科诊所管理台',
                'lastModifiedBy' => '牙科诊所管理台',
            ],
        ],
        'imports' => [
            'read_only' => true,
            'ignore_empty' => false,
            'heading_row' => [
                'formatter' => 'strtolower',
                'calculator' => \Maatwebsite\Excel\Imports\HeadingRowFormatter::class,
            ],
            'sync_timeout' => 60,
            'queue_timeout' => 60,
            'transactions' => [
                'handler' => 'db',
                'db' => [
                    'connection' => 'default',
                ],
            ],
        ],
        'transactions' => [
            'as_operation' => true,
        ],
        'temporary_files' => [
            'local_path' => sys_get_temp_dir().DIRECTORY_SEPARATOR.'laravel-excel',
            'remote_disk' => null,
            'remote_prefix' => null,
            'force_resync_remote' => null,
        ],
    ],
];
