package com.property.workorder.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import com.property.workorder.entity.FeeBill;
import com.property.workorder.entity.InspectionTask;
import com.property.workorder.entity.VisitorAppointment;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExportService {

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public void exportFeeBills(List<FeeBill> bills, HttpServletResponse response) throws IOException {
        List<FeeBillExportVO> data = new ArrayList<>();
        for (FeeBill bill : bills) {
            FeeBillExportVO vo = new FeeBillExportVO();
            vo.setBillNo(bill.getBillNo());
            vo.setBuildingNo(bill.getBuildingNo());
            vo.setRoomNo(bill.getRoomNo());
            vo.setFeeType(bill.getFeeType());
            vo.setBillPeriod(bill.getBillPeriod());
            vo.setBillDate(bill.getBillDate() != null ? bill.getBillDate().format(DATE_FMT) : "");
            vo.setDueDate(bill.getDueDate() != null ? bill.getDueDate().format(DATE_FMT) : "");
            vo.setTotalAmount(bill.getTotalAmount());
            vo.setPaidAmount(bill.getPaidAmount());
            BigDecimal unpaid = bill.getTotalAmount().subtract(bill.getPaidAmount());
            vo.setUnpaidAmount(unpaid);
            vo.setStatus(mapBillStatus(bill.getStatus()));
            data.add(vo);
        }
        writeExcel(response, "收费进度_" + LocalDate.now(), FeeBillExportVO.class, data);
    }

    public void exportVisitors(List<VisitorAppointment> visitors, HttpServletResponse response) throws IOException {
        List<VisitorExportVO> data = new ArrayList<>();
        for (VisitorAppointment v : visitors) {
            VisitorExportVO vo = new VisitorExportVO();
            vo.setAppointmentNo(v.getAppointmentNo());
            vo.setVisitorName(v.getVisitorName());
            vo.setVisitorPhone(v.getVisitorPhone());
            vo.setVisitorCount(v.getVisitorCount());
            vo.setBuildingNo(v.getBuildingNo());
            vo.setRoomNo(v.getRoomNo());
            vo.setVisitDate(v.getVisitDate() != null ? v.getVisitDate().format(DATE_FMT) : "");
            vo.setVisitTime(v.getVisitTimeStart() + " - " + v.getVisitTimeEnd());
            vo.setVisitPurpose(v.getVisitPurpose());
            vo.setStatus(mapVisitorStatus(v.getStatus()));
            vo.setCreatedAt(v.getCreatedAt() != null ? v.getCreatedAt().format(DATE_TIME_FMT) : "");
            data.add(vo);
        }
        writeExcel(response, "访客预约_" + LocalDate.now(), VisitorExportVO.class, data);
    }

    public void exportInspections(List<InspectionTask> tasks, HttpServletResponse response) throws IOException {
        List<InspectionExportVO> data = new ArrayList<>();
        for (InspectionTask t : tasks) {
            InspectionExportVO vo = new InspectionExportVO();
            vo.setTaskNo(t.getTaskNo());
            vo.setTitle(t.getTitle());
            vo.setInspectionType(t.getInspectionType());
            vo.setArea(t.getArea());
            vo.setPlanDate(t.getPlanDate() != null ? t.getPlanDate().format(DATE_FMT) : "");
            vo.setStatus(mapInspectionStatus(t.getStatus()));
            vo.setResult(t.getResult());
            vo.setIssuesFound(t.getIssuesFound());
            data.add(vo);
        }
        writeExcel(response, "巡检任务_" + LocalDate.now(), InspectionExportVO.class, data);
    }

    private <T> void writeExcel(HttpServletResponse response, String fileName, Class<T> clazz, List<T> data) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + encodedFileName + ".xlsx");
        EasyExcel.write(response.getOutputStream(), clazz).sheet("数据").doWrite(data);
    }

    private String mapBillStatus(String status) {
        return switch (status) {
            case "UNPAID" -> "未缴";
            case "PARTIAL_PAID" -> "部分已缴";
            case "PAID" -> "已缴清";
            case "OVERDUE" -> "逾期";
            case "CANCELLED" -> "已取消";
            default -> status;
        };
    }

    private String mapVisitorStatus(String status) {
        return switch (status) {
            case "PENDING" -> "待审批";
            case "APPROVED" -> "已批准";
            case "REJECTED" -> "已拒绝";
            case "CHECKED_IN" -> "已到访";
            case "CHECKED_OUT" -> "已离开";
            case "EXPIRED" -> "已过期";
            default -> status;
        };
    }

    private String mapInspectionStatus(String status) {
        return switch (status) {
            case "PENDING" -> "待执行";
            case "IN_PROGRESS" -> "进行中";
            case "COMPLETED" -> "已完成";
            case "EXPIRED" -> "已过期";
            default -> status;
        };
    }

    @Data
    @ColumnWidth(20)
    public static class FeeBillExportVO {
        @ExcelProperty("账单编号")
        private String billNo;
        @ExcelProperty("楼栋")
        private String buildingNo;
        @ExcelProperty("房间号")
        private String roomNo;
        @ExcelProperty("费用类型")
        private String feeType;
        @ExcelProperty("账期")
        private String billPeriod;
        @ExcelProperty("出账日期")
        private String billDate;
        @ExcelProperty("截止日期")
        private String dueDate;
        @ExcelProperty("应缴金额")
        private BigDecimal totalAmount;
        @ExcelProperty("已缴金额")
        private BigDecimal paidAmount;
        @ExcelProperty("未缴金额")
        private BigDecimal unpaidAmount;
        @ExcelProperty("状态")
        private String status;
    }

    @Data
    @ColumnWidth(20)
    public static class VisitorExportVO {
        @ExcelProperty("预约编号")
        private String appointmentNo;
        @ExcelProperty("访客姓名")
        private String visitorName;
        @ExcelProperty("访客电话")
        private String visitorPhone;
        @ExcelProperty("来访人数")
        private Integer visitorCount;
        @ExcelProperty("楼栋")
        private String buildingNo;
        @ExcelProperty("房间号")
        private String roomNo;
        @ExcelProperty("来访日期")
        private String visitDate;
        @ExcelProperty("来访时段")
        private String visitTime;
        @ExcelProperty("来访事由")
        private String visitPurpose;
        @ExcelProperty("状态")
        private String status;
        @ExcelProperty("创建时间")
        private String createdAt;
    }

    @Data
    @ColumnWidth(20)
    public static class InspectionExportVO {
        @ExcelProperty("任务编号")
        private String taskNo;
        @ExcelProperty("任务标题")
        private String title;
        @ExcelProperty("巡检类型")
        private String inspectionType;
        @ExcelProperty("巡检区域")
        private String area;
        @ExcelProperty("计划日期")
        private String planDate;
        @ExcelProperty("状态")
        private String status;
        @ExcelProperty("巡检结果")
        private String result;
        @ExcelProperty("发现问题")
        private String issuesFound;
    }
}
