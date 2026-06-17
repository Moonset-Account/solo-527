package com.sales.email.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmailDraftDTO implements Serializable {

    private Long id;
    private String subject;
    private String recipient;
    private String cc;
    private String bcc;
    private String content;
    private String sourceOrderNo;
    private String sourceType;
    private Long agentId;
    private String agentName;
    private Long supervisorId;
    private String supervisorName;
    private Long promptVersionId;
    private String remark;
    private String changeSummary;
}
