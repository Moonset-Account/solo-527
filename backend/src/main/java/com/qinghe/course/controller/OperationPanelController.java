package com.qinghe.course.controller;

import com.qinghe.course.common.Result;
import com.qinghe.course.entity.Attachment;
import com.qinghe.course.entity.ChangeHistory;
import com.qinghe.course.entity.Remark;
import com.qinghe.course.entity.StatusFlow;
import com.qinghe.course.service.OperationPanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/panel")
@RequiredArgsConstructor
public class OperationPanelController {

    private final OperationPanelService operationPanelService;

    @GetMapping("/{bizType}/{bizId}/attachments")
    public Result<List<Attachment>> getAttachments(@PathVariable String bizType, @PathVariable Long bizId) {
        return Result.success(operationPanelService.getAttachments(bizType, bizId));
    }

    @PostMapping("/{bizType}/{bizId}/attachments")
    public Result<Attachment> addAttachment(@PathVariable String bizType,
                                            @PathVariable Long bizId,
                                            @RequestBody Attachment attachment) {
        return Result.success(operationPanelService.addAttachment(bizType, bizId, attachment));
    }

    @DeleteMapping("/attachments/{id}")
    public Result<?> deleteAttachment(@PathVariable Long id) {
        operationPanelService.deleteAttachment(id);
        return Result.success();
    }

    @GetMapping("/{bizType}/{bizId}/remarks")
    public Result<List<Remark>> getRemarks(@PathVariable String bizType, @PathVariable Long bizId) {
        return Result.success(operationPanelService.getRemarks(bizType, bizId));
    }

    @PostMapping("/{bizType}/{bizId}/remarks")
    public Result<Remark> addRemark(@PathVariable String bizType,
                                    @PathVariable Long bizId,
                                    @RequestBody RemarkRequest request) {
        return Result.success(operationPanelService.addRemark(bizType, bizId, request.getContent()));
    }

    @GetMapping("/{bizType}/{bizId}/history")
    public Result<List<ChangeHistory>> getChangeHistory(@PathVariable String bizType, @PathVariable Long bizId) {
        return Result.success(operationPanelService.getChangeHistories(bizType, bizId));
    }

    @GetMapping("/{bizType}/{bizId}/status-flow")
    public Result<List<StatusFlow>> getStatusFlow(@PathVariable String bizType, @PathVariable Long bizId) {
        return Result.success(operationPanelService.getStatusFlows(bizType, bizId));
    }

    public static class RemarkRequest {
        private String content;

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
