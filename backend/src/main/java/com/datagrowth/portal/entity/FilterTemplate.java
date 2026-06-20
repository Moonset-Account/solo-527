package com.datagrowth.portal.entity;

import com.datagrowth.portal.converter.StringListConverter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "filter_template")
public class FilterTemplate {

    private static final ObjectMapper objectMapper = new ObjectMapper();

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

    @Transient
    private Map<String, Object> filterConditionsMap;

    public Map<String, Object> getFilterConditionsMap() {
        if (this.filterConditionsMap != null) {
            return this.filterConditionsMap;
        }
        if (this.filterConditions == null || this.filterConditions.isEmpty()) {
            this.filterConditionsMap = new HashMap<>();
            return this.filterConditionsMap;
        }
        try {
            if (this.filterConditions.startsWith("{")) {
                this.filterConditionsMap = objectMapper.readValue(this.filterConditions, new TypeReference<Map<String, Object>>() {});
            } else {
                this.filterConditionsMap = new HashMap<>();
            }
        } catch (Exception e) {
            this.filterConditionsMap = new HashMap<>();
        }
        return this.filterConditionsMap;
    }

    public void setFilterConditionsMap(Map<String, Object> map) {
        this.filterConditionsMap = map;
        if (map == null) {
            this.filterConditions = "{}";
        } else {
            try {
                this.filterConditions = objectMapper.writeValueAsString(map);
            } catch (Exception e) {
                this.filterConditions = "{}";
            }
        }
    }

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT", length = 1000)
    @Builder.Default
    private List<String> sharedRoles = new ArrayList<>();

    @Column(length = 500)
    private String description;

    @Builder.Default
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
