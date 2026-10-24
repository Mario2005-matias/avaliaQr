<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService,
    ) {}

    public function monthly(string $month): Response
    {
        validator(['month' => $month], [
            'month' => ['required', 'date_format:Y-m'],
        ])->validate();

        $data = $this->reportService->generateMonthlyReport($month);

        return Pdf::loadView('reports.monthly', $data)
            ->setPaper('a4', 'portrait')
            ->download("relatorio-mensal-{$month}.pdf");
    }

    public function technician(int $id, string $month): Response
    {
        validator(['month' => $month], [
            'month' => ['required', 'date_format:Y-m'],
        ])->validate();

        $data = $this->reportService->generateTechnicianReport($id, $month);

        return Pdf::loadView('reports.technician', $data)
            ->setPaper('a4', 'portrait')
            ->download("relatorio-tecnico-{$id}-{$month}.pdf");
    }
}
