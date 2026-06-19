package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.dto.LeadCreateDTO;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.service.LeadService;
import com.decoration.cooperation.vo.LeadDetailVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @GetMapping
    @PreAuthorize("hasAuthority('lead:list')")
    public Result<PageResult<BizLead>> page(PageQuery query) {
        return Result.success(leadService.page(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('lead:list')")
    public Result<LeadDetailVO> getDetail(@PathVariable Long id) {
        return Result.success(leadService.getDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('lead:create')")
    public Result<Long> create(@Valid @RequestBody LeadCreateDTO dto) {
        return Result.success(leadService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('lead:update')")
    public Result<Void> update(@PathVariable Long id, @RequestBody BizLead lead) {
        leadService.update(id, lead);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('lead:update')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        leadService.updateStatus(id, status);
        return Result.success();
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('lead:assign')")
    public Result<Void> assign(@PathVariable Long id, @RequestParam Long ownerId) {
        leadService.assign(id, ownerId);
        return Result.success();
    }

    @GetMapping("/{id}/conflict")
    @PreAuthorize("hasAuthority('lead:list')")
    public Result<Map<String, Object>> checkConflict(@PathVariable Long id) {
        return Result.success(leadService.checkConflict(id));
    }
}
