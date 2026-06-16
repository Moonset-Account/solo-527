package com.pm.workstation.entity;

import com.pm.workstation.enums.NodeStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "process_instance_node")
public class ProcessInstanceNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long instanceId;

    @Column(nullable = false)
    private Long nodeId;

    @Column
    private Long assigneeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NodeStatus status;

    @Column
    private LocalDateTime operatedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
