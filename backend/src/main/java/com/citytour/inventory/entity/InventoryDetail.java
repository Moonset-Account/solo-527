package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "inventory_detail", indexes = {
        @Index(name = "idx_inventory_date", columnList = "inventory_date"),
        @Index(name = "idx_room_inventory_id", columnList = "room_inventory_id")
})
public class InventoryDetail extends BaseEntity {

    @Column(name = "room_inventory_id", nullable = false)
    private Long roomInventoryId;

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "hotel_code", length = 50)
    private String hotelCode;

    @Column(name = "room_type", length = 50)
    private String roomType;

    @Column(name = "inventory_date")
    private LocalDate inventoryDate;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "order_no", length = 50)
    private String orderNo;

    @Column(name = "guest_name", length = 100)
    private String guestName;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "room_status", length = 20)
    private String roomStatus;

    @Column(name = "clean_status", length = 20)
    private String cleanStatus;

    @Column(name = "source_type", length = 20)
    private String sourceType;

    @Column(name = "remark", length = 500)
    private String remark;
}
