package com.qinghe.topic.dto;

import com.qinghe.topic.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AbnormalQueryDTO extends PageQuery {
    private String keyword;
    private Integer abnormalType;
    private Integer status;
    private Long handlerId;
    private String startDate;
    private String endDate;
}
