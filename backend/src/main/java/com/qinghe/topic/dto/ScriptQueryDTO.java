package com.qinghe.topic.dto;

import com.qinghe.topic.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ScriptQueryDTO extends PageQuery {
    private String keyword;
    private Integer status;
    private Long topicId;
    private Long creatorId;
    private String startDate;
    private String endDate;
}
