package com.decoration.cooperation.vo;

import com.decoration.cooperation.entity.BizAttachment;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

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
    private List<BizAttachment> attachments;
}
