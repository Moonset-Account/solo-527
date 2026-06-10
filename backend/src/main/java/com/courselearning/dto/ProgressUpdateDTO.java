package com.courselearning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressUpdateDTO {

    @NotNull(message = "课程ID不能为空")
    private Long courseId;

    @NotNull(message = "章节ID不能为空")
    private Long chapterId;

    @NotNull(message = "进度不能为空")
    @Min(value = 0, message = "进度不能小于0")
    @Max(value = 100, message = "进度不能大于100")
    private Integer progress;

    private Integer watchDuration;

    private Integer isCompleted;
}
