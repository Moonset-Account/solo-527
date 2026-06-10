package com.courselearning.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CheckInDTO {

    private LocalDate checkDate;

    private Integer studyDuration;

    private Long courseId;

    private String remark;
}
