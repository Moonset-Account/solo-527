package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "member_package")
public class MemberPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_code", nullable = false, unique = true, length = 32)
    private String packageCode;

    @Column(name = "package_name", nullable = false, length = 100)
    private String packageName;

    @Column(name = "package_type", length = 50)
    private String packageType;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "package_price", precision = 10, scale = 2)
    private BigDecimal packagePrice;

    @Column(name = "valid_days")
    private Integer validDays;

    @Column(name = "max_usage")
    private Integer maxUsage;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status")
    private Integer status;

    @Column(name = "source_detection_record_id")
    private Long sourceDetectionRecordId;

    @Column(name = "create_by")
    private Long createBy;

    @Transient
    private List<PackageBenefit> benefits;

    @Transient
    private String sourceDetectionRecordNo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPackageCode() {
        return packageCode;
    }

    public void setPackageCode(String packageCode) {
        this.packageCode = packageCode;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getPackageType() {
        return packageType;
    }

    public void setPackageType(String packageType) {
        this.packageType = packageType;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public BigDecimal getPackagePrice() {
        return packagePrice;
    }

    public void setPackagePrice(BigDecimal packagePrice) {
        this.packagePrice = packagePrice;
    }

    public Integer getValidDays() {
        return validDays;
    }

    public void setValidDays(Integer validDays) {
        this.validDays = validDays;
    }

    public Integer getMaxUsage() {
        return maxUsage;
    }

    public void setMaxUsage(Integer maxUsage) {
        this.maxUsage = maxUsage;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Long getSourceDetectionRecordId() {
        return sourceDetectionRecordId;
    }

    public void setSourceDetectionRecordId(Long sourceDetectionRecordId) {
        this.sourceDetectionRecordId = sourceDetectionRecordId;
    }

    public Long getCreateBy() {
        return createBy;
    }

    public void setCreateBy(Long createBy) {
        this.createBy = createBy;
    }

    public List<PackageBenefit> getBenefits() {
        return benefits;
    }

    public void setBenefits(List<PackageBenefit> benefits) {
        this.benefits = benefits;
    }

    public String getSourceDetectionRecordNo() {
        return sourceDetectionRecordNo;
    }

    public void setSourceDetectionRecordNo(String sourceDetectionRecordNo) {
        this.sourceDetectionRecordNo = sourceDetectionRecordNo;
    }
}
