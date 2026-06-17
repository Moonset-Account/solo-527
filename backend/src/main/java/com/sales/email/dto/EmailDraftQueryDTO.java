package com.sales.email.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmailDraftQueryDTO implements Serializable {

    private Long pageNum = 1L;
    private Long pageSize = 10L;
    private String draftNo;
    private String subject;
    private String sourceOrderNo;
    private String sourceType;
    private Long agentId;
    private Long supervisorId;
    private String status;
    private String riskLevel;
    private String startDate;
    private String endDate;
}
