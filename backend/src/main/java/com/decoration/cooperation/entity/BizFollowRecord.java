package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_follow_record")
public class BizFollowRecord extends BaseEntity {
    private Long leadId;
    private Long contractId;
    private Long followerId;
    private String followerName;
    private String followType;
    private String followStage;
    private String sourceReference;
    private String contractReference;
    private String content;
    private LocalDateTime nextFollowTime;
    private Long processDuration;
    private String attachmentIds;
}
