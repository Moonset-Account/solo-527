package com.pm.workstation.entity;

import com.pm.workstation.enums.AssigneeType;
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
@Table(name = "process_node")
public class ProcessNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long definitionId;

    @Column(nullable = false, length = 128)
    private String nodeName;

    @Column(nullable = false)
    private Integer nodeOrder;

    @Column
    private Long roleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssigneeType assigneeType;

    @Column
    private Long assigneeId;

    @Column(nullable = false)
    private Boolean autoRemind = false;

    @Column
    private Integer remindHours;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
