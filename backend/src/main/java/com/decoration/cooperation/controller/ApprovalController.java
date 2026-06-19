package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.dto.ApprovalActionDTO;
import com.decoration.cooperation.dto.DiscountApprovalCreateDTO;
import com.decoration.cooperation.entity.BizDiscountApproval;
import com.decoration.cooperation.service.BizDiscountApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final BizDiscountApprovalService bizDiscountApprovalService;

    @GetMapping
    @PreAuthorize("hasAuthority('approval:discount')")
    public Result<PageResult<BizDiscountApproval>> page(PageQuery pageQuery) {
        return Result.success(bizDiscountApprovalService.listApprovals(pageQuery));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('approval:discount')")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        return Result.success(bizDiscountApprovalService.getApprovalDetail(id));
    }

    @PostMapping("/discount")
    @PreAuthorize("hasAuthority('approval:discount')")
    public Result<Long> createDiscountApproval(@Valid @RequestBody DiscountApprovalCreateDTO dto) {
        return Result.success(bizDiscountApprovalService.createApproval(dto).getId());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('approval:discount')")
    public Result<Void> submit(@PathVariable Long id) {
        bizDiscountApprovalService.submitApproval(id);
        return Result.success();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('approval:discount')")
    public Result<Void> approve(@PathVariable Long id, @Valid @RequestBody ApprovalActionDTO dto) {
        dto.setApprovalId(id);
        bizDiscountApprovalService.approve(dto);
        return Result.success();
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('approval:discount')")
    public Result<Void> reject(@PathVariable Long id, @Valid @RequestBody ApprovalActionDTO dto) {
        dto.setApprovalId(id);
        bizDiscountApprovalService.reject(dto);
        return Result.success();
    }
}
