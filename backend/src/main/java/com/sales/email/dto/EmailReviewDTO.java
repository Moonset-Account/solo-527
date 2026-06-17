package com.sales.email.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
public class EmailReviewDTO implements Serializable {

    private Long draftId;
    private Integer version;
    private Long reviewerId;
    private String reviewerName;
    private String reviewType;
    private String reviewResult;
    private BigDecimal aiRiskScore;
    private List<String> forbiddenWordsHit;
    private String reviewComment;
    private String sourceOrderNo;
    private String operatorRemark;
    private Boolean sendReminder;
}
