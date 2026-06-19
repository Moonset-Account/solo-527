package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.service.ReportService;
import com.decoration.cooperation.vo.DealPredictionVO;
import com.decoration.cooperation.vo.PaymentProgressVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/deal-prediction")
    @PreAuthorize("hasAuthority('report:prediction')")
    public Result<DealPredictionVO> dealPrediction() {
        return Result.success(reportService.getDealPrediction());
    }

    @GetMapping("/payment-progress")
    @PreAuthorize("hasAuthority('report:payment')")
    public Result<PageResult<PaymentProgressVO>> paymentProgress(PageQuery pageQuery) {
        return Result.success(reportService.getPaymentProgressReport(pageQuery));
    }

    @GetMapping("/payment-progress/{contractId}")
    @PreAuthorize("hasAuthority('report:payment')")
    public Result<PaymentProgressVO> paymentProgressDetail(@PathVariable Long contractId) {
        return Result.success(reportService.getPaymentProgressDetail(contractId));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('dashboard')")
    public Result<Map<String, Object>> dashboard() {
        return Result.success(reportService.getDashboardStatistics());
    }
}
