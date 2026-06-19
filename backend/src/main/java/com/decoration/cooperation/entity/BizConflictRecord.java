package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_conflict_record")
public class BizConflictRecord {
    private Long id;
    private Long leadId1;
    private Long leadId2;
    private String conflictType;
    private LocalDateTime detectTime;
    private String status;
    private Long resolvedBy;
    private LocalDateTime resolvedTime;
    private String resolution;
    private Long processDuration;
    private String remark;
}
