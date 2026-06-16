package com.pm.workstation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingMinutesDTO {

    private Long id;

    @NotNull(message = "需求ID不能为空")
    private Long requirementId;

    @NotBlank(message = "标题不能为空")
    private String title;

    private String content;

    @NotNull(message = "会议日期不能为空")
    private LocalDate meetingDate;

    private List<Long> participantIds;

    private Long reminderRuleId;
}
