package com.energy.service.impl;

import com.energy.dto.ExportQueryDTO;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.ExportHistory;
import com.energy.repository.ExportHistoryRepository;
import com.energy.service.ExportHistoryService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportHistoryServiceImpl implements ExportHistoryService {

    private final ExportHistoryRepository exportHistoryRepository;

    @Override
    public Page<ExportHistory> search(ExportQueryDTO dto) {
        Specification<ExportHistory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (dto.getOperator() != null && !dto.getOperator().isEmpty()) {
                predicates.add(cb.like(root.get("operator"), "%" + dto.getOperator() + "%"));
            }
            if (dto.getStartTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("exportTime"), dto.getStartTime()));
            }
            if (dto.getEndTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("exportTime"), dto.getEndTime()));
            }
            if (dto.getExportType() != null && !dto.getExportType().isEmpty()) {
                predicates.add(cb.equal(root.get("exportType"), dto.getExportType()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(dto.getPage(), dto.getSize(), Sort.by(Sort.Direction.DESC, "exportTime"));
        return exportHistoryRepository.findAll(spec, pageable);
    }

    @Override
    public ExportHistory recordExport(String exportType, String fileName, String operator,
                                      String area, EnergyQueryDTO query, Integer recordCount) {
        ExportHistory history = new ExportHistory();
        history.setExportNo("EXP" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        history.setExportType(exportType);
        history.setFileName(fileName);
        history.setOperator(operator);
        history.setArea(area);
        if (query != null) {
            history.setStartTime(query.getStartTime());
            history.setEndTime(query.getEndTime());
        }
        history.setExportTime(LocalDateTime.now());
        history.setRecordCount(recordCount);
        history.setStatus("SUCCESS");
        return exportHistoryRepository.save(history);
    }

    @Override
    public byte[] download(Long id) {
        return new byte[0];
    }
}
