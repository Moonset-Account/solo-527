package com.qinghe.topic.dto;

import lombok.Data;

@Data
public class StatsQueryDTO {
    private String startDate;
    private String endDate;
    private Long creatorId;
}
