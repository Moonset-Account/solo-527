package com.rider.analyzer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "delivery_order")
public class DeliveryOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, length = 64)
    private String orderNo;

    @Column(name = "rider_id")
    private Long riderId;

    @Column(name = "station_id")
    private Long stationId;

    @Column(name = "receiver_name", length = 64)
    private String receiverName;

    @Column(name = "receiver_phone", length = 20)
    private String receiverPhone;

    @Column(name = "receiver_address", length = 256)
    private String receiverAddress;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "promise_time")
    private LocalDateTime promiseTime;

    @Column(name = "accept_time")
    private LocalDateTime acceptTime;

    @Column(name = "pickup_time")
    private LocalDateTime pickupTime;

    @Column(name = "deliver_time")
    private LocalDateTime deliverTime;

    @Column(name = "sign_time")
    private LocalDateTime signTime;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
