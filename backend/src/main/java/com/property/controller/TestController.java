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
        
        Map<String, Object> admin = new HashMap<>();
        admin.put("username", "admin");
        admin.put("password", "123456");
        admin.put("role", "ADMIN");
        accounts.put("物业主管", admin);
        
        Map<String, Object> property = new HashMap<>();
        property.put("username", "property01");
        property.put("password", "123456");
        property.put("role", "PROPERTY");
        accounts.put("物业人员", property);
        
        Map<String, Object> maint = new HashMap<>();
        maint.put("username", "maint01");
        maint.put("password", "123456");
        maint.put("role", "MAINTENANCE");
        accounts.put("维修人员", maint);
        
        Map<String, Object> inspector = new HashMap<>();
        inspector.put("username", "inspector01");
        inspector.put("password", "123456");
        inspector.put("role", "INSPECTOR");
        accounts.put("巡检人员", inspector);
        
        Map<String, Object> owner = new HashMap<>();
        owner.put("username", "owner01");
        owner.put("password", "123456");
        owner.put("role", "OWNER");
        accounts.put("业主账号", owner);
        
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
