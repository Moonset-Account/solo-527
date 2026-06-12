package com.finance.approval.dto;

import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.enums.ExpenseType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ApplicationDTO {

    private Long id;

    private String title;

    private BigDecimal amount;

    private ExpenseType expenseType;

    private String description;

    private List<String> attachments;

    private ApplicationStatus status;

    private Long applicantId;

    private String applicantName;

    private Long approverId;

    private String approverName;

    private String approvalOpinion;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime approvedAt;
}
