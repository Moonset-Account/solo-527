package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.TestDriveRecord;
import com.carcore.admin.service.TestDriveRecordService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/test-drive-records")
public class TestDriveRecordController {

    private final TestDriveRecordService testDriveRecordService;

    public TestDriveRecordController(TestDriveRecordService testDriveRecordService) {
        this.testDriveRecordService = testDriveRecordService;
    }

    @GetMapping("/{id}")
    public Result<TestDriveRecord> getById(@PathVariable Long id) {
        return Result.success(testDriveRecordService.getById(id));
    }

    @GetMapping("/no/{driveNo}")
    public Result<TestDriveRecord> getByNo(@PathVariable String driveNo) {
        return Result.success(testDriveRecordService.getByDriveNo(driveNo));
    }

    @GetMapping("/page")
    public Result<PageResult<TestDriveRecord>> page(
            @RequestParam(required = false) String driveNo,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) Long workstationId,
            @RequestParam(required = false) Long repairOrderId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(testDriveRecordService.page(
                driveNo, memberId, technicianId, workstationId, repairOrderId,
                status, startTime, endTime, pageNum, pageSize));
    }

    @PostMapping
    public Result<TestDriveRecord> create(@RequestBody TestDriveRecord record) {
        return Result.success(testDriveRecordService.create(record));
    }

    @PutMapping
    public Result<TestDriveRecord> update(@RequestBody TestDriveRecord record) {
        return Result.success(testDriveRecordService.update(record));
    }

    @PostMapping("/{id}/start")
    public Result<TestDriveRecord> startDrive(@PathVariable Long id) {
        return Result.success(testDriveRecordService.startDrive(id));
    }

    @PostMapping("/{id}/end")
    public Result<TestDriveRecord> endDrive(@PathVariable Long id,
                                            @RequestBody EndDriveRequest request) {
        return Result.success(testDriveRecordService.endDrive(
                id, request.getDriveResult(), request.getProblemsFound()));
    }

    @PostMapping("/{id}/cancel")
    public Result<Void> cancelDrive(@PathVariable Long id) {
        testDriveRecordService.cancelDrive(id);
        return Result.success();
    }

    public static class EndDriveRequest {
        private String driveResult;
        private String problemsFound;

        public String getDriveResult() {
            return driveResult;
        }

        public void setDriveResult(String driveResult) {
            this.driveResult = driveResult;
        }

        public String getProblemsFound() {
            return problemsFound;
        }

        public void setProblemsFound(String problemsFound) {
            this.problemsFound = problemsFound;
        }
    }
}
