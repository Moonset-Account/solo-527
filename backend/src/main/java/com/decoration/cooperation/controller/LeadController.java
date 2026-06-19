package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.dto.LeadCreateDTO;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.service.BizLeadService;
import com.decoration.cooperation.vo.LeadDetailVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/leads")
@RequiredArgsConstructor
public class LeadController {

    private final BizLeadService bizLeadService;

    @GetMapping
    @PreAuthorize("hasAuthority('lead:list')")
    public Result<PageResult<BizLead>> page(PageQuery pageQuery) {
        return Result.success(bizLeadService.listLeads(pageQuery));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('lead:view')")
    public Result<LeadDetailVO> getDetail(@PathVariable Long id) {
        return Result.success(bizLeadService.getLeadDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('lead:create')")
    public Result<Long> create(@Valid @RequestBody LeadCreateDTO dto) {
        return Result.success(bizLeadService.createLead(dto).getId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('lead:edit')")
    public Result<Void> update(@PathVariable Long id, @RequestBody BizLead lead) {
        lead.setId(id);
        bizLeadService.updateLead(lead);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('lead:edit')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        bizLeadService.updateStatus(id, status, null);
        return Result.success();
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('lead:assign')")
    public Result<Void> assign(@PathVariable Long id, @RequestParam Long ownerId) {
        bizLeadService.assignLead(id, ownerId);
        return Result.success();
    }

    @GetMapping("/{id}/conflict")
    @PreAuthorize("hasAuthority('lead:view')")
    public Result<Map<String, Object>> checkConflict(@PathVariable Long id) {
        List<BizLead> list = bizLeadService.detectConflict(id);
        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("count", list.size());
        return Result.success(result);
    }
}
