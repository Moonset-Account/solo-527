package com.ceramic.kiln.service;

import com.ceramic.kiln.dto.KilnRunCreateDTO;
import com.ceramic.kiln.entity.*;
import com.ceramic.kiln.exception.BusinessException;
import com.ceramic.kiln.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KilnRunService {

    private final KilnRunRepository kilnRunRepository;
    private final KilnRepository kilnRepository;
    private final FiringCurveRepository firingCurveRepository;
    private final ArtworkRepository artworkRepository;
    private final StudentRepository studentRepository;
    private final ClayRepository clayRepository;
    private final GlazeRepository glazeRepository;

    @Transactional
    public KilnRun createKilnRun(KilnRunCreateDTO dto, Long userId) {
        Kiln kiln = kilnRepository.findById(dto.getKilnId())
            .orElseThrow(() -> new BusinessException("窑炉不存在"));

        if (!kiln.getTemperatureZones().contains(dto.getTemperatureZone())) {
            throw new BusinessException("该窑炉不支持温区: " + dto.getTemperatureZone());
        }

        FiringCurve curve = firingCurveRepository.findById(dto.getFiringCurveId())
            .orElseThrow(() -> new BusinessException("烧成曲线不存在"));

        if (!curve.getTemperatureZone().equals(dto.getTemperatureZone())) {
            throw new BusinessException("烧成曲线温区与窑次温区不匹配");
        }

        KilnRun kilnRun = new KilnRun();
        kilnRun.setRunCode(generateRunCode());
        kilnRun.setKilnId(kiln.getId());
        kilnRun.setFiringCurveId(curve.getId());
        kilnRun.setTemperatureZone(dto.getTemperatureZone());
        kilnRun.setScheduledStartTime(dto.getScheduledStartTime());
        kilnRun.setMaxCapacity(dto.getMaxCapacity());
        kilnRun.setUsedCapacity(0);
        kilnRun.setNotes(dto.getNotes());
        kilnRun.setStatus("DRAFT");
        kilnRun.setCreatedBy(userId);

        return kilnRunRepository.save(kilnRun);
    }

    @Transactional
    public KilnRun approveKilnRun(Long id, Long userId) {
        KilnRun kilnRun = kilnRunRepository.findById(id)
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if (!"DRAFT".equals(kilnRun.getStatus())) {
            throw new BusinessException("只有草稿状态的窑次才能审批");
        }

        kilnRun.setStatus("APPROVED");
        kilnRun.setApprovedBy(userId);
        kilnRun.setApprovedAt(LocalDateTime.now());

        return kilnRunRepository.save(kilnRun);
    }

    @Transactional
    public KilnRun withdrawKilnRun(Long id, Long userId) {
        KilnRun kilnRun = kilnRunRepository.findById(id)
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if (!"APPROVED".equals(kilnRun.getStatus())) {
            throw new BusinessException("只有已审批的窑次才能撤回");
        }

        List<Artwork> artworks = artworkRepository.findByKilnRunId(id);
        artworks.forEach(artwork -> {
            artwork.setKilnRunId(null);
            artwork.setStatus("REVIEWED");
            artwork.setPositionInKiln(null);
            artworkRepository.save(artwork);
        });

        kilnRun.setStatus("DRAFT");
        kilnRun.setApprovedBy(null);
        kilnRun.setApprovedAt(null);
        kilnRun.setUsedCapacity(0);

        return kilnRunRepository.save(kilnRun);
    }

    @Transactional
    public KilnRun startFiring(Long id, Long userId) {
        KilnRun kilnRun = kilnRunRepository.findById(id)
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if (!"APPROVED".equals(kilnRun.getStatus())) {
            throw new BusinessException("只有已审批的窑次才能开始烧制");
        }

        kilnRun.setStatus("FIRING");
        kilnRun.setActualStartTime(LocalDateTime.now());

        return kilnRunRepository.save(kilnRun);
    }

    @Transactional
    public KilnRun completeFiring(Long id, Long userId) {
        KilnRun kilnRun = kilnRunRepository.findById(id)
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if (!"FIRING".equals(kilnRun.getStatus())) {
            throw new BusinessException("只有烧制中的窑次才能完成");
        }

        kilnRun.setStatus("COMPLETED");
        kilnRun.setActualEndTime(LocalDateTime.now());

        return kilnRunRepository.save(kilnRun);
    }

    public Page<KilnRun> searchKilnRuns(Map<String, Object> criteria, Pageable pageable) {
        Specification<KilnRun> spec = Specification.where(null);

        if (criteria.containsKey("status") && criteria.get("status") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), criteria.get("status")));
        }
        if (criteria.containsKey("kilnId") && criteria.get("kilnId") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("kilnId"), criteria.get("kilnId")));
        }
        if (criteria.containsKey("temperatureZone") && criteria.get("temperatureZone") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("temperatureZone"), criteria.get("temperatureZone")));
        }

        return kilnRunRepository.findAll(spec, pageable);
    }

    public byte[] exportKilnRunArtworks(Long kilnRunId) throws Exception {
        KilnRun kilnRun = kilnRunRepository.findById(kilnRunId)
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        List<Artwork> artworks = artworkRepository.findByKilnRunId(kilnRunId);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("窑次作品清单");

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("作品编号");
        headerRow.createCell(1).setCellValue("作品名称");
        headerRow.createCell(2).setCellValue("学员姓名");
        headerRow.createCell(3).setCellValue("学员电话");
        headerRow.createCell(4).setCellValue("泥料");
        headerRow.createCell(5).setCellValue("釉料");
        headerRow.createCell(6).setCellValue("重量(kg)");
        headerRow.createCell(7).setCellValue("状态");

        int rowNum = 1;
        for (Artwork artwork : artworks) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(artwork.getArtworkCode());
            row.createCell(1).setCellValue(artwork.getName() != null ? artwork.getName() : "");
            
            Student student = studentRepository.findById(artwork.getStudentId()).orElse(null);
            if (student != null) {
                row.createCell(2).setCellValue(student.getName());
                row.createCell(3).setCellValue(student.getPhone() != null ? student.getPhone() : "");
            }
            
            Clay clay = clayRepository.findById(artwork.getClayId()).orElse(null);
            row.createCell(4).setCellValue(clay != null ? clay.getName() : "");
            
            if (artwork.getGlazeId() != null) {
                Glaze glaze = glazeRepository.findById(artwork.getGlazeId()).orElse(null);
                row.createCell(5).setCellValue(glaze != null ? glaze.getName() : "");
            }
            
            row.createCell(6).setCellValue(artwork.getWeight() != null ? artwork.getWeight().doubleValue() : 0);
            row.createCell(7).setCellValue(artwork.getStatus());
        }

        for (int i = 0; i < 8; i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    public KilnRun getKilnRun(Long id) {
        return kilnRunRepository.findById(id)
            .orElseThrow(() -> new BusinessException("窑次不存在"));
    }

    private String generateRunCode() {
        return "KR" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) +
            String.format("%04d", (int)(Math.random() * 10000));
    }
}
