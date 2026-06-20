package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("work_order_review")
public class WorkOrderReview extends BaseEntity {
    private Long workOrderId;
    private Long residentId;
    private Integer rating;
    private Integer speedRating;
    private Integer attitudeRating;
    private Integer qualityRating;
    private String content;
    private String images;
    private Integer anonymous;
}
