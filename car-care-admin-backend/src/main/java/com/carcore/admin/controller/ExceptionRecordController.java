package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.ExceptionRecord;
import com.carcore.admin.service.ExceptionRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exception-records")
public class ExceptionRecordController {

    private final ExceptionRecordService exceptionRecordService;

    public ExceptionRecordController(ExceptionRecordService exceptionRecordService) {
        this.exceptionRecordService = exceptionRecordService;
    }

    @GetMapping("/{id}")
    public Result<ExceptionRecord> getById(@PathVariable Long id) {
        return Result.success(exceptionRecordService.getById(id));
    }

    @GetMapping("/no/{exceptionNo}")
    public Result<ExceptionRecord> getByNo(@PathVariable String exceptionNo) {
        return Result.success(exceptionRecordService.getByExceptionNo(exceptionNo));
    }

    @GetMapping("/batch/{batchOperationId}")
    public Result<List<ExceptionRecord>> getByBatchOperationId(@PathVariable Long batchOperationId) {
        return Result.success(exceptionRecordService.getByBatchOperationId(batchOperationId));
    }

    @GetMapping("/page")
    public Result<PageResult<ExceptionRecord>> page(
            @RequestParam(required = false) String exceptionNo,
            @RequestParam(required = false) String exceptionType,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) Long batchOperationId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(exceptionRecordService.page(
                exceptionNo, exceptionType, sourceType, batchOperationId,
                status, pageNum, pageSize));
    }

    @PostMapping("/{id}/handle")
    public Result<ExceptionRecord> handleException(@PathVariable Long id,
                                                    @RequestBody HandleRequest request) {
        return Result.success(exceptionRecordService.handleException(
                id, request.getHandlerId(), request.getHandleResult()));
    }

    @PostMapping("/{id}/ignore")
    public Result<ExceptionRecord> ignoreException(@PathVariable Long id,
                                                    @RequestBody HandleRequest request) {
        return Result.success(exceptionRecordService.ignoreException(
                id, request.getHandlerId(), request.getHandleResult()));
    }

    @PostMapping("/{id}/retry")
    public Result<Void> retryException(@PathVariable Long id) {
        exceptionRecordService.retryException(id);
        return Result.success();
    }

    public static class HandleRequest {
        private Long handlerId;
        private String handleResult;

        public Long getHandlerId() {
            return handlerId;
        }

        public void setHandlerId(Long handlerId) {
            this.handlerId = handlerId;
        }

        public String getHandleResult() {
            return handleResult;
        }

        public void setHandleResult(String handleResult) {
            this.handleResult = handleResult;
        }
    }
}
