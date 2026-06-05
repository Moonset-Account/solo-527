package com.property.controller;

import com.property.common.Result;
import com.property.common.enums.UserRoleEnum;
import com.property.common.enums.WorkOrderPriorityEnum;
import com.property.common.enums.WorkOrderStatusEnum;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping("/hello")
    public Result<String> hello() {
        return Result.success("物业报修和巡检系统API运行正常！");
    }

    @GetMapping("/test-accounts")
    public Result<Map<String, Object>> getTestAccounts() {
        Map<String, Object> accounts = new HashMap<>();
        accounts.put("物业主管", Map.of("username", "admin", "password", "123456", "role", "ADMIN"));
        accounts.put("物业人员", Map.of("username", "property01", "password", "123456", "role", "PROPERTY"));
        accounts.put("维修人员", Map.of("username", "maint01", "password", "123456", "role", "MAINTENANCE"));
        accounts.put("巡检人员", Map.of("username", "inspector01", "password", "123456", "role", "INSPECTOR"));
        accounts.put("业主账号", Map.of("username", "owner01", "password", "123456", "role", "OWNER"));
        return Result.success(accounts);
    }

    @GetMapping("/enums")
    public Result<Map<String, Object>> getEnums() {
        Map<String, Object> enums = new HashMap<>();
        enums.put("userRoles", UserRoleEnum.values());
        enums.put("orderStatus", WorkOrderStatusEnum.values());
        enums.put("orderPriority", WorkOrderPriorityEnum.values());
        return Result.success(enums);
    }

    @GetMapping("/workflow")
    public Result<Map<String, String>> getWorkflow() {
        Map<String, String> workflow = new HashMap<>();
        workflow.put("PENDING->APPROVED", "审核通过，派单给维修人员");
        workflow.put("PENDING->REJECTED", "审核驳回，通知业主");
        workflow.put("APPROVED->PROCESSING", "维修人员开始处理");
        workflow.put("PROCESSING->COMPLETED", "处理完成，等待业主验收");
        workflow.put("COMPLETED->CLOSED", "业主验收通过（需上传处理照片）");
        workflow.put("CLOSED->*", "已关闭，不可再变更");
        return Result.success(workflow);
    }
}
