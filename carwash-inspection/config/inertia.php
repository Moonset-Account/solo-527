<?php

return [
    'ssr' => [
        'enabled' => env('INERTIA_SSR_ENABLED', false),
        'url' => env('INERTIA_SSR_URL', 'http://localhost:13714'),
    ],

    'history' => [
        'encrypt' => env('INERTIA_HISTORY_ENCRYPT', false),
    ],
];
