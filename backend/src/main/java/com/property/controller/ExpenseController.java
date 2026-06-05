package com.property.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.property.common.Result;
import com.property.entity.ExpenseRecord;
import com.property.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @PostMapping
    public Result<ExpenseRecord> createExpense(
            @RequestParam(required = false) Long workOrderId,
            @RequestParam String expenseType,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long payerId) {
        return expenseService.createExpense(workOrderId, expenseType, amount, description, payerId);
    }

    @PostMapping("/{id}/pay")
    public Result<ExpenseRecord> payExpense(
            @PathVariable Long id,
            @RequestParam(defaultValue = "WECHAT") String payMethod) {
        return expenseService.payExpense(id, payMethod);
    }

    @GetMapping
    public Result<IPage<ExpenseRecord>> getExpensePage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String payStatus,
            @RequestParam(required = false) Long workOrderId) {
        return Result.success(expenseService.getExpensePage(page, size, payStatus, workOrderId));
    }
}
