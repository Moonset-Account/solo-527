package com.property.workorder.controller;

import com.property.workorder.common.PageResult;
import com.property.workorder.common.Result;
import com.property.workorder.entity.VisitorAppointment;
import com.property.workorder.service.ExportService;
import com.property.workorder.service.VisitorService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/visitors")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorService visitorService;
    private final ExportService exportService;

    @GetMapping("/query")
    public Result<PageResult<VisitorAppointment>> queryAppointments(
            @RequestParam(required = false) String visitorName,
            @RequestParam(required = false) String visitorPhone,
            @RequestParam(required = false) String buildingNo,
            @RequestParam(required = false) String roomNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate visitDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(visitorService.queryAppointments(visitorName, visitorPhone, buildingNo, roomNo, visitDate, status, current, size));
    }

    @GetMapping("/export")
    public void exportAppointments(
            @RequestParam(required = false) String visitorName,
            @RequestParam(required = false) String visitorPhone,
            @RequestParam(required = false) String buildingNo,
            @RequestParam(required = false) String roomNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate visitDate,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {
        List<VisitorAppointment> list = visitorService.queryAppointmentsForExport(visitorName, visitorPhone, buildingNo, roomNo, visitDate, status);
        exportService.exportVisitors(list, response);
    }

    @PostMapping
    public Result<VisitorAppointment> createAppointment(@RequestBody VisitorAppointment appointment) {
        return Result.success(visitorService.createAppointment(appointment));
    }

    @PutMapping("/{id}/approve")
    public Result<VisitorAppointment> approveAppointment(
            @PathVariable Long id,
            @RequestParam Long staffId,
            @RequestParam boolean approved) {
        return Result.success(visitorService.approveAppointment(id, staffId, approved));
    }

    @PutMapping("/{id}/check-in")
    public Result<VisitorAppointment> checkIn(@PathVariable Long id) {
        return Result.success(visitorService.checkIn(id));
    }

    @PutMapping("/{id}/check-out")
    public Result<VisitorAppointment> checkOut(@PathVariable Long id) {
        return Result.success(visitorService.checkOut(id));
    }
}
