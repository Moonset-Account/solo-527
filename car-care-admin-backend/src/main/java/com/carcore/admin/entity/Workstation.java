package com.carcore.admin.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "workstation")
public class Workstation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "station_no", nullable = false, unique = true, length = 32)
    private String stationNo;

    @Column(name = "station_name", nullable = false, length = 50)
    private String stationName;

    @Column(name = "station_type", length = 50)
    private String stationType;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "equipment", columnDefinition = "TEXT")
    private String equipment;

    @Column(name = "status")
    private Integer status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStationNo() {
        return stationNo;
    }

    public void setStationNo(String stationNo) {
        this.stationNo = stationNo;
    }

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getStationType() {
        return stationType;
    }

    public void setStationType(String stationType) {
        this.stationType = stationType;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public String getEquipment() {
        return equipment;
    }

    public void setEquipment(String equipment) {
        this.equipment = equipment;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}
