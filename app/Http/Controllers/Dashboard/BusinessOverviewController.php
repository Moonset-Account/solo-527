<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\CashFlowService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessOverviewController extends Controller
{
    public function __construct(
        protected CashFlowService $cashFlowService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Dashboard/BusinessOverview/Index');
    }

    public function collectionRhythm($projectId): Response
    {
        $data = $this->cashFlowService->getCollectionRhythm((int) $projectId);

        return Inertia::render('Dashboard/BusinessOverview/CollectionRhythm', [
            'project_id' => (int) $projectId,
            'summary' => $data['summary'],
            'aging_report' => $data['aging_report'],
            'collection_trend' => $data['collection_trend'],
            'recent_efforts' => $data['recent_efforts'],
            'recommendations' => $data['recommendations'],
        ]);
    }

    public function cashForecast($projectId): Response
    {
        $forecast = $this->cashFlowService->forecastCashFlow((int) $projectId, 12);

        return Inertia::render('Dashboard/BusinessOverview/CashForecast', [
            'project_id' => (int) $projectId,
            'forecast' => $forecast,
        ]);
    }

    public function paymentFlow($projectId): Response
    {
        $payments = $this->cashFlowService->getPaymentSchedule((int) $projectId);

        return Inertia::render('Dashboard/BusinessOverview/PaymentFlow', [
            'project_id' => (int) $projectId,
            'payments' => $payments,
        ]);
    }
}
