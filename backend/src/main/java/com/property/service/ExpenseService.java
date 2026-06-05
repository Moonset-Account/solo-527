package com.property.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.common.Result;
import com.property.common.UserContext;
import com.property.common.enums.UserRoleEnum;
import com.property.entity.*;
import com.property.mapper.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Service
public class ExpenseService {

    private static final Logger log = LoggerFactory.getLogger(ExpenseService.class);

    @Autowired
    private ExpenseRecordMapper expenseRecordMapper;

    @Autowired
    private WorkOrderMapper workOrderMapper;

    @Autowired
    private OwnerMapper ownerMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private MessageService messageService;

    @Transactional(rollbackFor = Exception.class)
    public Result<ExpenseRecord> createExpense(Long workOrderId, String expenseType, BigDecimal amount,
                                               String description, Long payerId) {
        SysUser currentUser = UserContext.getUser();
        String role = currentUser.getRole();

        if (!UserRoleEnum.ADMIN.getCode().equals(role) && !UserRoleEnum.PROPERTY.getCode().equals(role)) {
            return Result.forbidden("无权限创建费用记录");
        }

        if (workOrderId != null) {
            WorkOrder order = workOrderMapper.selectById(workOrderId);
            if (order == null) {
                return Result.validateError("工单不存在");
            }
        }

        ExpenseRecord expense = new ExpenseRecord();
        expense.setExpenseNo(generateExpenseNo());
        expense.setWorkOrderId(workOrderId);
        expense.setExpenseType(expenseType);
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setPayerId(payerId);
        expense.setPayStatus("UNPAID");
        expense.setOperatorId(currentUser.getId());

        expenseRecordMapper.insert(expense);

        if (payerId != null) {
            Owner owner = ownerMapper.selectById(payerId);
            if (owner != null) {
                messageService.sendMessage(owner.getUserId(), currentUser.getId(),
                        com.property.common.enums.MessageTypeEnum.SYSTEM_NOTICE,
                        "费用通知", "您有新的费用待缴纳，金额：" + amount + "元",
                        "EXPENSE", expense.getId(), "NORMAL");
            }
        }

        log.info("费用记录创建成功: expenseNo={}, amount={}", expense.getExpenseNo(), amount);

        return Result.success("费用创建成功", expense);
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<ExpenseRecord> payExpense(Long expenseId, String payMethod) {
        SysUser currentUser = UserContext.getUser();

        ExpenseRecord expense = expenseRecordMapper.selectById(expenseId);
        if (expense == null) {
            return Result.validateError("费用记录不存在");
        }

        if ("PAID".equals(expense.getPayStatus())) {
            return Result.validateError("该费用已缴纳");
        }

        String role = currentUser.getRole();
        if (UserRoleEnum.OWNER.getCode().equals(role)) {
            Owner owner = ownerMapper.selectOne(
                    new LambdaQueryWrapper<Owner>().eq(Owner::getUserId, currentUser.getId())
            );
            if (owner == null || !owner.getId().equals(expense.getPayerId())) {
                return Result.forbidden("您不是该费用的缴纳人");
            }
        }

        expense.setPayStatus("PAID");
        expense.setPayTime(LocalDateTime.now());
        expense.setPayMethod(payMethod);

        expenseRecordMapper.updateById(expense);

        if (expense.getWorkOrderId() != null) {
            WorkOrder order = workOrderMapper.selectById(expense.getWorkOrderId());
            if (order != null && order.getIsPaid() == 0) {
                BigDecimal totalPaid = expenseRecordMapper.selectList(
                        new LambdaQueryWrapper<ExpenseRecord>()
                                .eq(ExpenseRecord::getWorkOrderId, expense.getWorkOrderId())
                                .eq(ExpenseRecord::getPayStatus, "PAID")
                ).stream().map(ExpenseRecord::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalPaid.compareTo(order.getActualCost()) >= 0) {
                    order.setIsPaid(1);
                    order.setPayTime(LocalDateTime.now());
                    workOrderMapper.updateById(order);
                }
            }
        }

        log.info("费用缴纳成功: expenseId={}, amount={}, payMethod={}", expenseId, expense.getAmount(), payMethod);

        return Result.success("缴费成功", expense);
    }

    public IPage<ExpenseRecord> getExpensePage(int page, int size, String payStatus, Long workOrderId) {
        SysUser currentUser = UserContext.getUser();
        String role = currentUser.getRole();

        LambdaQueryWrapper<ExpenseRecord> wrapper = new LambdaQueryWrapper<>();

        if (UserRoleEnum.OWNER.getCode().equals(role)) {
            Owner owner = ownerMapper.selectOne(
                    new LambdaQueryWrapper<Owner>().eq(Owner::getUserId, currentUser.getId())
            );
            if (owner != null) {
                wrapper.eq(ExpenseRecord::getPayerId, owner.getId());
            }
        }

        if (StrUtil.isNotBlank(payStatus)) {
            wrapper.eq(ExpenseRecord::getPayStatus, payStatus);
        }
        if (workOrderId != null) {
            wrapper.eq(ExpenseRecord::getWorkOrderId, workOrderId);
        }

        wrapper.orderByDesc(ExpenseRecord::getCreatedAt);

        Page<ExpenseRecord> pageParam = new Page<>(page, size);
        IPage<ExpenseRecord> result = expenseRecordMapper.selectPage(pageParam, wrapper);

        result.getRecords().forEach(this::fillExpenseInfo);
        result.getRecords().forEach(this::filterSensitiveFields);

        return result;
    }

    private void fillExpenseInfo(ExpenseRecord expense) {
        if (expense.getWorkOrderId() != null) {
            WorkOrder order = workOrderMapper.selectById(expense.getWorkOrderId());
            if (order != null) {
                expense.setOrderNo(order.getOrderNo());
            }
        }

        if (expense.getPayerId() != null) {
            Owner owner = ownerMapper.selectById(expense.getPayerId());
            if (owner != null) {
                SysUser user = sysUserMapper.selectById(owner.getUserId());
                if (user != null) {
                    expense.setPayerName(user.getRealName());
                }
            }
        }

        if (expense.getOperatorId() != null) {
            SysUser operator = sysUserMapper.selectById(expense.getOperatorId());
            if (operator != null) {
                expense.setOperatorName(operator.getRealName());
            }
        }
    }

    private void filterSensitiveFields(ExpenseRecord expense) {
        SysUser currentUser = UserContext.getUser();
        if (currentUser == null) return;

        String role = currentUser.getRole();

        if (UserRoleEnum.OWNER.getCode().equals(role)) {
            expense.setOperatorId(null);
            expense.setOperatorName(null);
        }
    }

    private String generateExpenseNo() {
        return "EXP" + DateUtil.format(LocalDateTime.now(), "yyyyMMddHHmmss") +
                String.format("%03d", (int) (Math.random() * 1000));
    }
}
