package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@TableName("work_order")
public class WorkOrder {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private String title;

    private String description;

    private String category;

    private String priority;

    private String status;

    private Long ownerId;

    private Long roomId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime reportTime;

    private String contactPerson;

    private String contactPhone;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime appointTime;

    private Long assigneeId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime assignTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startProcessTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completeTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime closeTime;

    private BigDecimal expectedCost;

    private BigDecimal actualCost;

    private Integer isPaid;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime payTime;

    private String rejectReason;

    private String handlerRemark;

    private Integer hasPhoto;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    private Long updatedBy;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;

    @TableField(exist = false)
    private String ownerName;

    @TableField(exist = false)
    private String roomInfo;

    @TableField(exist = false)
    private String assigneeName;
}
