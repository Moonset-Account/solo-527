package com.property.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.common.Result;
import com.property.common.UserContext;
import com.property.common.enums.*;
import com.property.entity.*;
import com.property.mapper.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class WorkOrderService {

    private static final Logger log = LoggerFactory.getLogger(WorkOrderService.class);

    @Autowired
    private WorkOrderMapper workOrderMapper;

    @Autowired
    private WorkOrderHistoryMapper workOrderHistoryMapper;

    @Autowired
    private OwnerMapper ownerMapper;

    @Autowired
    private RoomMapper roomMapper;

    @Autowired
    private BuildingMapper buildingMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private AttachmentMapper attachmentMapper;

    @Autowired
    private MessageService messageService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String URGENT_ORDER_QUEUE = "property:urgent:orders";
    private static final String ORDER_CACHE_PREFIX = "property:order:";

    @Transactional(rollbackFor = Exception.class)
    public Result<WorkOrder> createWorkOrder(WorkOrder order) {
        SysUser currentUser = UserContext.getUser();
        String currentRole = currentUser.getRole();

        if (UserRoleEnum.OWNER.getCode().equals(currentRole)) {
            Owner owner = ownerMapper.selectOne(
                    new LambdaQueryWrapper<Owner>().eq(Owner::getUserId, currentUser.getId())
            );
            if (owner != null) {
                order.setOwnerId(owner.getId());
            }
        }

        if (order.getOwnerId() == null) {
            return Result.validateError("请选择报修业主");
        }

        order.setOrderNo(generateOrderNo());
        order.setStatus(WorkOrderStatusEnum.PENDING.getCode());
        order.setReportTime(LocalDateTime.now());
        order.setCreatedBy(currentUser.getId());
        order.setHasPhoto(0);
        order.setIsPaid(0);

        if (order.getPriority() == null) {
            order.setPriority(WorkOrderPriorityEnum.NORMAL.getCode());
        }

        workOrderMapper.insert(order);
        saveHistory(order.getId(), "CREATE", null, order.getStatus(), currentUser.getId(), currentUser.getRealName(), "业主提交报修申请");

        if (WorkOrderPriorityEnum.URGENT.getCode().equals(order.getPriority())) {
            redisTemplate.opsForList().leftPush(URGENT_ORDER_QUEUE, order.getId());
            redisTemplate.expire(URGENT_ORDER_QUEUE, 24, TimeUnit.HOURS);
            messageService.sendUrgentMessageToAdmins("紧急工单提醒", "新紧急工单：" + order.getTitle() + "，请立即处理！", order.getId());
        } else {
            messageService.sendMessageToAdmins(MessageTypeEnum.ORDER_NEW, "新报修工单",
                    "业主提交了新的报修工单：" + order.getTitle(), order.getId());
        }

        cacheOrder(order);
        log.info("工单创建成功: orderNo={}, priority={}", order.getOrderNo(), order.getPriority());

        return Result.success("工单提交成功", order);
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<WorkOrder> approveOrder(Long orderId, boolean approved, String rejectReason, Long assigneeId) {
        SysUser currentUser = UserContext.getUser();
        WorkOrder order = workOrderMapper.selectById(orderId);

        if (order == null) {
            return Result.validateError("工单不存在");
        }

        if (!WorkOrderStatusEnum.PENDING.getCode().equals(order.getStatus())) {
            return Result.validateError("当前工单状态不允许审核");
        }

        String oldStatus = order.getStatus();

        if (approved) {
            if (assigneeId == null) {
                return Result.validateError("请选择指派的维修人员");
            }

            SysUser assignee = sysUserMapper.selectById(assigneeId);
            if (assignee == null || !UserRoleEnum.MAINTENANCE.getCode().equals(assignee.getRole())) {
                return Result.validateError("指派人员不是有效维修人员");
            }

            order.setStatus(WorkOrderStatusEnum.APPROVED.getCode());
            order.setAssigneeId(assigneeId);
            order.setAssignTime(LocalDateTime.now());
            order.setUpdatedBy(currentUser.getId());

            workOrderMapper.updateById(order);

            saveHistory(orderId, "APPROVE", oldStatus, order.getStatus(), currentUser.getId(), currentUser.getRealName(), "审核通过");
            saveHistory(orderId, "ASSIGN", oldStatus, order.getStatus(), currentUser.getId(), currentUser.getRealName(),
                    "派单给：" + assignee.getRealName());

            messageService.sendMessage(assigneeId, currentUser.getId(), MessageTypeEnum.ORDER_ASSIGN,
                    "工单派单通知", "您有新的工单待处理：" + order.getTitle(),
                    "WORK_ORDER", orderId, order.getPriority());

        } else {
            order.setStatus(WorkOrderStatusEnum.REJECTED.getCode());
            order.setRejectReason(rejectReason);
            order.setUpdatedBy(currentUser.getId());
            workOrderMapper.updateById(order);

            saveHistory(orderId, "REJECT", oldStatus, order.getStatus(), currentUser.getId(), currentUser.getRealName(),
                    "驳回原因：" + rejectReason);

            Owner owner = ownerMapper.selectById(order.getOwnerId());
            if (owner != null) {
                messageService.sendMessage(owner.getUserId(), currentUser.getId(), MessageTypeEnum.SYSTEM_NOTICE,
                        "工单被驳回", "您的工单 " + order.getTitle() + " 被驳回，原因：" + rejectReason,
                        "WORK_ORDER", orderId, WorkOrderPriorityEnum.NORMAL.getCode());
            }
        }

        cacheOrder(order);
        return Result.success("操作成功", order);
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<WorkOrder> startProcess(Long orderId) {
        SysUser currentUser = UserContext.getUser();
        WorkOrder order = workOrderMapper.selectById(orderId);

        if (order == null) {
            return Result.validateError("工单不存在");
        }

        if (!WorkOrderStatusEnum.APPROVED.getCode().equals(order.getStatus())) {
            return Result.validateError("当前工单状态不允许开始处理");
        }

        if (!order.getAssigneeId().equals(currentUser.getId())) {
            return Result.validateError("您不是该工单的处理人员");
        }

        String oldStatus = order.getStatus();
        order.setStatus(WorkOrderStatusEnum.PROCESSING.getCode());
        order.setStartProcessTime(LocalDateTime.now());
        order.setUpdatedBy(currentUser.getId());

        workOrderMapper.updateById(order);
        saveHistory(orderId, "START_PROCESS", oldStatus, order.getStatus(), currentUser.getId(), currentUser.getRealName(), "开始上门处理");

        cacheOrder(order);
        return Result.success("开始处理", order);
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<WorkOrder> completeOrder(Long orderId, String handlerRemark, BigDecimal actualCost) {
        SysUser currentUser = UserContext.getUser();
        WorkOrder order = workOrderMapper.selectById(orderId);

        if (order == null) {
            return Result.validateError("工单不存在");
        }

        if (!WorkOrderStatusEnum.PROCESSING.getCode().equals(order.getStatus())) {
            return Result.validateError("当前工单状态不允许完成处理");
        }

        if (!order.getAssigneeId().equals(currentUser.getId())) {
            return Result.validateError("您不是该工单的处理人员");
        }

        String oldStatus = order.getStatus();
        order.setStatus(WorkOrderStatusEnum.COMPLETED.getCode());
        order.setCompleteTime(LocalDateTime.now());
        order.setHandlerRemark(handlerRemark);
        order.setActualCost(actualCost != null ? actualCost : BigDecimal.ZERO);
        order.setUpdatedBy(currentUser.getId());

        workOrderMapper.updateById(order);
        saveHistory(orderId, "COMPLETE", oldStatus, order.getStatus(), currentUser.getId(), currentUser.getRealName(),
                "处理完成，等待业主验收：" + handlerRemark);

        Owner owner = ownerMapper.selectById(order.getOwnerId());
        if (owner != null) {
            messageService.sendMessage(owner.getUserId(), currentUser.getId(), MessageTypeEnum.ORDER_COMPLETE,
                    "工单完成通知", "您的工单 " + order.getTitle() + " 已处理完成，请及时验收评价",
                    "WORK_ORDER", orderId, WorkOrderPriorityEnum.NORMAL.getCode());
        }

        cacheOrder(order);
        return Result.success("处理完成，等待业主验收", order);
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<WorkOrder> closeOrder(Long orderId) {
        SysUser currentUser = UserContext.getUser();
        WorkOrder order = workOrderMapper.selectById(orderId);

        if (order == null) {
            return Result.validateError("工单不存在");
        }

        if (!WorkOrderStatusEnum.COMPLETED.getCode().equals(order.getStatus())) {
            return Result.validateError("当前工单状态不允许关闭");
        }

        Long photoCount = attachmentMapper.selectCount(
                new LambdaQueryWrapper<Attachment>()
                        .eq(Attachment::getBizType, "WORK_ORDER")
                        .eq(Attachment::getBizId, orderId)
                        .eq(Attachment::getFileType, "image")
        );

        if (photoCount == 0) {
            return Result.validateError("关闭工单前必须上传处理照片，请先上传照片");
        }

        String oldStatus = order.getStatus();
        order.setStatus(WorkOrderStatusEnum.CLOSED.getCode());
        order.setCloseTime(LocalDateTime.now());
        order.setHasPhoto(1);
        order.setUpdatedBy(currentUser.getId());

        workOrderMapper.updateById(order);
        saveHistory(orderId, "CLOSE", oldStatus, order.getStatus(), currentUser.getId(), currentUser.getRealName(), "工单关闭，业主验收通过");

        redisTemplate.delete(ORDER_CACHE_PREFIX + orderId);
        log.info("工单关闭成功: orderNo={}", order.getOrderNo());

        return Result.success("工单已关闭", order);
    }

    public IPage<WorkOrder> getOrderPage(int page, int size, String status, String priority, String keyword) {
        SysUser currentUser = UserContext.getUser();
        String role = currentUser.getRole();

        LambdaQueryWrapper<WorkOrder> wrapper = new LambdaQueryWrapper<>();

        if (UserRoleEnum.OWNER.getCode().equals(role)) {
            Owner owner = ownerMapper.selectOne(
                    new LambdaQueryWrapper<Owner>().eq(Owner::getUserId, currentUser.getId())
            );
            if (owner != null) {
                wrapper.eq(WorkOrder::getOwnerId, owner.getId());
            }
        } else if (UserRoleEnum.MAINTENANCE.getCode().equals(role)) {
            wrapper.eq(WorkOrder::getAssigneeId, currentUser.getId());
        }

        if (StrUtil.isNotBlank(status)) {
            wrapper.eq(WorkOrder::getStatus, status);
        }
        if (StrUtil.isNotBlank(priority)) {
            wrapper.eq(WorkOrder::getPriority, priority);
        }
        if (StrUtil.isNotBlank(keyword)) {
            wrapper.and(w -> w.like(WorkOrder::getTitle, keyword)
                    .or().like(WorkOrder::getOrderNo, keyword)
                    .or().like(WorkOrder::getDescription, keyword));
        }

        wrapper.orderByDesc(WorkOrder::getCreatedAt);

        Page<WorkOrder> pageParam = new Page<>(page, size);
        IPage<WorkOrder> result = workOrderMapper.selectPage(pageParam, wrapper);

        result.getRecords().forEach(this::fillOrderInfo);
        result.getRecords().forEach(this::filterSensitiveFields);

        return result;
    }

    public Result<WorkOrder> getOrderDetail(Long orderId) {
        WorkOrder order = getOrderFromCache(orderId);
        if (order == null) {
            order = workOrderMapper.selectById(orderId);
            if (order != null) {
                cacheOrder(order);
            }
        }

        if (order == null) {
            return Result.validateError("工单不存在");
        }

        fillOrderInfo(order);
        filterSensitiveFields(order);

        return Result.success(order);
    }

    public List<WorkOrderHistory> getOrderHistory(Long orderId) {
        return workOrderHistoryMapper.selectList(
                new LambdaQueryWrapper<WorkOrderHistory>()
                        .eq(WorkOrderHistory::getWorkOrderId, orderId)
                        .orderByAsc(WorkOrderHistory::getCreatedAt)
        );
    }

    private void fillOrderInfo(WorkOrder order) {
        if (order.getOwnerId() != null) {
            Owner owner = ownerMapper.selectById(order.getOwnerId());
            if (owner != null) {
                SysUser user = sysUserMapper.selectById(owner.getUserId());
                if (user != null) {
                    order.setOwnerName(user.getRealName());
                }
            }
        }

        if (order.getRoomId() != null) {
            Room room = roomMapper.selectById(order.getRoomId());
            if (room != null) {
                Building building = buildingMapper.selectById(room.getBuildingId());
                if (building != null) {
                    order.setRoomInfo(building.getBuildingName() + " " + room.getRoomNo());
                } else {
                    order.setRoomInfo(room.getRoomNo());
                }
            }
        }

        if (order.getAssigneeId() != null) {
            SysUser assignee = sysUserMapper.selectById(order.getAssigneeId());
            if (assignee != null) {
                order.setAssigneeName(assignee.getRealName());
            }
        }
    }

    private void filterSensitiveFields(WorkOrder order) {
        SysUser currentUser = UserContext.getUser();
        if (currentUser == null) return;

        String role = currentUser.getRole();

        if (!UserRoleEnum.ADMIN.getCode().equals(role) && !UserRoleEnum.PROPERTY.getCode().equals(role)) {
            order.setRejectReason(null);
        }

        if (UserRoleEnum.OWNER.getCode().equals(role)) {
            order.setExpectedCost(null);
        }
    }

    private void saveHistory(Long orderId, String operation, String oldStatus, String newStatus,
                             Long operatorId, String operatorName, String remark) {
        WorkOrderHistory history = new WorkOrderHistory();
        history.setWorkOrderId(orderId);
        history.setOperation(operation);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setOperatorId(operatorId);
        history.setOperatorName(operatorName);
        history.setRemark(remark);
        workOrderHistoryMapper.insert(history);
    }

    private String generateOrderNo() {
        return "WO" + DateUtil.format(LocalDateTime.now(), "yyyyMMddHHmmss") +
                String.format("%03d", (int) (Math.random() * 1000));
    }

    private void cacheOrder(WorkOrder order) {
        redisTemplate.opsForValue().set(ORDER_CACHE_PREFIX + order.getId(), order, 30, TimeUnit.MINUTES);
    }

    private WorkOrder getOrderFromCache(Long orderId) {
        try {
            return (WorkOrder) redisTemplate.opsForValue().get(ORDER_CACHE_PREFIX + orderId);
        } catch (Exception e) {
            return null;
        }
    }

    public Result<Map<String, Object>> getDashboardStats() {
        long totalOrders = workOrderMapper.selectCount(new LambdaQueryWrapper<>());
        long pendingOrders = workOrderMapper.selectCount(
                new LambdaQueryWrapper<WorkOrder>().eq(WorkOrder::getStatus, WorkOrderStatusEnum.PENDING.getCode())
        );
        long processingOrders = workOrderMapper.selectCount(
                new LambdaQueryWrapper<WorkOrder>().eq(WorkOrder::getStatus, WorkOrderStatusEnum.PROCESSING.getCode())
        );
        long urgentOrders = workOrderMapper.selectCount(
                new LambdaQueryWrapper<WorkOrder>()
                        .eq(WorkOrder::getPriority, WorkOrderPriorityEnum.URGENT.getCode())
                        .ne(WorkOrder::getStatus, WorkOrderStatusEnum.CLOSED.getCode())
        );

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("urgentOrders", urgentOrders);
        return Result.success(stats);
    }
}
