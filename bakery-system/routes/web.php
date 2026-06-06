<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('/order', function () {
    return view('order');
})->name('order');

Route::get('/admin', function () {
    return view('admin.dashboard');
})->name('admin.dashboard');

Route::get('/admin/orders', function () {
    return view('admin.orders');
})->name('admin.orders');

Route::get('/admin/production', function () {
    return view('admin.production');
})->name('admin.production');

Route::get('/admin/inventory', function () {
    return view('admin.inventory');
})->name('admin.inventory');

Route::get('/admin/pickup-slots', function () {
    return view('admin.pickup-slots');
})->name('admin.pickup-slots');

Route::get('/login', function () {
    return view('auth.login');
})->name('login');
