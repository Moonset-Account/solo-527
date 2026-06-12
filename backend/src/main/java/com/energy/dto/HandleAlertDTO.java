package com.energy.dto;

import lombok.Data;

@Data
public class HandleAlertDTO {
    private Long alertId;
    private String handler;
    private String handleResult;
    private String handleRemark;
}
