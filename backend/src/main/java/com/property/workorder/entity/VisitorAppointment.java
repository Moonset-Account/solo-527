package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("visitor_appointment")
public class VisitorAppointment extends BaseEntity {
    private String appointmentNo;
    private Long residentId;
    private String visitorName;
    private String visitorPhone;
    private String visitorIdCard;
    private Integer visitorCount;
    private String buildingNo;
    private String roomNo;
    private LocalDate visitDate;
    private LocalTime visitTimeStart;
    private LocalTime visitTimeEnd;
    private String visitPurpose;
    private String status;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime checkInAt;
    private LocalDateTime checkOutAt;
    private String remark;
}
