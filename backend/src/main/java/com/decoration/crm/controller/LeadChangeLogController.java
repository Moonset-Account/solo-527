package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LeadChangeLog;
import com.decoration.crm.service.LeadChangeLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/change-logs")
public class LeadChangeLogController {

    @Autowired
    private LeadChangeLogService leadChangeLogService;

    @GetMapping("/lead/{leadId}")
    public Result<List<LeadChangeLog>> getByLeadId(@PathVariable Long leadId) {
        return Result.success(leadChangeLogService.getByLeadId(leadId));
    }
}
