package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tour_order", indexes = {
        @Index(name = "idx_order_no", columnList = "order_no", unique = true),
        @Index(name = "idx_route_id", columnList = "route_id")
})
public class TourOrder extends BaseEntity {

    @Column(name = "order_no", unique = true, nullable = false, length = 50)
    private String orderNo;

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "route_name", length = 100)
    private String routeName;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "travel_date")
    private LocalDate travelDate;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(name = "room_count")
    private Integer roomCount;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "order_status", length = 20)
    private String orderStatus;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus;

    @Column(name = "refund_status", length = 20)
    private String refundStatus;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "hotel_code", length = 50)
    private String hotelCode;

    @Column(name = "room_type", length = 50)
    private String roomType;

    @Column(name = "version")
    private Integer version;

    @Column(name = "remark", length = 500)
    private String remark;
}
