package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "export_log", indexes = {
        @Index(name = "idx_export_time", columnList = "export_time"),
        @Index(name = "idx_export_by", columnList = "export_by")
})
public class ExportLog extends BaseEntity {

    @Column(name = "export_no", unique = true, nullable = false, length = 50)
    private String exportNo;

    @Column(name = "export_type", length = 50)
    private String exportType;

    @Column(name = "export_name", length = 100)
    private String exportName;

    @Column(name = "export_by", nullable = false, length = 50)
    private String exportBy;

    @Column(name = "export_time")
    private LocalDateTime exportTime;

    @Column(name = "query_criteria", columnDefinition = "text")
    private String queryCriteria;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "record_count")
    private Integer recordCount;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "remark", length = 500)
    private String remark;
}
