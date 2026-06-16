package com.rider.analyzer.dto;

import lombok.Data;
import java.util.List;

@Data
public class BatchImportResultVO {

    private String batchNo;
    private String type;
    private Integer totalCount;
    private Integer successCount;
    private Integer failCount;
    private String status;
    private List<BatchErrorRecord> errorRecords;
}
