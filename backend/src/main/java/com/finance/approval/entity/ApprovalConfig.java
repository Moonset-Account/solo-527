package com.finance.approval.entity;

import com.finance.approval.enums.ConfigType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "approval_config")
@EntityListeners(AuditingEntityListener.class)
public class ApprovalConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConfigType configType;

    @Column(nullable = false, length = 100)
    private String configKey;

    @Column(nullable = false, length = 500)
    private String configValue;

    @Column(length = 200)
    private String description;

    private Integer sortOrder;

    @Column(nullable = false)
    private Boolean enabled;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
