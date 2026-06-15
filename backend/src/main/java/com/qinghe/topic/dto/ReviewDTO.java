package com.qinghe.topic.dto;

import lombok.Data;

@Data
public class ReviewDTO {
    private Long businessId;
    private Integer reviewType;
    private String reviewTypeName;
    private String beforeContent;
    private String afterContent;
    private String diffContent;
    private String reviewOpinion;
    private Integer reviewResult;
    private Long reviewerId;
    private String reviewerName;
}
