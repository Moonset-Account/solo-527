package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.ExportLog;
import com.citytour.inventory.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/logs")
    public Result<PageResult<ExportLog>> listExportLogs(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    @RequestParam(required = false) String exportNo,
                                                    @RequestParam(required = false) String exportType,
                                                    @RequestParam(required = false) String exportBy,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
                                                    @RequestParam(required = false) String status) {
        return Result.success(exportService.listExportLogs(page, size, exportNo, exportType,
                exportBy, startTime, endTime, status));
    }

    @GetMapping("/logs/{exportNo}")
    public Result<ExportLog> getExportLog(@PathVariable String exportNo) {
        return Result.success(exportService.getExportLogByNo(exportNo));
    }

    @GetMapping("/inventory-details")
    public void exportInventoryDetails(HttpServletResponse response,
                                       @RequestParam(required = false) String hotelCode,
                                       @RequestParam(required = false) String roomType,
                                       @RequestParam(required = false) String roomNumber,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                       @RequestParam(required = false) String roomStatus,
                                       @RequestParam(required = false) String cleanStatus,
                                       @RequestHeader(value = "X-User", defaultValue = "admin") String operator) throws IOException {
        exportService.exportInventoryDetails(response, hotelCode, roomType, roomNumber,
                startDate, endDate, roomStatus, cleanStatus, operator);
    }
}
