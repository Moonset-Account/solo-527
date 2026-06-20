package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LeadRemark;
import com.decoration.crm.service.LeadRemarkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/remarks")
public class LeadRemarkController {

    @Autowired
    private LeadRemarkService leadRemarkService;

    @GetMapping("/lead/{leadId}")
    public Result<List<LeadRemark>> getByLeadId(@PathVariable Long leadId) {
        return Result.success(leadRemarkService.getByLeadId(leadId));
    }

    @PostMapping("/lead/{leadId}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<LeadRemark> create(@PathVariable Long leadId, @RequestBody Map<String, String> body) {
        return Result.success(leadRemarkService.create(leadId, body.get("content")));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<LeadRemark> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return Result.success(leadRemarkService.update(id, body.get("content")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        leadRemarkService.delete(id);
        return Result.success();
    }
}
