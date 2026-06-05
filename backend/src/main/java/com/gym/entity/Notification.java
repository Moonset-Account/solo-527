package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
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
}
