package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import com.gym.common.enums.CourseTypeEnum;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "course_package")
public class CoursePackage extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseTypeEnum type;

    @Column(nullable = false)
    private Integer totalSessions;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal originalPrice;

    private Integer validDays;

    private String description;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Boolean showOnApp = false;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public CourseTypeEnum getType() { return type; }
    public void setType(CourseTypeEnum type) { this.type = type; }
    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }
    public Integer getValidDays() { return validDays; }
    public void setValidDays(Integer validDays) { this.validDays = validDays; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Boolean getShowOnApp() { return showOnApp; }
    public void setShowOnApp(Boolean showOnApp) { this.showOnApp = showOnApp; }
}
