package com.qinghe.topic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScriptSaveDTO {
    private Long id;
    @NotNull(message = "关联选题不能为空")
    private Long topicId;
    private String topicTitle;
    @NotBlank(message = "脚本标题不能为空")
    private String title;
    private String content;
    private String shootingRequirement;
    private String materialTags;
    private String duration;
    private Long creatorId;
    private String creatorName;
    private Integer status;
    private String remark;

    private String reviewOpinion;
    private Long reviewerId;
    private String reviewerName;
    private Integer reviewResult;
}
