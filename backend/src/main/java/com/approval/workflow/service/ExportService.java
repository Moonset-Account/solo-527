package com.approval.workflow.service;

import com.approval.workflow.dto.RequirementQueryDTO;
import com.approval.workflow.entity.Requirement;
import com.approval.workflow.enums.OperationType;
import com.approval.workflow.util.SecurityUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ExportService {

    private final StringRedisTemplate stringRedisTemplate;
    private final RequirementService requirementService;
    private final OperationLogService operationLogService;
    private final ObjectMapper objectMapper;

    @Value("${export.cache.prefix}")
    private String exportCachePrefix;

    @Value("${export.cache.ttl}")
    private long exportCacheTtl;

    public ExportService(StringRedisTemplate stringRedisTemplate,
                         RequirementService requirementService,
                         OperationLogService operationLogService) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.requirementService = requirementService;
        this.operationLogService = operationLogService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public String generateExportKey(RequirementQueryDTO query) {
        try {
            String queryJson = objectMapper.writeValueAsString(query);
            Long userId = SecurityUtil.getCurrentUserId();
            String combined = userId + ":" + queryJson;
            return exportCachePrefix + md5(combined);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("生成导出键失败", e);
        }
    }

    public boolean hasExported(String exportKey) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(exportKey));
    }

    public void markExported(String exportKey, String remark) {
        Long userId = SecurityUtil.getCurrentUserId();
        String value = userId + "|" + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        if (remark != null) {
            value += "|" + remark;
        }
        stringRedisTemplate.opsForValue().set(exportKey, value, exportCacheTtl, TimeUnit.SECONDS);
    }

    public String getExportInfo(String exportKey) {
        return stringRedisTemplate.opsForValue().get(exportKey);
    }

    public byte[] exportRequirements(RequirementQueryDTO query, boolean checkDuplicate) throws IOException {
        String exportKey = generateExportKey(query);

        if (checkDuplicate && hasExported(exportKey)) {
            String exportInfo = getExportInfo(exportKey);
            throw new RuntimeException("该筛选条件的数据已被导出过，导出信息：" + exportInfo);
        }

        Pageable pageable = PageRequest.of(0, 10000, buildSort(query));
        Page<Requirement> page = requirementService.searchRequirements(query, pageable);
        List<Requirement> requirements = page.getContent();

        byte[] excelData = generateExcel(requirements);

        markExported(exportKey, "导出" + requirements.size() + "条数据");

        operationLogService.log(OperationType.EXPORT, null,
                "导出需求数据，条件：" + buildQueryDesc(query) + "，共" + requirements.size() + "条");

        return excelData;
    }

    public byte[] exportRequirementsByIds(List<Long> ids) throws IOException {
        List<Requirement> requirements = requirementService.getRequirementsByIds(ids);

        String keySuffix = ids.stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
        String exportKey = exportCachePrefix + "ids:" + md5(keySuffix);

        if (hasExported(exportKey)) {
            throw new RuntimeException("这批数据已被导出过");
        }

        byte[] excelData = generateExcel(requirements);

        markExported(exportKey, "按ID导出" + requirements.size() + "条数据");

        operationLogService.log(OperationType.EXPORT, null,
                "按ID导出需求数据，共" + requirements.size() + "条");

        return excelData;
    }

    private byte[] generateExcel(List<Requirement> requirements) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("需求列表");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "标题", "描述", "分类", "优先级", "状态",
                    "创建人ID", "负责人ID", "部门ID", "创建时间", "更新时间",
                    "预期完成时间", "实际完成时间", "标签"};

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            int rowNum = 1;
            for (Requirement req : requirements) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(req.getId() != null ? req.getId() : 0);
                row.createCell(1).setCellValue(req.getTitle() != null ? req.getTitle() : "");
                row.createCell(2).setCellValue(req.getDescription() != null ? req.getDescription() : "");
                row.createCell(3).setCellValue(req.getCategory() != null ? req.getCategory() : "");
                row.createCell(4).setCellValue(req.getPriority() != null ? req.getPriority() : 0);
                row.createCell(5).setCellValue(req.getStatus() != null ? req.getStatus().name() : "");
                row.createCell(6).setCellValue(req.getCreatorId() != null ? req.getCreatorId() : 0);
                row.createCell(7).setCellValue(req.getAssigneeId() != null ? req.getAssigneeId() : 0);
                row.createCell(8).setCellValue(req.getDeptId() != null ? req.getDeptId() : 0);
                row.createCell(9).setCellValue(req.getCreatedAt() != null ? req.getCreatedAt().format(formatter) : "");
                row.createCell(10).setCellValue(req.getUpdatedAt() != null ? req.getUpdatedAt().format(formatter) : "");
                row.createCell(11).setCellValue(req.getExpectedDate() != null ? req.getExpectedDate().toString() : "");
                row.createCell(12).setCellValue(req.getActualDate() != null ? req.getActualDate().toString() : "");
                row.createCell(13).setCellValue(req.getTags() != null ? req.getTags() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private Sort buildSort(RequirementQueryDTO query) {
        String sortBy = query.getSortBy() != null ? query.getSortBy() : "createdAt";
        String direction = query.getSortDirection() != null ? query.getSortDirection() : "desc";

        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, sortBy);
    }

    private String buildQueryDesc(RequirementQueryDTO query) {
        StringBuilder sb = new StringBuilder();
        if (query.getKeyword() != null) sb.append("关键词:").append(query.getKeyword()).append(",");
        if (query.getStatus() != null) sb.append("状态:").append(query.getStatus()).append(",");
        if (query.getDeptId() != null) sb.append("部门ID:").append(query.getDeptId()).append(",");
        return sb.length() > 0 ? sb.substring(0, sb.length() - 1) : "全部";
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5算法不可用", e);
        }
    }
}
