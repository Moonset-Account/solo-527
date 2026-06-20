package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.AnomalyRecord;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.service.AnomalyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/anomalies")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyService anomalyService;

    @GetMapping
    public ApiResponse<Page<AnomalyRecord>> getAnomalyList(
        @RequestParam(required = false) String severity,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String metricName,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "anomalyTime"));
        return anomalyService.getAnomalyList(severity, status, metricName, startTime, endTime, pageable);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getAnomalyStats() {
        return anomalyService.getAnomalyStats();
    }

    @GetMapping("/{id}")
    public ApiResponse<AnomalyRecord> getAnomalyDetail(@PathVariable Long id) {
        return anomalyService.getAnomalyDetail(id);
    }

    @PostMapping
    public ApiResponse<AnomalyRecord> createAnomaly(@RequestBody AnomalyRecord record) {
        return anomalyService.createAnomaly(record);
    }

    @PutMapping("/{id}/handle")
    public ApiResponse<AnomalyRecord> handleAnomaly(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? ((SysUser) auth.getPrincipal()).getUsername() : "system";
        return anomalyService.handleAnomaly(id, username);
    }

    @PutMapping("/{id}/resolve")
    public ApiResponse<AnomalyRecord> resolveAnomaly(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? ((SysUser) auth.getPrincipal()).getUsername() : "system";
        String remark = body != null ? body.get("remark") : null;
        return anomalyService.resolveAnomaly(id, username, remark);
    }
}
