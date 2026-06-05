package com.property.entity;
import lombok.Data;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

@Data
@TableName("satisfaction")
public class Satisfaction {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long workOrderId;

    private Long ownerId;

    private String ownerName;

    private Integer rating;

    private String comment;

    private String tags;

    private Integer overallScore;

    private Integer responseSpeedScore;

    private Integer serviceAttitudeScore;

    private Integer qualityScore;

    private Integer isSolved;

    private String content;

    @TableField(exist = false)
    private String orderNo;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @TableLogic
    private Integer deleted;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWorkOrderId() {
        return workOrderId;
    }

    public void setWorkOrderId(Long workOrderId) {
        this.workOrderId = workOrderId;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public Integer getResponseSpeedScore() {
        return responseSpeedScore;
    }

    public void setResponseSpeedScore(Integer responseSpeedScore) {
        this.responseSpeedScore = responseSpeedScore;
    }

    public Integer getServiceAttitudeScore() {
        return serviceAttitudeScore;
    }

    public void setServiceAttitudeScore(Integer serviceAttitudeScore) {
        this.serviceAttitudeScore = serviceAttitudeScore;
    }

    public Integer getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(Integer qualityScore) {
        this.qualityScore = qualityScore;
    }

    public Integer getIsSolved() {
        return isSolved;
    }

    public void setIsSolved(Integer isSolved) {
        this.isSolved = isSolved;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getDeleted() {
        return deleted;
    }

    public void setDeleted(Integer deleted) {
        this.deleted = deleted;
    }
}
