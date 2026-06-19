package com.decoration.cooperation.common;

import lombok.Data;

import java.io.Serializable;

@Data
public class PageQuery implements Serializable {
    private Long current = 1L;
    private Long size = 10L;
    private String keyword;
    private String status;
    private String startDate;
    private String endDate;
    private Long ownerId;
}
