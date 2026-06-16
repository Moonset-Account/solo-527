package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.ReminderRuleDTO;
import com.pm.workstation.entity.ReminderRule;
import com.pm.workstation.service.ReminderService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    @Autowired
    private ReminderService reminderService;

    @PostMapping("/rules")
    public ApiResponseDTO<ReminderRule> createRule(@RequestBody ReminderRuleDTO dto) {
        return ApiResponseDTO.success(reminderService.createRule(dto));
    }

    @PutMapping("/rules/{id}")
    public ApiResponseDTO<ReminderRule> updateRule(@PathVariable Long id, @RequestBody ReminderRuleDTO dto) {
        return ApiResponseDTO.success(reminderService.updateRule(id, dto));
    }

    @DeleteMapping("/rules/{id}")
    public ApiResponseDTO<Void> deleteRule(@PathVariable Long id) {
        reminderService.deleteRule(id);
        return ApiResponseDTO.success(null);
    }

    @GetMapping("/rules")
    public ApiResponseDTO<List<ReminderRule>> getEnabledRules() {
        return ApiResponseDTO.success(reminderService.getEnabledRules());
    }
}
