package com.finance.approval.entity;

import com.finance.approval.enums.RoleCode;
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
@Table(name = "sys_role")
@EntityListeners(AuditingEntityListener.class)
public class SysRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoleCode roleCode;

    @Column(nullable = false, length = 50)
    private String roleName;

    @Column(length = 200)
    private String description;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
