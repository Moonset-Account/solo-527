<?php

namespace App\Http\Controllers;

use App\Models\ArtClass;
use App\Models\EnrollmentConversion;
use App\Models\HomeSchoolFeedback;
use App\Models\ScheduleConflict;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TrialBooking;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'totalClasses' => ArtClass::count(),
            'totalStudents' => Student::count(),
            'totalTeachers' => Teacher::count(),
            'recentFeedback' => HomeSchoolFeedback::with(['student', 'teacher'])
                ->latest()
                ->take(5)
                ->get(),
            'upcomingTrials' => TrialBooking::where('status', 'pending')->count(),
            'pendingConflicts' => ScheduleConflict::where('resolution_status', 'pending')->count(),
            'monthlyConversions' => EnrollmentConversion::whereMonth('converted_at', now()->month)
                ->whereYear('converted_at', now()->year)
                ->count(),
        ]);
    }
}
