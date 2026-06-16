package com.rider.analyzer.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import com.rider.analyzer.dto.BatchErrorRecord;
import com.rider.analyzer.dto.BatchImportResultVO;
import com.rider.analyzer.dto.PageResult;
import com.rider.analyzer.entity.BatchImportRecord;
import com.rider.analyzer.repository.BatchImportRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class BatchImportService {

    private final BatchImportRecordRepository batchImportRecordRepository;
    private static final String ERROR_DIR = System.getProperty("java.io.tmpdir") + "/rider_analyzer/import_errors/";
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    @Transactional
    public BatchImportResultVO importWithValidation(String type, MultipartFile file) {
        String batchNo = "BATCH_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "_" + UUID.randomUUID().toString().substring(0, 8);

        List<String[]> rows = parseFile(file);
        if (rows.isEmpty()) {
            throw new RuntimeException("文件为空");
        }

        String[] headers = rows.get(0);
        List<BatchErrorRecord> errorRecords = new ArrayList<>();
        int totalCount = rows.size() - 1;
        int successCount = 0;

        for (int i = 1; i < rows.size(); i++) {
            String[] row = rows.get(i);
            List<BatchErrorRecord> rowErrors = validateRow(type, row, headers, i + 1);
            if (rowErrors.isEmpty()) {
                successCount++;
            } else {
                errorRecords.addAll(rowErrors);
            }
        }

        int failCount = totalCount - successCount;
        String status = failCount == 0 ? "PENDING" : "VALIDATION_FAILED";

        BatchImportRecord record = new BatchImportRecord();
        record.setBatchNo(batchNo);
        record.setType(type);
        record.setTotalCount(totalCount);
        record.setSuccessCount(successCount);
        record.setFailCount(failCount);
        record.setStatus(status);

        String errorFilePath = null;
        if (failCount > 0) {
            errorFilePath = generateErrorFile(batchNo, errorRecords);
            record.setErrorFilePath(errorFilePath);
        }

        batchImportRecordRepository.save(record);

        BatchImportResultVO result = new BatchImportResultVO();
        result.setBatchNo(batchNo);
        result.setType(type);
        result.setTotalCount(totalCount);
        result.setSuccessCount(successCount);
        result.setFailCount(failCount);
        result.setStatus(status);
        result.setErrorRecords(errorRecords);

        return result;
    }

    private List<String[]> parseFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("文件名为空");
        }

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".csv")) {
                try (CSVReader reader = new CSVReader(new InputStreamReader(is, "UTF-8"))) {
                    return reader.readAll();
                }
            } else {
                List<String[]> rows = new ArrayList<>();
                BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
                String line;
                while ((line = br.readLine()) != null) {
                    rows.add(line.split(","));
                }
                return rows;
            }
        } catch (IOException | CsvException e) {
            throw new RuntimeException("文件解析失败: " + e.getMessage());
        }
    }

    private List<BatchErrorRecord> validateRow(String type, String[] row, String[] headers, int rowNum) {
        List<BatchErrorRecord> errors = new ArrayList<>();

        switch (type) {
            case "rider" -> validateRiderRow(row, headers, rowNum, errors);
            case "order" -> validateOrderRow(row, headers, rowNum, errors);
            case "inventory" -> validateInventoryRow(row, headers, rowNum, errors);
            default -> errors.add(new BatchErrorRecord(rowNum, "type", type, "不支持的导入类型"));
        }

        return errors;
    }

    private void validateRiderRow(String[] row, String[] headers, int rowNum, List<BatchErrorRecord> errors) {
        String name = getValue(row, headers, "姓名");
        String phone = getValue(row, headers, "手机号");
        String stationId = getValue(row, headers, "站点ID");

        if (name == null || name.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "姓名", name, "姓名不能为空"));
        }
        if (phone == null || phone.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "手机号", phone, "手机号不能为空"));
        } else if (!PHONE_PATTERN.matcher(phone.trim()).matches()) {
            errors.add(new BatchErrorRecord(rowNum, "手机号", phone, "手机号格式不正确"));
        }
        if (stationId == null || stationId.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "站点ID", stationId, "站点ID不能为空"));
        } else {
            try {
                Long.parseLong(stationId.trim());
            } catch (NumberFormatException e) {
                errors.add(new BatchErrorRecord(rowNum, "站点ID", stationId, "站点ID必须是数字"));
            }
        }
    }

    private void validateOrderRow(String[] row, String[] headers, int rowNum, List<BatchErrorRecord> errors) {
        String orderNo = getValue(row, headers, "订单号");
        String receiverName = getValue(row, headers, "收件人");
        String receiverPhone = getValue(row, headers, "收件人电话");
        String stationId = getValue(row, headers, "站点ID");
        String promiseTime = getValue(row, headers, "承诺时间");

        if (orderNo == null || orderNo.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "订单号", orderNo, "订单号不能为空"));
        }
        if (receiverName == null || receiverName.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "收件人", receiverName, "收件人不能为空"));
        }
        if (receiverPhone == null || receiverPhone.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "收件人电话", receiverPhone, "收件人电话不能为空"));
        } else if (!PHONE_PATTERN.matcher(receiverPhone.trim()).matches()) {
            errors.add(new BatchErrorRecord(rowNum, "收件人电话", receiverPhone, "手机号格式不正确"));
        }
        if (stationId == null || stationId.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "站点ID", stationId, "站点ID不能为空"));
        }
        if (promiseTime == null || promiseTime.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "承诺时间", promiseTime, "承诺时间不能为空"));
        }
    }

    private void validateInventoryRow(String[] row, String[] headers, int rowNum, List<BatchErrorRecord> errors) {
        String stationId = getValue(row, headers, "站点ID");
        String skuCode = getValue(row, headers, "SKU编码");
        String skuName = getValue(row, headers, "SKU名称");
        String quantity = getValue(row, headers, "数量");

        if (stationId == null || stationId.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "站点ID", stationId, "站点ID不能为空"));
        }
        if (skuCode == null || skuCode.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "SKU编码", skuCode, "SKU编码不能为空"));
        }
        if (skuName == null || skuName.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "SKU名称", skuName, "SKU名称不能为空"));
        }
        if (quantity == null || quantity.trim().isEmpty()) {
            errors.add(new BatchErrorRecord(rowNum, "数量", quantity, "数量不能为空"));
        } else {
            try {
                int q = Integer.parseInt(quantity.trim());
                if (q < 0) {
                    errors.add(new BatchErrorRecord(rowNum, "数量", quantity, "数量不能为负数"));
                }
            } catch (NumberFormatException e) {
                errors.add(new BatchErrorRecord(rowNum, "数量", quantity, "数量必须为整数"));
            }
        }
    }

    private String getValue(String[] row, String[] headers, String headerName) {
        for (int i = 0; i < headers.length; i++) {
            if (headers[i].trim().equals(headerName) && i < row.length) {
                return row[i];
            }
        }
        return null;
    }

    public String generateErrorFile(String batchNo) {
        BatchImportRecord record = batchImportRecordRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new RuntimeException("批次记录不存在"));
        if (record.getErrorFilePath() != null) {
            return record.getErrorFilePath();
        }
        return generateErrorFile(batchNo, new ArrayList<>());
    }

    private String generateErrorFile(String batchNo, List<BatchErrorRecord> errorRecords) {
        try {
            Path dirPath = Paths.get(ERROR_DIR);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String filePath = ERROR_DIR + batchNo + ".csv";
            try (FileWriter writer = new FileWriter(filePath)) {
                writer.write("行号,字段,值,错误原因\n");
                for (BatchErrorRecord er : errorRecords) {
                    writer.write(er.getRow() + ",\"" + er.getField() + "\",\""
                            + (er.getValue() != null ? er.getValue() : "") + "\",\""
                            + er.getReason() + "\"\n");
                }
            }
            return filePath;
        } catch (IOException e) {
            throw new RuntimeException("生成错误文件失败: " + e.getMessage());
        }
    }

    @Transactional
    public BatchImportRecord approve(String batchNo, boolean approved) {
        BatchImportRecord record = batchImportRecordRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new RuntimeException("批次记录不存在"));
        if (!"PENDING".equals(record.getStatus()) && !"VALIDATION_FAILED".equals(record.getStatus())) {
            throw new RuntimeException("批次状态不允许审批");
        }
        record.setStatus(approved ? "APPROVED" : "REJECTED");
        return batchImportRecordRepository.save(record);
    }

    public PageResult<BatchImportRecord> getBatchList(String status, int page, int pageSize) {
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page - 1, pageSize,
                        org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "createTime"));
        org.springframework.data.domain.Page<BatchImportRecord> p;
        if (status != null && !status.isEmpty()) {
            p = batchImportRecordRepository.findByStatus(status, pageable);
        } else {
            p = batchImportRecordRepository.findAll(pageable);
        }
        return new PageResult<>(p.getContent(), p.getTotalElements(), page, pageSize);
    }
}
