package com.datagrowth.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "filter_template")
public class FilterTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String templateName;

    @Column(nullable = false, length = 50)
    private String pageCode;

    @Column(nullable = false, length = 200)
    private String pageName;

    @Column(nullable = false)
    private Long userId;

    @Column(length = 50)
    private String username;

    @Column(columnDefinition = "TEXT")
    private String filterConditions;

    @Column(nullable = false)
    private Boolean isPublic = false;

    @Column(length = 1000)
    private String sharedRoles;

    @Column(length = 500)
    private String description;

    private Integer useCount = 0;

    @Column(length = 50)
    private String createdBy;

    @Column(length = 50)
    private String updatedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
