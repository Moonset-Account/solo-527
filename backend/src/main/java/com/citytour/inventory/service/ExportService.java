package com.citytour.inventory.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.alibaba.excel.write.metadata.style.WriteCellStyle;
import com.alibaba.excel.write.metadata.style.WriteFont;
import com.alibaba.excel.write.style.HorizontalCellStyleStrategy;
import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.ExportLog;
import com.citytour.inventory.entity.InventoryDetail;
import com.citytour.inventory.repository.ExportLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExportLogRepository exportLogRepository;
    private final InventoryDetailService inventoryDetailService;
    private final ObjectMapper objectMapper;

    public PageResult<ExportLog> listExportLogs(int page, int size, String exportNo, String exportType,
                                           String exportBy, LocalDateTime startTime,
                                           LocalDateTime endTime, String status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "exportTime"));
        Page<ExportLog> result = exportLogRepository.findByConditions(
                exportNo, exportType, exportBy, startTime, endTime, status, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public ExportLog getExportLogByNo(String exportNo) {
        return exportLogRepository.findByExportNo(exportNo).orElse(null);
    }

    public void exportInventoryDetails(HttpServletResponse response, String hotelCode, String roomType,
                                  String roomNumber, java.time.LocalDate startDate,
                                  java.time.LocalDate endDate, String roomStatus,
                                  String cleanStatus, String operator) throws IOException {

        String exportNo = "EXP" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String fileName = "inventory_detail_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".xlsx";

        Map<String, Object> criteria = new HashMap<>();
        criteria.put("hotelCode", hotelCode);
        criteria.put("roomType", roomType);
        criteria.put("roomNumber", roomNumber);
        criteria.put("startDate", startDate);
        criteria.put("endDate", endDate);
        criteria.put("roomStatus", roomStatus);
        criteria.put("cleanStatus", cleanStatus);
        criteria.put("exportBy", operator);
        criteria.put("exportTime", LocalDateTime.now().toString());

        String queryCriteria = objectMapper.writeValueAsString(criteria);

        ExportLog exportLog = new ExportLog();
        exportLog.setExportNo(exportNo);
        exportLog.setExportType("INVENTORY_DETAIL");
        exportLog.setExportName("库存明细导出");
        exportLog.setExportBy(operator);
        exportLog.setExportTime(LocalDateTime.now());
        exportLog.setQueryCriteria(queryCriteria);
        exportLog.setFileName(fileName);
        exportLog.setStatus("PROCESSING");
        exportLog.setCreatedBy(operator);
        exportLogRepository.save(exportLog);

        try {
            List<InventoryDetail> data = fetchAllInventoryDetails(hotelCode, roomType, roomNumber,
                    startDate, endDate, roomStatus, cleanStatus);

            exportLog.setRecordCount(data.size());

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setCharacterEncoding("utf-8");
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
            response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + encodedFileName);
            response.setHeader("Export-No", exportNo);
            response.setHeader("Query-Criteria", URLEncoder.encode(queryCriteria, StandardCharsets.UTF_8));

            WriteCellStyle headStyle = new WriteCellStyle();
            headStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            WriteFont headFont = new WriteFont();
            headFont.setFontHeightInPoints((short) 11);
            headFont.setBold(true);
            headStyle.setWriteFont(headFont);

            WriteCellStyle contentStyle = new WriteCellStyle();

            HorizontalCellStyleStrategy strategy = new HorizontalCellStyleStrategy(headStyle, contentStyle);

            List<ExportMetaVO> metaList = buildExportMeta(exportNo, operator, criteria, data.size());

            try (ExcelWriter excelWriter = EasyExcel.write(response.getOutputStream())
                    .registerWriteHandler(strategy)
                    .build()) {

                WriteSheet dataSheet = EasyExcel.writerSheet(0, "库存明细")
                        .head(InventoryDetailExportVO.class)
                        .build();
                excelWriter.write(data.stream().map(this::convertToVO).toList(), dataSheet);

                WriteSheet metaSheet = EasyExcel.writerSheet(1, "导出说明")
                        .head(ExportMetaVO.class)
                        .build();
                excelWriter.write(metaList, metaSheet);
            }

            exportLog.setStatus("SUCCESS");
        } catch (Exception e) {
            exportLog.setStatus("FAILED");
            exportLog.setRemark(e.getMessage());
            throw e;
        } finally {
            exportLogRepository.save(exportLog);
        }
    }

    private List<ExportMetaVO> buildExportMeta(String exportNo, String operator,
                                               Map<String, Object> criteria, int recordCount) {
        List<ExportMetaVO> metaList = new ArrayList<>();

        metaList.add(createMeta("导出单号", exportNo));
        metaList.add(createMeta("导出名称", "库存明细导出"));
        metaList.add(createMeta("导出人", operator));
        metaList.add(createMeta("导出时间", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
        metaList.add(createMeta("记录总数", String.valueOf(recordCount)));
        metaList.add(createMeta("", ""));
        metaList.add(createMeta("=== 查询筛选条件 ===", ""));

        Map<String, String> labelMap = new HashMap<>();
        labelMap.put("hotelCode", "酒店编码");
        labelMap.put("roomType", "房型");
        labelMap.put("roomNumber", "房号");
        labelMap.put("startDate", "开始日期");
        labelMap.put("endDate", "结束日期");
        labelMap.put("roomStatus", "房态");
        labelMap.put("cleanStatus", "清洁状态");

        for (Map.Entry<String, String> entry : labelMap.entrySet()) {
            Object value = criteria.get(entry.getKey());
            if (value != null && !value.toString().isEmpty()) {
                metaList.add(createMeta(entry.getValue(), value.toString()));
            }
        }

        metaList.add(createMeta("", ""));
        metaList.add(createMeta("备注", "本文件数据按上述筛选条件导出，如需核对请联系导出人"));

        return metaList;
    }

    private ExportMetaVO createMeta(String item, String value) {
        ExportMetaVO vo = new ExportMetaVO();
        vo.setItem(item);
        vo.setValue(value);
        return vo;
    }

    private List<InventoryDetail> fetchAllInventoryDetails(String hotelCode, String roomType,
                                                           String roomNumber, java.time.LocalDate startDate,
                                                           java.time.LocalDate endDate,
                                                           String roomStatus, String cleanStatus) {
        int page = 0;
        int size = 1000;
        List<InventoryDetail> allData = new java.util.ArrayList<>();

        while (true) {
            PageResult<InventoryDetail> result = inventoryDetailService.list(
                    page, size, null, null, hotelCode, roomType, roomNumber,
                    startDate, endDate, roomStatus, cleanStatus);
            allData.addAll(result.getRecords());
            if (result.getRecords().size() < size) {
                break;
            }
            page++;
        }
        return allData;
    }

    private InventoryDetailExportVO convertToVO(InventoryDetail detail) {
        InventoryDetailExportVO vo = new InventoryDetailExportVO();
        vo.setId(detail.getId());
        vo.setHotelCode(detail.getHotelCode());
        vo.setRoomType(detail.getRoomType());
        vo.setRoomNumber(detail.getRoomNumber());
        vo.setInventoryDate(detail.getInventoryDate());
        vo.setOrderNo(detail.getOrderNo());
        vo.setGuestName(detail.getGuestName());
        vo.setRoomStatus(detail.getRoomStatus());
        vo.setCleanStatus(detail.getCleanStatus());
        vo.setSourceType(detail.getSourceType());
        vo.setRemark(detail.getRemark());
        return vo;
    }

    @lombok.Data
    public static class InventoryDetailExportVO {
        @com.alibaba.excel.annotation.ExcelProperty("ID")
        private Long id;

        @com.alibaba.excel.annotation.ExcelProperty("酒店编码")
        private String hotelCode;

        @com.alibaba.excel.annotation.ExcelProperty("房型")
        private String roomType;

        @com.alibaba.excel.annotation.ExcelProperty("房号")
        private String roomNumber;

        @com.alibaba.excel.annotation.ExcelProperty("库存日期")
        private java.time.LocalDate inventoryDate;

        @com.alibaba.excel.annotation.ExcelProperty("订单号")
        private String orderNo;

        @com.alibaba.excel.annotation.ExcelProperty("客人姓名")
        private String guestName;

        @com.alibaba.excel.annotation.ExcelProperty("房态")
        private String roomStatus;

        @com.alibaba.excel.annotation.ExcelProperty("清洁状态")
        private String cleanStatus;

        @com.alibaba.excel.annotation.ExcelProperty("来源类型")
        private String sourceType;

        @com.alibaba.excel.annotation.ExcelProperty("备注")
        private String remark;
    }

    @Data
    public static class ExportMetaVO {
        @ExcelProperty("项目")
        private String item;

        @ExcelProperty("内容")
        private String value;
    }
}
