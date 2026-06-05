package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "notification")
public class Notification extends BaseEntity {

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String content;

    private Long receiverId;

    private String receiverType;

    @Column(nullable = false)
    private Boolean read = false;

    private String relatedType;

    private Long relatedId;

    private String pushStatus;

    private String pushResult;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    public String getReceiverType() { return receiverType; }
    public void setReceiverType(String receiverType) { this.receiverType = receiverType; }
    public Boolean getRead() { return read; }
    public void setRead(Boolean read) { this.read = read; }
    public String getRelatedType() { return relatedType; }
    public void setRelatedType(String relatedType) { this.relatedType = relatedType; }
    public Long getRelatedId() { return relatedId; }
    public void setRelatedId(Long relatedId) { this.relatedId = relatedId; }
    public String getPushStatus() { return pushStatus; }
    public void setPushStatus(String pushStatus) { this.pushStatus = pushStatus; }
    public String getPushResult() { return pushResult; }
    public void setPushResult(String pushResult) { this.pushResult = pushResult; }
}
