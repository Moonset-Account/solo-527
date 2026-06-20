package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_status_history")
public class RepairStatusHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "repair_order_id", nullable = false)
    private Long repairOrderId;

    @Column(name = "old_status")
    private Integer oldStatus;

    @Column(name = "new_status", nullable = false)
    private Integer newStatus;

    @Column(name = "old_quality_status", length = 20)
    private String oldQualityStatus;

    @Column(name = "new_quality_status", length = 20)
    private String newQualityStatus;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @Column(name = "operate_time")
    private LocalDateTime operateTime;

    @Column(name = "operate_remark", columnDefinition = "TEXT")
    private String operateRemark;

    @Transient
    private String operatorName;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRepairOrderId() {
        return repairOrderId;
    }

    public void setRepairOrderId(Long repairOrderId) {
        this.repairOrderId = repairOrderId;
    }

    public Integer getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(Integer oldStatus) {
        this.oldStatus = oldStatus;
    }

    public Integer getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(Integer newStatus) {
        this.newStatus = newStatus;
    }

    public String getOldQualityStatus() {
        return oldQualityStatus;
    }

    public void setOldQualityStatus(String oldQualityStatus) {
        this.oldQualityStatus = oldQualityStatus;
    }

    public String getNewQualityStatus() {
        return newQualityStatus;
    }

    public void setNewQualityStatus(String newQualityStatus) {
        this.newQualityStatus = newQualityStatus;
    }

    public Long getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Long operatorId) {
        this.operatorId = operatorId;
    }

    public LocalDateTime getOperateTime() {
        return operateTime;
    }

    public void setOperateTime(LocalDateTime operateTime) {
        this.operateTime = operateTime;
    }

    public String getOperateRemark() {
        return operateRemark;
    }

    public void setOperateRemark(String operateRemark) {
        this.operateRemark = operateRemark;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }
}
