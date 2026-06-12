package com.energy.service;

import com.energy.dto.ExportQueryDTO;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.ExportHistory;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ExportHistoryService {
    Page<ExportHistory> search(ExportQueryDTO dto);
    ExportHistory recordExport(String exportType, String fileName, String operator,
                               String area, EnergyQueryDTO query, Integer recordCount);
    byte[] download(Long id);
}
