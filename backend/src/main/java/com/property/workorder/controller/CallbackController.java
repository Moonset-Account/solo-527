package com.property.workorder.controller;

import com.property.workorder.common.PageResult;
import com.property.workorder.common.Result;
import com.property.workorder.entity.CallbackRecord;
import com.property.workorder.service.CallbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/callbacks")
@RequiredArgsConstructor
public class CallbackController {

    private final CallbackService callbackService;

    @GetMapping("/query")
    public Result<PageResult<CallbackRecord>> queryCallbacks(
            @RequestParam(required = false) String callbackType,
            @RequestParam(required = false) String businessId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(callbackService.queryCallbacks(callbackType, businessId, status, current, size));
    }

    @GetMapping("/{id}")
    public Result<CallbackRecord> getCallbackDetail(@PathVariable Long id) {
        return Result.success(callbackService.getCallbackDetail(id));
    }

    @PostMapping
    public Result<CallbackRecord> createCallback(
            @RequestParam String callbackType,
            @RequestParam String url,
            @RequestParam(required = false) String businessId,
            @RequestParam(required = false) String businessType,
            @RequestBody(required = false) String requestBody) {
        return Result.success(callbackService.createCallback(callbackType, businessId, businessType, url, requestBody));
    }

    @PostMapping("/{id}/retry")
    public Result<CallbackRecord> manualRetry(@PathVariable Long id) {
        return Result.success(callbackService.manualRetry(id));
    }
}
