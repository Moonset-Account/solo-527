package com.energy.service.impl;

import com.energy.dto.ExportQueryDTO;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.ExportHistory;
import com.energy.repository.ExportHistoryRepository;
import com.energy.service.ExportHistoryService;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportHistoryServiceImpl implements ExportHistoryService {

    private final ExportHistoryRepository exportHistoryRepository;

    @Value("${app.export.base-dir:./exports}")
    private String exportBaseDir;

    @PostConstruct
    public void init() throws IOException {
        Path dir = Paths.get(exportBaseDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
    }

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
    public ExportHistory getById(Long id) {
        return exportHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("导出记录不存在"));
    }

    @Override
    public ExportHistory recordExport(String exportType, String fileName, String fileContent,
                                      String operator, String area, EnergyQueryDTO query, Integer recordCount) {
        String exportNo = "EXP" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String datedDir = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Path dirPath = Paths.get(exportBaseDir, datedDir);
        try {
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }
            String safeFileName = exportNo + "_" + fileName;
            Path filePath = dirPath.resolve(safeFileName);
            Files.writeString(filePath, fileContent);

            ExportHistory history = new ExportHistory();
            history.setExportNo(exportNo);
            history.setExportType(exportType);
            history.setFileName(fileName);
            history.setFilePath(filePath.toAbsolutePath().toString());
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
        } catch (IOException e) {
            throw new RuntimeException("导出文件保存失败", e);
        }
    }

    @Override
    public byte[] downloadFile(Long id) {
        ExportHistory history = getById(id);
        if (history.getFilePath() == null || history.getFilePath().isEmpty()) {
            throw new RuntimeException("文件路径为空，无法下载");
        }
        try {
            Path path = Paths.get(history.getFilePath());
            if (!Files.exists(path)) {
                throw new RuntimeException("文件不存在");
            }
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("读取文件失败", e);
        }
    }
}
