package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "efficiency_report")
public class EfficiencyReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_no", nullable = false, unique = true, length = 32)
    private String reportNo;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "completed_orders")
    private Integer completedOrders;

    @Column(name = "delayed_orders")
    private Integer delayedOrders;

    @Column(name = "total_revenue", precision = 12, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "average_completion_hours", precision = 8, scale = 2)
    private BigDecimal averageCompletionHours;

    @Column(name = "pass_rate", precision = 5, scale = 2)
    private BigDecimal passRate;

    @Column(name = "tech_efficiency", columnDefinition = "TEXT")
    private String techEfficiency;

    @Column(name = "station_utilization", columnDefinition = "TEXT")
    private String stationUtilization;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "source_close_order_ids", columnDefinition = "TEXT")
    private String sourceCloseOrderIds;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReportNo() {
        return reportNo;
    }

    public void setReportNo(String reportNo) {
        this.reportNo = reportNo;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public Integer getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Integer totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Integer getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(Integer completedOrders) {
        this.completedOrders = completedOrders;
    }

    public Integer getDelayedOrders() {
        return delayedOrders;
    }

    public void setDelayedOrders(Integer delayedOrders) {
        this.delayedOrders = delayedOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getAverageCompletionHours() {
        return averageCompletionHours;
    }

    public void setAverageCompletionHours(BigDecimal averageCompletionHours) {
        this.averageCompletionHours = averageCompletionHours;
    }

    public BigDecimal getPassRate() {
        return passRate;
    }

    public void setPassRate(BigDecimal passRate) {
        this.passRate = passRate;
    }

    public String getTechEfficiency() {
        return techEfficiency;
    }

    public void setTechEfficiency(String techEfficiency) {
        this.techEfficiency = techEfficiency;
    }

    public String getStationUtilization() {
        return stationUtilization;
    }

    public void setStationUtilization(String stationUtilization) {
        this.stationUtilization = stationUtilization;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getSourceCloseOrderIds() {
        return sourceCloseOrderIds;
    }

    public void setSourceCloseOrderIds(String sourceCloseOrderIds) {
        this.sourceCloseOrderIds = sourceCloseOrderIds;
    }
}
