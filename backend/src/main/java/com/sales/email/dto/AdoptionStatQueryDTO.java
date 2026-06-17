package com.sales.email.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class AdoptionStatQueryDTO implements Serializable {

    private String startDate;
    private String endDate;
    private Long supervisorId;
    private Long agentId;
    private String riskHitReason;
    private String groupBy;
}
