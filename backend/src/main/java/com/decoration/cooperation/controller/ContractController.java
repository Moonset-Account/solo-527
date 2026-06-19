package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.entity.BizAttachment;
import com.decoration.cooperation.entity.BizContract;
import com.decoration.cooperation.service.BizAttachmentService;
import com.decoration.cooperation.service.BizContractService;
import com.decoration.cooperation.entity.SysUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final BizContractService bizContractService;
    private final BizAttachmentService bizAttachmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('contract:list')")
    public Result<PageResult<BizContract>> page(PageQuery pageQuery) {
        return Result.success(bizContractService.listContracts(pageQuery));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('contract:view')")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        return Result.success(bizContractService.getContractDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('contract:create')")
    public Result<Long> create(@RequestBody BizContract contract) {
        return Result.success(bizContractService.createContract(contract).getId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('contract:edit')")
    public Result<Void> update(@PathVariable Long id, @RequestBody BizContract contract) {
        contract.setId(id);
        bizContractService.updateById(contract);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('contract:edit')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        bizContractService.updateStatus(id, status, null);
        return Result.success();
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("hasAuthority('contract:view')")
    public Result<List<BizAttachment>> listAttachments(@PathVariable Long id) {
        return Result.success(bizAttachmentService.listByBiz("CONTRACT", id));
    }

    @PostMapping("/{id}/attachments")
    @PreAuthorize("hasAuthority('contract:edit')")
    public Result<BizAttachment> uploadAttachment(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        SysUser user = (SysUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return Result.success(bizAttachmentService.uploadAttachment("CONTRACT", id, file, user.getId(), user.getRealName()));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @PreAuthorize("hasAuthority('contract:edit')")
    public Result<Void> deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        bizAttachmentService.removeById(attachmentId);
        return Result.success();
    }
}
