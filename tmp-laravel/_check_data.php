<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$stats = [
    'users' => App\Models\User::count(),
    'checklists' => App\Models\Checklist::count(),
    'checklist_items' => App\Models\ChecklistItem::count(),
    'checklist_records' => App\Models\ChecklistRecord::count(),
    'checklist_record_items' => App\Models\ChecklistRecordItem::count(),
    'compliance_gaps' => App\Models\ComplianceGap::count(),
    'gap_handling_logs' => App\Models\GapHandlingLog::count(),
    'gap_evidences' => App\Models\GapEvidence::count(),
    'reminder_rules' => App\Models\ReminderRule::count(),
    'reminder_logs' => App\Models\ReminderLog::count(),
    'saved_filters' => App\Models\SavedFilter::count(),
    'download_logs' => App\Models\DownloadLog::count(),
];

foreach ($stats as $k => $v) {
    echo str_pad($k, 30) . " => " . $v . PHP_EOL;
}

echo PHP_EOL;
$gap = App\Models\ComplianceGap::first(['gap_no', 'title', 'severity', 'status']);
echo "First gap: " . json_encode($gap?->toArray()) . PHP_EOL;

echo PHP_EOL . "All users:" . PHP_EOL;
foreach (App\Models\User::get(['name', 'email', 'role', 'department']) as $u) {
    echo "  - {$u->name} ({$u->email}) [{$u->role}] - {$u->department}" . PHP_EOL;
}
