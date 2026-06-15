package com.qinghe.topic.dto;

import com.qinghe.topic.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class TopicQueryDTO extends PageQuery {
    private String keyword;
    private Integer status;
    private Long creatorId;
    private String startDate;
    private String endDate;
}
