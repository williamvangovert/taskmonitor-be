<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectTimelineController;
use App\Http\Controllers\Api\TimelineRequirementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/users', [AuthController::class, 'users']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/overdue', [DashboardController::class, 'overdue']);
    Route::get('/dashboard/upcoming', [DashboardController::class, 'upcoming']);
    Route::get('/dashboard/critical', [DashboardController::class, 'critical']);

    // Projects
    Route::apiResource('projects', ProjectController::class);
    
    // Project Timelines (Nested under Project)
    Route::apiResource('projects.timelines', ProjectTimelineController::class);
    
    // Timeline Requirements (Nested under Timeline)
    Route::apiResource('timelines.requirements', TimelineRequirementController::class);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});
