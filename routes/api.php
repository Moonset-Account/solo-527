<?php

use App\Http\Controllers\Api\RegistrationApiController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/registrations/stats', [RegistrationApiController::class, 'stats']);
    Route::post('/registrations/batch', [RegistrationApiController::class, 'batchStore']);
});
