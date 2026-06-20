package com.property.workorder.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.workorder.common.PageResult;
import com.property.workorder.entity.Resident;
import com.property.workorder.entity.WorkOrder;
import com.property.workorder.entity.WorkOrderReview;
import com.property.workorder.entity.WorkOrderVisit;
import com.property.workorder.mapper.ResidentMapper;
import com.property.workorder.mapper.WorkOrderMapper;
import com.property.workorder.mapper.WorkOrderReviewMapper;
import com.property.workorder.mapper.WorkOrderVisitMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderMapper workOrderMapper;
    private final ResidentMapper residentMapper;
    private final WorkOrderVisitMapper visitMapper;
    private final WorkOrderReviewMapper reviewMapper;

    public PageResult<WorkOrder> getWorkOrders(String status, String priority, String category,
                                                String buildingNo, Long assignedTo,
                                                Integer current, Integer size) {
        Page<WorkOrder> page = new Page<>(current, size);
        LambdaQueryWrapper<WorkOrder> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(WorkOrder::getStatus, status);
        }
        if (priority != null && !priority.isEmpty()) {
            wrapper.eq(WorkOrder::getPriority, priority);
        }
        if (category != null && !category.isEmpty()) {
            wrapper.eq(WorkOrder::getCategory, category);
        }
        if (buildingNo != null && !buildingNo.isEmpty()) {
            wrapper.eq(WorkOrder::getBuildingNo, buildingNo);
        }
        if (assignedTo != null) {
            wrapper.eq(WorkOrder::getAssignedTo, assignedTo);
        }
        wrapper.orderByDesc(WorkOrder::getCreatedAt);
        return PageResult.of(workOrderMapper.selectPage(page, wrapper));
    }

    public PageResult<WorkOrder> getResidentWorkOrders(Long residentId, String status,
                                                        Integer current, Integer size) {
        Page<WorkOrder> page = new Page<>(current, size);
        LambdaQueryWrapper<WorkOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkOrder::getResidentId, residentId);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(WorkOrder::getStatus, status);
        }
        wrapper.orderByDesc(WorkOrder::getCreatedAt);
        return PageResult.of(workOrderMapper.selectPage(page, wrapper));
    }

    public WorkOrder getWorkOrderDetail(Long id) {
        return workOrderMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public WorkOrder createWorkOrder(WorkOrder order) {
        Resident resident = residentMapper.selectById(order.getResidentId());
        if (resident == null) {
            throw new RuntimeException("住户不存在");
        }
        order.setBuildingNo(resident.getBuildingNo());
        order.setRoomNo(resident.getRoomNo());
        order.setOrderNo("WO" + System.currentTimeMillis());
        order.setStatus("PENDING");
        if (order.getPriority() == null) {
            order.setPriority("MEDIUM");
        }
        workOrderMapper.insert(order);
        return order;
    }

    @Transactional(rollbackFor = Exception.class)
    public WorkOrder assignWorkOrder(Long orderId, Long staffId, Long operatorId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("工单不存在");
        }
        if ("CANCELLED".equals(order.getStatus()) || "CLOSED".equals(order.getStatus())) {
            throw new RuntimeException("当前工单状态不允许派工");
        }
        order.setAssignedTo(staffId);
        order.setAssignedAt(LocalDateTime.now());
        order.setStatus("ASSIGNED");
        workOrderMapper.updateById(order);
        return order;
    }

    @Transactional(rollbackFor = Exception.class)
    public WorkOrder startWork(Long orderId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("工单不存在");
        }
        order.setStatus("PROCESSING");
        workOrderMapper.updateById(order);
        return order;
    }

    @Transactional(rollbackFor = Exception.class)
    public WorkOrder completeWork(Long orderId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("工单不存在");
        }
        order.setStatus("COMPLETED");
        order.setCompletedAt(LocalDateTime.now());
        workOrderMapper.updateById(order);
        return order;
    }

    @Transactional(rollbackFor = Exception.class)
    public WorkOrderVisit createVisitRecord(WorkOrderVisit visit) {
        WorkOrder order = workOrderMapper.selectById(visit.getWorkOrderId());
        if (order == null) {
            throw new RuntimeException("工单不存在");
        }
        visit.setVisitedAt(LocalDateTime.now());
        visitMapper.insert(visit);
        return visit;
    }

    @Transactional(rollbackFor = Exception.class)
    public WorkOrderReview createReview(WorkOrderReview review) {
        WorkOrder order = workOrderMapper.selectById(review.getWorkOrderId());
        if (order == null) {
            throw new RuntimeException("工单不存在");
        }
        if (!"COMPLETED".equals(order.getStatus()) && !"CLOSED".equals(order.getStatus())) {
            throw new RuntimeException("工单未完成，暂不可评价");
        }
        reviewMapper.insert(review);

        order.setStatus("CLOSED");
        order.setClosedAt(LocalDateTime.now());
        workOrderMapper.updateById(order);
        return review;
    }

    public WorkOrderVisit getVisitByOrderId(Long orderId) {
        LambdaQueryWrapper<WorkOrderVisit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkOrderVisit::getWorkOrderId, orderId);
        return visitMapper.selectOne(wrapper);
    }

    public WorkOrderReview getReviewByOrderId(Long orderId) {
        LambdaQueryWrapper<WorkOrderReview> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WorkOrderReview::getWorkOrderId, orderId);
        return reviewMapper.selectOne(wrapper);
    }

    public Map<String, Object> getWorkOrderStats() {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<WorkOrder> pendingWrapper = new LambdaQueryWrapper<>();
        pendingWrapper.eq(WorkOrder::getStatus, "PENDING");
        result.put("pendingCount", workOrderMapper.selectCount(pendingWrapper));

        LambdaQueryWrapper<WorkOrder> processingWrapper = new LambdaQueryWrapper<>();
        processingWrapper.in(WorkOrder::getStatus, "ASSIGNED", "PROCESSING");
        result.put("processingCount", workOrderMapper.selectCount(processingWrapper));

        LambdaQueryWrapper<WorkOrder> completedWrapper = new LambdaQueryWrapper<>();
        completedWrapper.in(WorkOrder::getStatus, "COMPLETED", "CLOSED");
        result.put("completedCount", workOrderMapper.selectCount(completedWrapper));

        return result;
    }
}
