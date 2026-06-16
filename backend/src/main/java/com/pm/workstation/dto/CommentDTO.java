package com.pm.workstation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {

    @NotNull(message = "需求ID不能为空")
    private Long requirementId;

    @NotBlank(message = "评论内容不能为空")
    private String content;

    private Long parentId;
}
