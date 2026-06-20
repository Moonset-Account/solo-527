package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "package_benefit")
public class PackageBenefit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "benefit_type", nullable = false, length = 50)
    private String benefitType;

    @Column(name = "benefit_name", nullable = false, length = 100)
    private String benefitName;

    @Column(name = "benefit_value", precision = 10, scale = 2)
    private BigDecimal benefitValue;

    @Column(name = "benefit_detail", columnDefinition = "TEXT")
    private String benefitDetail;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPackageId() {
        return packageId;
    }

    public void setPackageId(Long packageId) {
        this.packageId = packageId;
    }

    public String getBenefitType() {
        return benefitType;
    }

    public void setBenefitType(String benefitType) {
        this.benefitType = benefitType;
    }

    public String getBenefitName() {
        return benefitName;
    }

    public void setBenefitName(String benefitName) {
        this.benefitName = benefitName;
    }

    public BigDecimal getBenefitValue() {
        return benefitValue;
    }

    public void setBenefitValue(BigDecimal benefitValue) {
        this.benefitValue = benefitValue;
    }

    public String getBenefitDetail() {
        return benefitDetail;
    }

    public void setBenefitDetail(String benefitDetail) {
        this.benefitDetail = benefitDetail;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
