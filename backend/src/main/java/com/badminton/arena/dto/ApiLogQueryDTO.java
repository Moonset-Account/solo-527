package com.badminton.arena.dto;

import java.time.LocalDateTime;

public class ApiLogQueryDTO {

    private String apiPath;

    private String apiMethod;

    private Integer status;

    private Integer needRetry;

    private Long userId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    public String getApiPath() {
        return apiPath;
    }

    public void setApiPath(String apiPath) {
        this.apiPath = apiPath;
    }

    public String getApiMethod() {
        return apiMethod;
    }

    public void setApiMethod(String apiMethod) {
        this.apiMethod = apiMethod;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getNeedRetry() {
        return needRetry;
    }

    public void setNeedRetry(Integer needRetry) {
        this.needRetry = needRetry;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
}
