package com.energy.service;

import com.energy.dto.ExportQueryDTO;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.ExportHistory;
import org.springframework.data.domain.Page;

public interface ExportHistoryService {
    Page<ExportHistory> search(ExportQueryDTO dto);
    ExportHistory getById(Long id);
    ExportHistory recordExport(String exportType, String fileName, String fileContent,
                               String operator, String area, EnergyQueryDTO query, Integer recordCount);
    byte[] downloadFile(Long id);
}
