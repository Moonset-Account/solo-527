package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "config_version", indexes = {
        @Index(name = "idx_config_type", columnList = "config_type")
})
public class ConfigVersion extends BaseEntity {

    @Column(name = "config_type", nullable = false, length = 50)
    private String configType;

    @Column(name = "config_key", nullable = false, length = 100)
    private String configKey;

    @Column(name = "config_name", length = 100)
    private String configName;

    @Column(name = "version_no", nullable = false)
    private Integer versionNo;

    @Column(name = "config_value", columnDefinition = "text")
    private String configValue;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "effect_start_time", columnDefinition = "timestamp")
    private java.time.LocalDateTime effectStartTime;

    @Column(name = "effect_end_time", columnDefinition = "timestamp")
    private java.time.LocalDateTime effectEndTime;

    @Column(name = "remark", length = 500)
    private String remark;
}
