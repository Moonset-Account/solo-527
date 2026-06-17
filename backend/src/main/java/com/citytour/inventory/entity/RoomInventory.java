package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "room_inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"route_id", "hotel_code", "room_type", "inventory_date"})
})
public class RoomInventory extends BaseEntity {

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(name = "hotel_code", nullable = false, length = 50)
    private String hotelCode;

    @Column(name = "hotel_name", length = 100)
    private String hotelName;

    @Column(name = "room_type", nullable = false, length = 50)
    private String roomType;

    @Column(name = "inventory_date", nullable = false)
    private LocalDate inventoryDate;

    @Column(name = "total_quantity")
    private Integer totalQuantity;

    @Column(name = "booked_quantity")
    private Integer bookedQuantity;

    @Column(name = "blocked_quantity")
    private Integer blockedQuantity;

    @Column(name = "available_quantity")
    private Integer availableQuantity;

    @Column(name = "room_status", length = 20)
    private String roomStatus;

    @Column(name = "version")
    private Integer version;
}
