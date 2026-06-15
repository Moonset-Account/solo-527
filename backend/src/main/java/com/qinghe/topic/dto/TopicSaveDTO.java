package com.qinghe.topic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TopicSaveDTO {
    private Long id;
    @NotBlank(message = "选题标题不能为空")
    private String title;
    private String description;
    private String tags;
    private String targetAudience;
    private String contentDirection;
    private Long creatorId;
    private String creatorName;
    private Integer status;
    private String remark;
}
