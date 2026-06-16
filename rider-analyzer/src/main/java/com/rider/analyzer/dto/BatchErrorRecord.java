package com.rider.analyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchErrorRecord {

    private Integer row;
    private String field;
    private String value;
    private String reason;
}
