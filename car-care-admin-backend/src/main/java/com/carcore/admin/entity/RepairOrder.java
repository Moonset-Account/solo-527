package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "repair_order")
public class RepairOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 32)
    private String orderNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "car_info", columnDefinition = "TEXT")
    private String carInfo;

    @Column(name = "package_order_id")
    private Long packageOrderId;

    @Column(name = "detection_record_id")
    private Long detectionRecordId;

    @Column(name = "technician_id")
    private Long technicianId;

    @Column(name = "workstation_id")
    private Long workstationId;

    @Column(name = "order_type", length = 50)
    private String orderType;

    @Column(name = "problem_description", columnDefinition = "TEXT")
    private String problemDescription;

    @Column(name = "plan_start_time")
    private LocalDateTime planStartTime;

    @Column(name = "plan_end_time")
    private LocalDateTime planEndTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "delay_reason", columnDefinition = "TEXT")
    private String delayReason;

    @Column(name = "delay_handler_id")
    private Long delayHandlerId;

    @Column(name = "delay_handle_time")
    private LocalDateTime delayHandleTime;

    @Column(name = "delay_handle_result", columnDefinition = "TEXT")
    private String delayHandleResult;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "quality_status", length = 20)
    private String qualityStatus;

    @Column(name = "status")
    private Integer status;

    @Column(name = "close_handler_id")
    private Long closeHandlerId;

    @Column(name = "close_time")
    private LocalDateTime closeTime;

    @Column(name = "close_remark", columnDefinition = "TEXT")
    private String closeRemark;

    @Column(name = "create_by")
    private Long createBy;

    @Transient
    private String memberName;

    @Transient
    private String technicianName;

    @Transient
    private String workstationName;

    @Transient
    private String packageOrderNo;

    @Transient
    private String detectionRecordNo;

    @Transient
    private String delayHandlerName;

    @Transient
    private String closeHandlerName;

    @Transient
    private List<RepairItem> repairItems;

    @Transient
    private List<RepairStatusHistory> statusHistories;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getCarInfo() {
        return carInfo;
    }

    public void setCarInfo(String carInfo) {
        this.carInfo = carInfo;
    }

    public Long getPackageOrderId() {
        return packageOrderId;
    }

    public void setPackageOrderId(Long packageOrderId) {
        this.packageOrderId = packageOrderId;
    }

    public Long getDetectionRecordId() {
        return detectionRecordId;
    }

    public void setDetectionRecordId(Long detectionRecordId) {
        this.detectionRecordId = detectionRecordId;
    }

    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }

    public Long getWorkstationId() {
        return workstationId;
    }

    public void setWorkstationId(Long workstationId) {
        this.workstationId = workstationId;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public String getProblemDescription() {
        return problemDescription;
    }

    public void setProblemDescription(String problemDescription) {
        this.problemDescription = problemDescription;
    }

    public LocalDateTime getPlanStartTime() {
        return planStartTime;
    }

    public void setPlanStartTime(LocalDateTime planStartTime) {
        this.planStartTime = planStartTime;
    }

    public LocalDateTime getPlanEndTime() {
        return planEndTime;
    }

    public void setPlanEndTime(LocalDateTime planEndTime) {
        this.planEndTime = planEndTime;
    }

    public LocalDateTime getActualStartTime() {
        return actualStartTime;
    }

    public void setActualStartTime(LocalDateTime actualStartTime) {
        this.actualStartTime = actualStartTime;
    }

    public LocalDateTime getActualEndTime() {
        return actualEndTime;
    }

    public void setActualEndTime(LocalDateTime actualEndTime) {
        this.actualEndTime = actualEndTime;
    }

    public String getDelayReason() {
        return delayReason;
    }

    public void setDelayReason(String delayReason) {
        this.delayReason = delayReason;
    }

    public Long getDelayHandlerId() {
        return delayHandlerId;
    }

    public void setDelayHandlerId(Long delayHandlerId) {
        this.delayHandlerId = delayHandlerId;
    }

    public LocalDateTime getDelayHandleTime() {
        return delayHandleTime;
    }

    public void setDelayHandleTime(LocalDateTime delayHandleTime) {
        this.delayHandleTime = delayHandleTime;
    }

    public String getDelayHandleResult() {
        return delayHandleResult;
    }

    public void setDelayHandleResult(String delayHandleResult) {
        this.delayHandleResult = delayHandleResult;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Long getCloseHandlerId() {
        return closeHandlerId;
    }

    public void setCloseHandlerId(Long closeHandlerId) {
        this.closeHandlerId = closeHandlerId;
    }

    public LocalDateTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalDateTime closeTime) {
        this.closeTime = closeTime;
    }

    public String getCloseRemark() {
        return closeRemark;
    }

    public void setCloseRemark(String closeRemark) {
        this.closeRemark = closeRemark;
    }

    public Long getCreateBy() {
        return createBy;
    }

    public void setCreateBy(Long createBy) {
        this.createBy = createBy;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }

    public String getWorkstationName() {
        return workstationName;
    }

    public void setWorkstationName(String workstationName) {
        this.workstationName = workstationName;
    }

    public String getPackageOrderNo() {
        return packageOrderNo;
    }

    public void setPackageOrderNo(String packageOrderNo) {
        this.packageOrderNo = packageOrderNo;
    }

    public String getDetectionRecordNo() {
        return detectionRecordNo;
    }

    public void setDetectionRecordNo(String detectionRecordNo) {
        this.detectionRecordNo = detectionRecordNo;
    }

    public String getDelayHandlerName() {
        return delayHandlerName;
    }

    public void setDelayHandlerName(String delayHandlerName) {
        this.delayHandlerName = delayHandlerName;
    }

    public String getCloseHandlerName() {
        return closeHandlerName;
    }

    public void setCloseHandlerName(String closeHandlerName) {
        this.closeHandlerName = closeHandlerName;
    }

    public List<RepairItem> getRepairItems() {
        return repairItems;
    }

    public void setRepairItems(List<RepairItem> repairItems) {
        this.repairItems = repairItems;
    }

    public List<RepairStatusHistory> getStatusHistories() {
        return statusHistories;
    }

    public void setStatusHistories(List<RepairStatusHistory> statusHistories) {
        this.statusHistories = statusHistories;
    }
}
