package com.pm.workstation.dto;

import com.pm.workstation.enums.RequirementPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequirementDTO {

    private Long id;

    @NotBlank(message = "标题不能为空")
    @Size(max = 256, message = "标题不能超过256个字符")
    private String title;

    private String description;

    @NotNull(message = "优先级不能为空")
    private RequirementPriority priority;

    private Long assigneeId;

    private String department;

    private LocalDate deadline;
}
