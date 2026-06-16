package com.pm.workstation.entity;

import com.pm.workstation.enums.RoleType;
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
@Table(name = "sys_role")
public class SysRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String roleName;

    @Column(nullable = false, length = 64, unique = true)
    private String roleCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleType roleType;

    @Column(length = 512)
    private String description;

    @Column(columnDefinition = "JSON")
    private String permissions;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
