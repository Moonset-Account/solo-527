<?php

return [

    'permission' => [

        'models' => [
            'permission' => Spatie\Permission\Models\Permission::class,
            'role' => Spatie\Permission\Models\Role::class,
        ],

        'table_names' => [
            'roles' => 'roles',
            'permissions' => 'permissions',
            'model_has_permissions' => 'model_has_permissions',
            'model_has_roles' => 'model_has_roles',
            'role_has_permissions' => 'role_has_permissions',
        ],

        'column_names' => [
            'role_pivot_key' => null,
            'permission_pivot_key' => null,
            'model_morph_key' => 'model_id',
            'team_foreign_key' => 'team_id',
        ],

        'teams' => false,

        'display_permission_in_exception' => false,
        'display_role_in_exception' => false,
        'enable_wildcard_permission' => false,

        'cache' => [
            'expiration_time' => \DateInterval::createFromDateString('24 hours'),
            'key' => 'spatie.permission.cache',
            'store' => 'default',
        ],
    ],

    'excel' => [
        'exports' => [
            'chunksize' => 1000,
            'pre_calculate_formulas' => false,
            'strict_null_comparison' => false,
            'csv' => [
                'delimiter' => ',',
                'enclosure' => '"',
                'line_ending' => PHP_EOL,
                'use_bom' => true,
                'include_separator_line' => false,
                'excel_compatibility' => false,
            ],
        ],
    ],

];
