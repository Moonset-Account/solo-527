package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "export_histories", indexes = {
    @Index(name = "idx_export_histories_operator", columnList = "operator"),
    @Index(name = "idx_export_histories_time", columnList = "export_time")
})
public class ExportHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "export_no", nullable = false, unique = true, length = 64)
    private String exportNo;

    @Column(name = "export_type", nullable = false, length = 32)
    private String exportType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(length = 64)
    private String area;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(nullable = false, length = 64)
    private String operator;

    @Column(name = "export_time", nullable = false)
    private LocalDateTime exportTime = LocalDateTime.now();

    @Column(name = "record_count")
    private Integer recordCount;

    @Column(nullable = false, length = 32)
    private String status = "SUCCESS";
}
