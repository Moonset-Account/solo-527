package com.decoration.cooperation.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class FollowRecordCreateDTO {
    private Long leadId;
    private Long contractId;
    private String followType;
    private String followStage;
    private String sourceReference;
    private String contractReference;
    private String content;
    private LocalDateTime nextFollowTime;
    private Long processDuration;
    private String attachmentIds;
}
