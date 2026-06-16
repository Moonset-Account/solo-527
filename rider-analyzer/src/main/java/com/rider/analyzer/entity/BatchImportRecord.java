package com.rider.analyzer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "batch_import_record")
public class BatchImportRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_no", nullable = false, length = 64)
    private String batchNo;

    @Column(name = "type", length = 32)
    private String type;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 0;

    @Column(name = "success_count", nullable = false)
    private Integer successCount = 0;

    @Column(name = "fail_count", nullable = false)
    private Integer failCount = 0;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "error_file_path", length = 256)
    private String errorFilePath;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
