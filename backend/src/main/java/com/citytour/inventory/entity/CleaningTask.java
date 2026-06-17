package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "cleaning_task", indexes = {
        @Index(name = "idx_task_date", columnList = "task_date"),
        @Index(name = "idx_task_status", columnList = "task_status")
})
public class CleaningTask extends BaseEntity {

    @Column(name = "task_no", unique = true, length = 50)
    private String taskNo;

    @Column(name = "hotel_code", length = 50)
    private String hotelCode;

    @Column(name = "hotel_name", length = 100)
    private String hotelName;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "room_type", length = 50)
    private String roomType;

    @Column(name = "task_date")
    private LocalDate taskDate;

    @Column(name = "task_type", length = 20)
    private String taskType;

    @Column(name = "task_status", length = 20)
    private String taskStatus;

    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "assignee", length = 50)
    private String assignee;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "remark", length = 500)
    private String remark;
}
