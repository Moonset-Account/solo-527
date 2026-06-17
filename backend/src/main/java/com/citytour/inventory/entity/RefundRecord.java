package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "refund_record", indexes = {
        @Index(name = "idx_order_no", columnList = "order_no")
})
public class RefundRecord extends BaseEntity {

    @Column(name = "refund_no", unique = true, nullable = false, length = 50)
    private String refundNo;

    @Column(name = "order_no", length = 50)
    private String orderNo;

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason", length = 200)
    private String refundReason;

    @Column(name = "refund_type", length = 20)
    private String refundType;

    @Column(name = "refund_status", length = 20)
    private String refundStatus;

    @Column(name = "approver", length = 50)
    private String approver;

    @Column(name = "approve_time")
    private LocalDateTime approveTime;

    @Column(name = "refund_time")
    private LocalDateTime refundTime;

    @Column(name = "remark", length = 500)
    private String remark;
}
