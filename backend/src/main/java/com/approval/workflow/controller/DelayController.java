package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.dto.DelayQueryDTO;
import com.approval.workflow.entity.DelayRecord;
import com.approval.workflow.service.DelayService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/delays")
public class DelayController {

    private final DelayService delayService;

    public DelayController(DelayService delayService) {
        this.delayService = delayService;
    }

    @PostMapping
    public ApiResponse<DelayRecord> createDelayRecord(@RequestParam Long requirementId,
                                                      @RequestParam Integer delayDays,
                                                      @RequestParam String reason,
                                                      @RequestParam(required = false) Long responsibleDeptId,
                                                      @RequestParam(required = false) Long nodeId) {
        try {
            DelayRecord record = delayService.createDelayRecord(
                    requirementId, delayDays, reason, responsibleDeptId, nodeId);
            return ApiResponse.success(record);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/requirement/{requirementId}")
    public ApiResponse<List<DelayRecord>> getDelayRecordsByRequirement(@PathVariable Long requirementId) {
        List<DelayRecord> records = delayService.getDelayRecordsByRequirement(requirementId);
        return ApiResponse.success(records);
    }

    @PostMapping("/search")
    public ApiResponse<Page<DelayRecord>> searchDelayRecords(
            @RequestBody DelayQueryDTO query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DelayRecord> result = delayService.searchDelayRecords(query, pageable);
        return ApiResponse.success(result);
    }

    @PostMapping("/batch")
    public ApiResponse<List<DelayRecord>> getDelayRecordsByDeptIds(@RequestBody List<Long> deptIds) {
        List<DelayRecord> records = delayService.getDelayRecordsByDeptIds(deptIds);
        return ApiResponse.success(records);
    }

    @PostMapping("/stats")
    public ApiResponse<List<Object[]>> getDelayStatsByDeptIds(@RequestBody List<Long> deptIds) {
        List<Object[]> stats = delayService.getDelayStatisticsByDeptIds(deptIds);
        return ApiResponse.success(stats);
    }
}
