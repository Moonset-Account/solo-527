package com.pm.workstation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDTO {

    private int totalRows;

    private int successCount;

    private int errorCount;

    private String batchNo;

    private List<ImportErrorDTO> errors;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportErrorDTO {

        private Integer rowNumber;

        private String rawData;

        private String errorMessage;
    }
}
