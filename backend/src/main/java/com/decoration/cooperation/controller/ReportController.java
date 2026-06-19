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

    @GetMapping("/payment-progress")
    @PreAuthorize("hasAuthority('report:view')")
    public Result<PageResult<PaymentProgressVO>> paymentProgressPage(PageQuery query) {
        return Result.success(reportService.paymentProgressPage(query));
    }

    @GetMapping("/payment-progress/{contractId}")
    @PreAuthorize("hasAuthority('report:view')")
    public Result<PaymentProgressVO> paymentProgressDetail(@PathVariable Long contractId) {
        return Result.success(reportService.paymentProgressDetail(contractId));
    }

    @GetMapping("/deal-prediction")
    @PreAuthorize("hasAuthority('report:view')")
    public Result<DealPredictionVO> dealPrediction() {
        return Result.success(reportService.dealPrediction());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, Object>> dashboard() {
        return Result.success(reportService.dashboard());
    }
}
