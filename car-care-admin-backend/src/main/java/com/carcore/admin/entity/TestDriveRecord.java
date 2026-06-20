package com.carcore.admin.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_drive_record")
public class TestDriveRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "drive_no", nullable = false, unique = true, length = 32)
    private String driveNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "car_info", columnDefinition = "TEXT")
    private String carInfo;

    @Column(name = "technician_id", nullable = false)
    private Long technicianId;

    @Column(name = "workstation_id")
    private Long workstationId;

    @Column(name = "repair_order_id")
    private Long repairOrderId;

    @Column(name = "drive_start_time")
    private LocalDateTime driveStartTime;

    @Column(name = "drive_end_time")
    private LocalDateTime driveEndTime;

    @Column(name = "drive_route", length = 500)
    private String driveRoute;

    @Column(name = "drive_distance", precision = 8, scale = 2)
    private BigDecimal driveDistance;

    @Column(name = "drive_result", columnDefinition = "TEXT")
    private String driveResult;

    @Column(name = "problems_found", columnDefinition = "TEXT")
    private String problemsFound;

    @Column(name = "status")
    private Integer status;

    @Transient
    private String memberName;

    @Transient
    private String technicianName;

    @Transient
    private String workstationName;

    @Transient
    private String repairOrderNo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDriveNo() {
        return driveNo;
    }

    public void setDriveNo(String driveNo) {
        this.driveNo = driveNo;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getCarInfo() {
        return carInfo;
    }

    public void setCarInfo(String carInfo) {
        this.carInfo = carInfo;
    }

    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }

    public Long getWorkstationId() {
        return workstationId;
    }

    public void setWorkstationId(Long workstationId) {
        this.workstationId = workstationId;
    }

    public Long getRepairOrderId() {
        return repairOrderId;
    }

    public void setRepairOrderId(Long repairOrderId) {
        this.repairOrderId = repairOrderId;
    }

    public LocalDateTime getDriveStartTime() {
        return driveStartTime;
    }

    public void setDriveStartTime(LocalDateTime driveStartTime) {
        this.driveStartTime = driveStartTime;
    }

    public LocalDateTime getDriveEndTime() {
        return driveEndTime;
    }

    public void setDriveEndTime(LocalDateTime driveEndTime) {
        this.driveEndTime = driveEndTime;
    }

    public String getDriveRoute() {
        return driveRoute;
    }

    public void setDriveRoute(String driveRoute) {
        this.driveRoute = driveRoute;
    }

    public BigDecimal getDriveDistance() {
        return driveDistance;
    }

    public void setDriveDistance(BigDecimal driveDistance) {
        this.driveDistance = driveDistance;
    }

    public String getDriveResult() {
        return driveResult;
    }

    public void setDriveResult(String driveResult) {
        this.driveResult = driveResult;
    }

    public String getProblemsFound() {
        return problemsFound;
    }

    public void setProblemsFound(String problemsFound) {
        this.problemsFound = problemsFound;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }

    public String getWorkstationName() {
        return workstationName;
    }

    public void setWorkstationName(String workstationName) {
        this.workstationName = workstationName;
    }

    public String getRepairOrderNo() {
        return repairOrderNo;
    }

    public void setRepairOrderNo(String repairOrderNo) {
        this.repairOrderNo = repairOrderNo;
    }
}
