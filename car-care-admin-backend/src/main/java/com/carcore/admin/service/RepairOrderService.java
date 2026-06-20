package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.dto.RepairOrderCloseDTO;
import com.carcore.admin.dto.RepairOrderDelayDTO;
import com.carcore.admin.dto.RepairOrderStatusDTO;
import com.carcore.admin.entity.*;
import com.carcore.admin.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final RepairStatusHistoryRepository statusHistoryRepository;
    private final RepairItemRepository repairItemRepository;
    private final MemberRepository memberRepository;
    private final TechnicianRepository technicianRepository;
    private final WorkstationRepository workstationRepository;
    private final MemberPackageOrderRepository packageOrderRepository;
    private final DetectionRecordRepository detectionRecordRepository;
    private final SysUserRepository sysUserRepository;
    private final CodeGenerator codeGenerator;

    public RepairOrderService(RepairOrderRepository repairOrderRepository, RepairStatusHistoryRepository statusHistoryRepository, RepairItemRepository repairItemRepository, MemberRepository memberRepository, TechnicianRepository technicianRepository, WorkstationRepository workstationRepository, MemberPackageOrderRepository packageOrderRepository, DetectionRecordRepository detectionRecordRepository, SysUserRepository sysUserRepository, CodeGenerator codeGenerator) {
        this.repairOrderRepository = repairOrderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.repairItemRepository = repairItemRepository;
        this.memberRepository = memberRepository;
        this.technicianRepository = technicianRepository;
        this.workstationRepository = workstationRepository;
        this.packageOrderRepository = packageOrderRepository;
        this.detectionRecordRepository = detectionRecordRepository;
        this.sysUserRepository = sysUserRepository;
        this.codeGenerator = codeGenerator;
    }

    public RepairOrder getById(Long id) {
        RepairOrder order = repairOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException("维修单不存在"));
        enrichOrder(order);
        order.setRepairItems(repairItemRepository.findByRepairOrderId(id));
        order.setStatusHistories(getStatusHistories(id));
        return order;
    }

    public RepairOrder getByOrderNo(String orderNo) {
        RepairOrder order = repairOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new BusinessException("维修单不存在"));
        enrichOrder(order);
        return order;
    }

    public List<RepairStatusHistory> getStatusHistories(Long repairOrderId) {
        List<RepairStatusHistory> histories = statusHistoryRepository
                .findByRepairOrderIdOrderByOperateTimeAsc(repairOrderId);
        List<Long> operatorIds = histories.stream()
                .map(RepairStatusHistory::getOperatorId)
                .distinct().toList();
        Map<Long, String> operatorMap = sysUserRepository.findAllById(operatorIds).stream()
                .collect(Collectors.toMap(SysUser::getId, SysUser::getRealName));
        histories.forEach(h -> h.setOperatorName(operatorMap.get(h.getOperatorId())));
        return histories;
    }

    public List<RepairItem> getRepairItems(Long repairOrderId) {
        return repairItemRepository.findByRepairOrderId(repairOrderId);
    }

    public PageResult<RepairOrder> page(String orderNo, Long memberId, Long technicianId,
                                         Long workstationId, String orderType, Integer status,
                                         String qualityStatus, LocalDateTime startTime,
                                         LocalDateTime endTime, int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<RepairOrder> page = repairOrderRepository.findByConditions(
                orderNo, memberId, technicianId, workstationId, null, null,
                orderType, status, qualityStatus, startTime, endTime, pageable);
        
        List<RepairOrder> orders = page.getContent();
        orders.forEach(this::enrichOrder);
        
        return PageResult.of(orders, page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public RepairOrder create(RepairOrder order, List<RepairItem> items) {
        order.setOrderNo(codeGenerator.generateRepairOrderNo());
        order.setStatus(1);
        order.setQualityStatus("PENDING");
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        if (items != null) {
            for (RepairItem item : items) {
                if (item.getSubtotal() != null) {
                    totalAmount = totalAmount.add(item.getSubtotal());
                }
            }
        }
        order.setTotalAmount(totalAmount);
        
        RepairOrder saved = repairOrderRepository.save(order);
        
        if (items != null && !items.isEmpty()) {
            for (RepairItem item : items) {
                item.setRepairOrderId(saved.getId());
                repairItemRepository.save(item);
            }
        }
        
        addStatusHistory(saved.getId(), null, saved.getStatus(),
                null, saved.getQualityStatus(),
                order.getCreateBy(), "创建维修单");
        
        return saved;
    }

    @Transactional
    public RepairOrder update(RepairOrder order, List<RepairItem> items) {
        RepairOrder existing = getById(order.getId());
        
        if (existing.getStatus() >= 3) {
            throw new BusinessException("施工中的工单不能修改基本信息");
        }
        
        existing.setProblemDescription(order.getProblemDescription());
        existing.setTechnicianId(order.getTechnicianId());
        existing.setWorkstationId(order.getWorkstationId());
        existing.setPlanStartTime(order.getPlanStartTime());
        existing.setPlanEndTime(order.getPlanEndTime());
        existing.setOrderType(order.getOrderType());
        existing.setPackageOrderId(order.getPackageOrderId());
        existing.setDetectionRecordId(order.getDetectionRecordId());
        
        if (items != null) {
            repairItemRepository.deleteByRepairOrderId(existing.getId());
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (RepairItem item : items) {
                item.setRepairOrderId(existing.getId());
                item.setId(null);
                repairItemRepository.save(item);
                if (item.getSubtotal() != null) {
                    totalAmount = totalAmount.add(item.getSubtotal());
                }
            }
            existing.setTotalAmount(totalAmount);
        }
        
        return repairOrderRepository.save(existing);
    }

    @Transactional
    public RepairOrder updateStatus(RepairOrderStatusDTO dto) {
        RepairOrder order = getById(dto.getRepairOrderId());
        
        Integer oldStatus = order.getStatus();
        String oldQualityStatus = order.getQualityStatus();
        
        validateStatusTransition(oldStatus, dto.getNewStatus());
        
        order.setStatus(dto.getNewStatus());
        
        if (dto.getNewQualityStatus() != null) {
            order.setQualityStatus(dto.getNewQualityStatus());
        }
        
        if (dto.getNewStatus() == 3 && order.getActualStartTime() == null) {
            order.setActualStartTime(LocalDateTime.now());
        }
        
        if (dto.getNewStatus() == 5 && order.getActualEndTime() == null) {
            order.setActualEndTime(LocalDateTime.now());
        }
        
        RepairOrder saved = repairOrderRepository.save(order);
        
        addStatusHistory(order.getId(), oldStatus, dto.getNewStatus(),
                oldQualityStatus, dto.getNewQualityStatus(),
                dto.getOperatorId(), dto.getOperateRemark());
        
        return saved;
    }

    @Transactional
    public RepairOrder handleDelay(RepairOrderDelayDTO dto) {
        RepairOrder order = getById(dto.getRepairOrderId());
        
        if (order.getStatus() != 3) {
            throw new BusinessException("只有施工中的工单才能申请延期");
        }
        
        order.setDelayReason(dto.getDelayReason());
        order.setDelayHandlerId(dto.getHandlerId());
        order.setDelayHandleTime(LocalDateTime.now());
        order.setDelayHandleResult(dto.getDelayHandleResult());
        
        RepairOrder saved = repairOrderRepository.save(order);
        
        addStatusHistory(order.getId(), order.getStatus(), order.getStatus(),
                order.getQualityStatus(), order.getQualityStatus(),
                dto.getHandlerId(), "处理延期: " + dto.getDelayReason() + " → " + dto.getDelayHandleResult());
        
        return saved;
    }

    @Transactional
    public RepairOrder closeOrder(RepairOrderCloseDTO dto) {
        RepairOrder order = getById(dto.getRepairOrderId());
        
        if (order.getStatus() != 5) {
            throw new BusinessException("只有已完成的工单才能关闭");
        }
        
        if (!"PASSED".equals(order.getQualityStatus())) {
            throw new BusinessException("质检未通过的工单不能关闭");
        }
        
        order.setStatus(6);
        order.setCloseHandlerId(dto.getHandlerId());
        order.setCloseTime(LocalDateTime.now());
        order.setCloseRemark(dto.getCloseRemark());
        
        RepairOrder saved = repairOrderRepository.save(order);
        
        addStatusHistory(order.getId(), 5, 6,
                order.getQualityStatus(), order.getQualityStatus(),
                dto.getHandlerId(), "关闭工单: " + dto.getCloseRemark());
        
        return saved;
    }

    @Transactional
    public void batchUpdateStatus(List<Long> ids, Integer newStatus, Long operatorId, String remark) {
        for (Long id : ids) {
            try {
                RepairOrderStatusDTO dto = new RepairOrderStatusDTO();
                dto.setRepairOrderId(id);
                dto.setNewStatus(newStatus);
                dto.setOperatorId(operatorId);
                dto.setOperateRemark(remark);
                updateStatus(dto);
            } catch (Exception e) {
                throw new BusinessException("工单ID " + id + " 状态更新失败: " + e.getMessage());
            }
        }
    }

    private void addStatusHistory(Long repairOrderId, Integer oldStatus, Integer newStatus,
                                  String oldQualityStatus, String newQualityStatus,
                                  Long operatorId, String remark) {
        RepairStatusHistory history = new RepairStatusHistory();
        history.setRepairOrderId(repairOrderId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setOldQualityStatus(oldQualityStatus);
        history.setNewQualityStatus(newQualityStatus);
        history.setOperatorId(operatorId);
        history.setOperateTime(LocalDateTime.now());
        history.setOperateRemark(remark);
        statusHistoryRepository.save(history);
    }

    private void validateStatusTransition(Integer oldStatus, Integer newStatus) {
        if (oldStatus == 6) {
            throw new BusinessException("已关闭的工单不能修改状态");
        }
        
        if (newStatus < oldStatus && newStatus != 0) {
            if (!(oldStatus == 5 && newStatus == 3)) {
                throw new BusinessException("不能回退到之前的状态");
            }
        }
    }

    private void enrichOrder(RepairOrder order) {
        memberRepository.findById(order.getMemberId()).ifPresent(m -> order.setMemberName(m.getName()));
        
        if (order.getTechnicianId() != null) {
            technicianRepository.findById(order.getTechnicianId()).ifPresent(t -> order.setTechnicianName(t.getName()));
        }
        
        if (order.getWorkstationId() != null) {
            workstationRepository.findById(order.getWorkstationId()).ifPresent(w -> order.setWorkstationName(w.getStationName()));
        }
        
        if (order.getPackageOrderId() != null) {
            packageOrderRepository.findById(order.getPackageOrderId()).ifPresent(p -> order.setPackageOrderNo(p.getOrderNo()));
        }
        
        if (order.getDetectionRecordId() != null) {
            detectionRecordRepository.findById(order.getDetectionRecordId()).ifPresent(d -> order.setDetectionRecordNo(d.getRecordNo()));
        }
        
        if (order.getDelayHandlerId() != null) {
            sysUserRepository.findById(order.getDelayHandlerId()).ifPresent(u -> order.setDelayHandlerName(u.getRealName()));
        }
        
        if (order.getCloseHandlerId() != null) {
            sysUserRepository.findById(order.getCloseHandlerId()).ifPresent(u -> order.setCloseHandlerName(u.getRealName()));
        }
    }
}
