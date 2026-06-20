package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.DetectionRecord;
import com.carcore.admin.entity.DetectionRecordItem;
import com.carcore.admin.service.DetectionRecordService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/detection-records")
public class DetectionRecordController {

    private final DetectionRecordService detectionRecordService;

    public DetectionRecordController(DetectionRecordService detectionRecordService) {
        this.detectionRecordService = detectionRecordService;
    }

    @GetMapping("/{id}")
    public Result<DetectionRecord> getById(@PathVariable Long id) {
        return Result.success(detectionRecordService.getById(id));
    }

    @GetMapping("/no/{recordNo}")
    public Result<DetectionRecord> getByNo(@PathVariable String recordNo) {
        return Result.success(detectionRecordService.getByRecordNo(recordNo));
    }

    @GetMapping("/{id}/items")
    public Result<List<DetectionRecordItem>> getItems(@PathVariable Long id) {
        return Result.success(detectionRecordService.getRecordItems(id));
    }

    @GetMapping("/page")
    public Result<PageResult<DetectionRecord>> page(
            @RequestParam(required = false) String recordNo,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(detectionRecordService.page(
                recordNo, memberId, status, startDate, endDate, pageNum, pageSize));
    }

    @PostMapping
    public Result<DetectionRecord> create(@RequestBody DetectionRecordWithItems request) {
        return Result.success(detectionRecordService.create(
                request.getRecord(), request.getItems()));
    }

    @PutMapping
    public Result<DetectionRecord> update(@RequestBody DetectionRecord record) {
        return Result.success(detectionRecordService.update(record));
    }

    @PutMapping("/{id}/items")
    public Result<Void> updateItems(@PathVariable Long id,
                                    @RequestBody List<DetectionRecordItem> items) {
        detectionRecordService.updateRecordItems(id, items);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        detectionRecordService.updateStatus(id, status);
        return Result.success();
    }

    public static class DetectionRecordWithItems {
        private DetectionRecord record;
        private List<DetectionRecordItem> items;

        public DetectionRecord getRecord() {
            return record;
        }

        public void setRecord(DetectionRecord record) {
            this.record = record;
        }

        public List<DetectionRecordItem> getItems() {
            return items;
        }

        public void setItems(List<DetectionRecordItem> items) {
            this.items = items;
        }
    }
}
