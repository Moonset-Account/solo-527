package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DataDelayMonitor;
import com.datagrowth.portal.service.DataDelayService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/data-delay")
@RequiredArgsConstructor
public class DataDelayController {

    private final DataDelayService delayService;

    @GetMapping
    public ApiResponse<Page<DataDelayMonitor>> getDelayList(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "delayMinutes"));
        return delayService.getDelayList(status, pageable);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getDelayStats() {
        return delayService.getDelayStats();
    }

    @GetMapping("/notifications")
    public ApiResponse<List<Map<String, Object>>> getPendingNotifications() {
        return delayService.getPendingNotifications();
    }

    @GetMapping("/{id}")
    public ApiResponse<DataDelayMonitor> getDelayDetail(@PathVariable Long id) {
        return delayService.getDelayDetail(id);
    }

    @PutMapping("/{id}")
    public ApiResponse<DataDelayMonitor> updateDelayMonitor(
        @PathVariable Long id,
        @RequestBody DataDelayMonitor monitor
    ) {
        return delayService.updateDelayMonitor(id, monitor);
    }

    @DeleteMapping("/notifications/{index}")
    public ApiResponse<Void> clearNotification(@PathVariable int index) {
        return delayService.clearNotification(index);
    }

    @DeleteMapping("/notifications")
    public ApiResponse<Void> clearAllNotifications() {
        return delayService.clearAllNotifications();
    }
}
