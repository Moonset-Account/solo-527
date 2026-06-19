package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.dto.ApprovalActionDTO;
import com.decoration.cooperation.dto.DiscountApprovalCreateDTO;
import com.decoration.cooperation.entity.BizDiscountApproval;
import com.decoration.cooperation.service.ApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    @PreAuthorize("hasAuthority('approval:list')")
    public Result<PageResult<BizDiscountApproval>> page(PageQuery query) {
        return Result.success(approvalService.page(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('approval:list')")
    public Result<BizDiscountApproval> getById(@PathVariable Long id) {
        return Result.success(approvalService.getById(id));
    }

    @PostMapping("/discount")
    @PreAuthorize("hasAuthority('approval:create')")
    public Result<Long> createDiscountApproval(@Valid @RequestBody DiscountApprovalCreateDTO dto) {
        return Result.success(approvalService.createDiscountApproval(dto));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('approval:submit')")
    public Result<Void> submit(@PathVariable Long id) {
        approvalService.submit(id);
        return Result.success();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('approval:approve')")
    public Result<Void> approve(@PathVariable Long id, @RequestBody ApprovalActionDTO dto) {
        approvalService.approve(id, dto);
        return Result.success();
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('approval:approve')")
    public Result<Void> reject(@PathVariable Long id, @RequestBody ApprovalActionDTO dto) {
        approvalService.reject(id, dto);
        return Result.success();
    }
}
