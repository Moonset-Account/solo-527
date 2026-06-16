package com.pm.workstation.entity;

import com.pm.workstation.enums.RequirementPriority;
import com.pm.workstation.enums.RequirementStatus;
import com.pm.workstation.enums.RequirementConclusion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "requirement")
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequirementPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequirementStatus status;

    @Column(nullable = false)
    private Long submitterId;

    @Column
    private Long assigneeId;

    @Column(length = 128)
    private String department;

    @Column
    private LocalDate deadline;

    @Column
    private LocalDateTime completedAt;

    @Column
    private Integer delayDays;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RequirementConclusion conclusion;

    @Column
    private Long processInstanceId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
