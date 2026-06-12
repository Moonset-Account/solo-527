package com.energy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignAlertDTO {
    private Long alertId;
    private String assignee;
    private String remark;
}
