<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>阶段报告 - {{ $report->title }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        h1 { text-align: center; font-size: 20px; }
        h2 { font-size: 16px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; }
        th { background: #f0f0f0; }
        .info { margin: 10px 0; }
        .info span { margin-right: 30px; }
    </style>
</head>
<body>
    <h1>{{ $report->title }}</h1>
    <div class="info">
        <span>班级：{{ $report->artClass->name }}</span>
        <span>阶段类型：{{ $report->stage_type }}</span>
        <span>周期：{{ $report->start_date->format('Y-m-d') }} ~ {{ $report->end_date->format('Y-m-d') }}</span>
    </div>
    <h2>学员成绩明细</h2>
    <table>
        <thead>
            <tr>
                <th>学员</th>
                <th>出勤率</th>
                <th>作业得分</th>
                <th>作品得分</th>
                <th>综合得分</th>
                <th>教师评语</th>
            </tr>
        </thead>
        <tbody>
            @foreach($report->items as $item)
            <tr>
                <td>{{ $item->student->name }}</td>
                <td>{{ $item->attendance_rate }}%</td>
                <td>{{ $item->homework_score }}</td>
                <td>{{ $item->artwork_score }}</td>
                <td>{{ $item->overall_score }}</td>
                <td>{{ $item->teacher_comment }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
