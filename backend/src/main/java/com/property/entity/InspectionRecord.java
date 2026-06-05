package com.property.entity;
import lombok.Data;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

@Data
@TableName("inspection_record")
public class InspectionRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String recordNo;

    private Long pointId;

    @TableField(exist = false)
    private String pointLocation;

    private Long inspectorId;

    private String inspectorName;

    private String status;

    private String remark;

    private String abnormalDescription;

    private Integer isHandled;

    private Long abnormalOrderId;

    private java.math.BigDecimal locationLng;

    private java.math.BigDecimal locationLat;

    private String handleRemark;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime checkTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime checkInTime;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @TableLogic
    private Integer deleted;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecordNo() {
        return recordNo;
    }

    public void setRecordNo(String recordNo) {
        this.recordNo = recordNo;
    }

    public Long getPointId() {
        return pointId;
    }

    public void setPointId(Long pointId) {
        this.pointId = pointId;
    }

    public String getPointLocation() {
        return pointLocation;
    }

    public void setPointLocation(String pointLocation) {
        this.pointLocation = pointLocation;
    }

    public Long getInspectorId() {
        return inspectorId;
    }

    public void setInspectorId(Long inspectorId) {
        this.inspectorId = inspectorId;
    }

    public String getInspectorName() {
        return inspectorName;
    }

    public void setInspectorName(String inspectorName) {
        this.inspectorName = inspectorName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getAbnormalDescription() {
        return abnormalDescription;
    }

    public void setAbnormalDescription(String abnormalDescription) {
        this.abnormalDescription = abnormalDescription;
    }

    public Integer getIsHandled() {
        return isHandled;
    }

    public void setIsHandled(Integer isHandled) {
        this.isHandled = isHandled;
    }

    public java.math.BigDecimal getLocationLng() {
        return locationLng;
    }

    public void setLocationLng(java.math.BigDecimal locationLng) {
        this.locationLng = locationLng;
    }

    public java.math.BigDecimal getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(java.math.BigDecimal locationLat) {
        this.locationLat = locationLat;
    }

    public String getHandleRemark() {
        return handleRemark;
    }

    public void setHandleRemark(String handleRemark) {
        this.handleRemark = handleRemark;
    }

    public LocalDateTime getCheckTime() {
        return checkTime;
    }

    public void setCheckTime(LocalDateTime checkTime) {
        this.checkTime = checkTime;
    }

    public Long getAbnormalOrderId() {
        return abnormalOrderId;
    }

    public void setAbnormalOrderId(Long abnormalOrderId) {
        this.abnormalOrderId = abnormalOrderId;
    }

    public LocalDateTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalDateTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getDeleted() {
        return deleted;
    }

    public void setDeleted(Integer deleted) {
        this.deleted = deleted;
    }
}
