package com.finance.approval.entity;

import com.finance.approval.enums.TimeoutStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "timeout_exception")
@EntityListeners(AuditingEntityListener.class)
public class TimeoutException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(nullable = false)
    private Long nodeId;

    @Column(length = 50)
    private String nodeName;

    @Column(nullable = false)
    private Long approverId;

    @Column(length = 50)
    private String approverName;

    @Column(nullable = false)
    private LocalDateTime dueTime;

    @Column(nullable = false)
    private Integer timeoutHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TimeoutStatus status;

    private Long handledBy;

    private LocalDateTime handledAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
