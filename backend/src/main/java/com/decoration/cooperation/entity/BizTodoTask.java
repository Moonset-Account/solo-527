package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_todo_task")
public class BizTodoTask extends BaseEntity {
    private String taskNo;
    private String taskType;
    private Long bizId;
    private String bizType;
    private String title;
    private String content;
    private Long assigneeId;
    private Long assignerId;
    private Integer priority;
    private String status;
    private LocalDateTime dueTime;
    private LocalDateTime startTime;
    private LocalDateTime completeTime;
    private Long processDuration;
    private String contractReference;
    private String stageReference;
    private String sourceReference;
    private String remark;
}
