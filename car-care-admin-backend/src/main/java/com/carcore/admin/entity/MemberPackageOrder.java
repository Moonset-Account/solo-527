package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "member_package_order")
public class MemberPackageOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 32)
    private String orderNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "package_name", length = 100)
    private String packageName;

    @Column(name = "package_price", precision = 10, scale = 2)
    private BigDecimal packagePrice;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "valid_start_date", nullable = false)
    private LocalDate validStartDate;

    @Column(name = "valid_end_date", nullable = false)
    private LocalDate validEndDate;

    @Column(name = "remaining_usage")
    private Integer remainingUsage;

    @Column(name = "total_usage")
    private Integer totalUsage;

    @Column(name = "status")
    private Integer status;

    @Column(name = "source_detection_record_id")
    private Long sourceDetectionRecordId;

    @Transient
    private String memberName;

    @Transient
    private String sourceDetectionRecordNo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getPackageId() {
        return packageId;
    }

    public void setPackageId(Long packageId) {
        this.packageId = packageId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public BigDecimal getPackagePrice() {
        return packagePrice;
    }

    public void setPackagePrice(BigDecimal packagePrice) {
        this.packagePrice = packagePrice;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getValidStartDate() {
        return validStartDate;
    }

    public void setValidStartDate(LocalDate validStartDate) {
        this.validStartDate = validStartDate;
    }

    public LocalDate getValidEndDate() {
        return validEndDate;
    }

    public void setValidEndDate(LocalDate validEndDate) {
        this.validEndDate = validEndDate;
    }

    public Integer getRemainingUsage() {
        return remainingUsage;
    }

    public void setRemainingUsage(Integer remainingUsage) {
        this.remainingUsage = remainingUsage;
    }

    public Integer getTotalUsage() {
        return totalUsage;
    }

    public void setTotalUsage(Integer totalUsage) {
        this.totalUsage = totalUsage;
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

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public String getSourceDetectionRecordNo() {
        return sourceDetectionRecordNo;
    }

    public void setSourceDetectionRecordNo(String sourceDetectionRecordNo) {
        this.sourceDetectionRecordNo = sourceDetectionRecordNo;
    }
}
