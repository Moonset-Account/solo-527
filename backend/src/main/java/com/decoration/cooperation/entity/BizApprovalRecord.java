package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_approval_record")
public class BizApprovalRecord {
    private Long id;
    private Long approvalId;
    private String approvalType;
    private Long approverId;
    private String approverName;
    private String approvalAction;
    private Integer approvalLevel;
    private String opinion;
    private Long processDuration;
    private LocalDateTime createTime;
}
