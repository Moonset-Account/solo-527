package com.pm.workstation.dto;

import com.pm.workstation.enums.TodoStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TodoItemDTO {

    private Long id;

    @NotNull(message = "需求ID不能为空")
    private Long requirementId;

    @NotBlank(message = "标题不能为空")
    private String title;

    private String description;

    private TodoStatus status;

    private LocalDate dueDate;

    private Long reminderRuleId;
}
