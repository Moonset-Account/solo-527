package com.qinghe.course.common;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class QueryParams implements Serializable {

    private String keyword;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer pageNum = 1;
    private Integer pageSize = 20;
}
