package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("adoption_statistic")
public class AdoptionStatistic implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private LocalDate statDate;

    private Long supervisorId;

    private String supervisorName;

    private Long agentId;

    private String agentName;

    private String riskHitReason;

    private Integer totalGenerated;

    private Integer adoptedCount;

    private Integer partialAdoptedCount;

    private Integer rejectedCount;

    private BigDecimal adoptionRate;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
