package com.decoration.crm.dto;

import lombok.Data;

@Data
public class PageQuery {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;
    private String status;
    private String level;
    private Long ownerId;
    private String publicSeaStatus;
    private Long lostReasonId;
    private String source;
}
