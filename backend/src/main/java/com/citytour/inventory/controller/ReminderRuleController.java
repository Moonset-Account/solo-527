package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.ReminderRule;
import com.citytour.inventory.service.ReminderRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/reminder-rules")
@RequiredArgsConstructor
public class ReminderRuleController {

    private final ReminderRuleService reminderRuleService;

    @GetMapping
    public Result<PageResult<ReminderRule>> list(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @RequestParam(required = false) String ruleCode,
                                                @RequestParam(required = false) String ruleName,
                                                @RequestParam(required = false) String ruleType,
                                                @RequestParam(required = false) Boolean enabled) {
        return Result.success(reminderRuleService.list(page, size, ruleCode, ruleName, ruleType, enabled));
    }

    @GetMapping("/{id}")
    public Result<ReminderRule> getById(@PathVariable Long id) {
        return Result.success(reminderRuleService.getById(id));
    }

    @GetMapping("/code/{ruleCode}")
    public Result<ReminderRule> getByRuleCode(@PathVariable String ruleCode) {
        return Result.success(reminderRuleService.getByRuleCode(ruleCode));
    }

    @GetMapping("/type/{ruleType}")
    public Result<List<ReminderRule>> getEnabledRulesByType(@PathVariable String ruleType) {
        return Result.success(reminderRuleService.getEnabledRulesByType(ruleType));
    }

    @PostMapping
    public Result<ReminderRule> create(@RequestBody ReminderRule rule,
                                       @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(reminderRuleService.create(rule, operator));
    }

    @PutMapping
    public Result<ReminderRule> update(@RequestBody ReminderRule rule,
                                      @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(reminderRuleService.update(rule, operator));
    }

    @PutMapping("/{id}/toggle")
    public Result<ReminderRule> toggleEnabled(@PathVariable Long id,
                                             @RequestParam boolean enabled,
                                             @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(reminderRuleService.toggleEnabled(id, enabled, operator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        reminderRuleService.delete(id);
        return Result.success();
    }
}
