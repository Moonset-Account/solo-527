package com.qinghe.topic.dto;

import com.qinghe.topic.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewQueryDTO extends PageQuery {
    private Long businessId;
    private Integer reviewType;
}
