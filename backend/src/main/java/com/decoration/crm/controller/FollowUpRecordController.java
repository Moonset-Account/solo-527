package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.FollowUpRecord;
import com.decoration.crm.service.FollowUpRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/follow-ups")
public class FollowUpRecordController {

    @Autowired
    private FollowUpRecordService followUpRecordService;

    @GetMapping("/lead/{leadId}")
    public Result<List<FollowUpRecord>> getByLeadId(@PathVariable Long leadId) {
        return Result.success(followUpRecordService.getByLeadId(leadId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<FollowUpRecord> create(@RequestBody FollowUpRecord record) {
        return Result.success(followUpRecordService.create(record));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<FollowUpRecord> update(@PathVariable Long id, @RequestBody FollowUpRecord record) {
        return Result.success(followUpRecordService.update(id, record));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        followUpRecordService.delete(id);
        return Result.success();
    }
}
