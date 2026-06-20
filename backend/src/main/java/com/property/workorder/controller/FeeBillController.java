package com.property.workorder.controller;

import com.property.workorder.common.PageResult;
import com.property.workorder.common.Result;
import com.property.workorder.entity.FeeBill;
import com.property.workorder.entity.PaymentRecord;
import com.property.workorder.service.ExportService;
import com.property.workorder.service.FeeBillService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
public class FeeBillController {

    private final FeeBillService feeBillService;
    private final ExportService exportService;

    @GetMapping("/resident/{residentId}")
    public Result<PageResult<FeeBill>> getResidentBills(
            @PathVariable Long residentId,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status) {
        return Result.success(feeBillService.getResidentBills(residentId, current, size, status));
    }

    @GetMapping("/resident/{residentId}/summary")
    public Result<Map<String, Object>> getResidentBillSummary(@PathVariable Long residentId) {
        return Result.success(feeBillService.getResidentBillSummary(residentId));
    }

    @GetMapping("/query")
    public Result<PageResult<FeeBill>> queryBills(
            @RequestParam(required = false) String buildingNo,
            @RequestParam(required = false) String roomNo,
            @RequestParam(required = false) String feeType,
            @RequestParam(required = false) String billPeriod,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(feeBillService.queryBills(buildingNo, roomNo, feeType, billPeriod, status, current, size));
    }

    @GetMapping("/progress")
    public Result<List<Map<String, Object>>> getPaymentProgress(
            @RequestParam(required = false) String buildingNo,
            @RequestParam(required = false) String feeType,
            @RequestParam(required = false) String billPeriod) {
        return Result.success(feeBillService.getPaymentProgress(buildingNo, feeType, billPeriod));
    }

    @GetMapping("/export")
    public void exportBills(
            @RequestParam(required = false) String buildingNo,
            @RequestParam(required = false) String roomNo,
            @RequestParam(required = false) String feeType,
            @RequestParam(required = false) String billPeriod,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {
        List<FeeBill> bills = feeBillService.queryBillsForExport(buildingNo, roomNo, feeType, billPeriod, status);
        exportService.exportFeeBills(bills, response);
    }

    @GetMapping("/{id}")
    public Result<FeeBill> getBillDetail(@PathVariable Long id) {
        return Result.success(feeBillService.getBillDetail(id));
    }

    @PostMapping("/{id}/pay")
    public Result<PaymentRecord> payBill(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam String method,
            @RequestParam(required = false) Long operatorId) {
        return Result.success(feeBillService.payBill(id, amount, method, operatorId));
    }
}
