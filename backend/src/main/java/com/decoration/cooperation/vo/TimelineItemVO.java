package com.decoration.cooperation.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TimelineItemVO {
    private Long id;
    private String type;
    private String typeName;
    private String title;
    private String content;
    private Long operatorId;
    private String operatorName;
    private LocalDateTime createTime;
    private Long processDuration;
    private String color;
    private String contractReference;
    private String stageReference;
    private String sourceReference;
}
