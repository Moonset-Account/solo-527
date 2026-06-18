package com.emailgenerator.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import com.alibaba.excel.annotation.write.style.ContentStyle;
import com.alibaba.excel.enums.poi.HorizontalAlignmentEnum;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.alibaba.excel.write.metadata.style.WriteCellStyle;
import com.alibaba.excel.write.metadata.style.WriteFont;
import com.alibaba.excel.write.style.HorizontalCellStyleStrategy;
import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.entity.EmailRecord;
import com.emailgenerator.entity.RiskSample;
import com.emailgenerator.repository.EmailRecordRepository;
import com.emailgenerator.repository.RiskSampleRepository;
import jakarta.persistence.criteria.Predicate;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExportService {

    private final EmailRecordRepository emailRecordRepository;
    private final RiskSampleRepository riskSampleRepository;

    public ExportService(EmailRecordRepository emailRecordRepository,
                         RiskSampleRepository riskSampleRepository) {
        this.emailRecordRepository = emailRecordRepository;
        this.riskSampleRepository = riskSampleRepository;
    }

    public void exportEmailRecords(BaseQuery query, HttpServletResponse response, String operator) throws IOException {
        Specification<EmailRecord> spec = buildRecordSpecification(query);
        List<EmailRecord> records = emailRecordRepository.findAll(spec);

        List<EmailRecordExcelVO> dataList = new ArrayList<>();
        for (EmailRecord record : records) {
            EmailRecordExcelVO vo = new EmailRecordExcelVO();
            vo.setId(record.getId());
            vo.setTaskName(record.getTaskName());
            vo.setTemplateName(record.getTemplateName());
            vo.setRecipientEmail(record.getRecipientEmail());
            vo.setRecipientName(record.getRecipientName());
            vo.setSubject(record.getSubject());
            vo.setStatus(record.getStatus());
            vo.setIsRisk(record.getIsRisk() != null && record.getIsRisk() ? "是" : "否");
            vo.setRiskReason(record.getRiskReason());
            vo.setSource(record.getSource());
            vo.setOwner(record.getOwner());
            vo.setLegalOwner(record.getLegalOwner());
            vo.setErrorMessage(record.getErrorMessage());
            vo.setCreateBy(record.getCreateBy());
            vo.setCreateTime(record.getCreateTime() != null ?
                record.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "");
            dataList.add(vo);
        }

        String exportTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String timeRange = buildTimeRange(query);
        String filters = buildFilters(query);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("邮件生成记录导出", StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");

        List<MetaRow> metaRows = new ArrayList<>();
        metaRows.add(new MetaRow("导出时间", exportTime));
        metaRows.add(new MetaRow("时间范围", timeRange));
        metaRows.add(new MetaRow("过滤条件", filters));
        metaRows.add(new MetaRow("生成者", operator));
        metaRows.add(new MetaRow("数据总数", String.valueOf(dataList.size())));

        try (ExcelWriter excelWriter = EasyExcel.write(response.getOutputStream()).build()) {
            WriteSheet metaSheet = EasyExcel.writerSheet(0, "导出说明")
                .head(MetaRow.class)
                .registerWriteHandler(buildMetaStyleStrategy())
                .build();
            excelWriter.write(metaRows, metaSheet);

            WriteSheet dataSheet = EasyExcel.writerSheet(1, "邮件记录明细")
                .head(EmailRecordExcelVO.class)
                .build();
            excelWriter.write(dataList, dataSheet);
        }
    }

    public void exportRiskSamples(BaseQuery query, HttpServletResponse response, String operator) throws IOException {
        Specification<RiskSample> spec = buildRiskSpecification(query);
        List<RiskSample> samples = riskSampleRepository.findAll(spec);

        List<RiskSampleExcelVO> dataList = new ArrayList<>();
        for (RiskSample sample : samples) {
            RiskSampleExcelVO vo = new RiskSampleExcelVO();
            vo.setId(sample.getId());
            vo.setTaskName(sample.getTaskName());
            vo.setTemplateName(sample.getTemplateName());
            vo.setSubject(sample.getSubject());
            vo.setRiskType(sample.getRiskType());
            vo.setRiskDescription(sample.getRiskDescription());
            vo.setRiskLevel(sample.getRiskLevel());
            vo.setSource(sample.getSource());
            vo.setOwner(sample.getOwner());
            vo.setLegalOwner(sample.getLegalOwner());
            vo.setReviewStatus(sample.getReviewStatus());
            vo.setReviewComment(sample.getReviewComment());
            vo.setReviewBy(sample.getReviewBy());
            vo.setReviewTime(sample.getReviewTime() != null ?
                sample.getReviewTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "");
            vo.setCreateBy(sample.getCreateBy());
            vo.setCreateTime(sample.getCreateTime() != null ?
                sample.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "");
            dataList.add(vo);
        }

        String exportTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String timeRange = buildTimeRange(query);
        String filters = buildFilters(query);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("风险样本导出", StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");

        List<MetaRow> metaRows = new ArrayList<>();
        metaRows.add(new MetaRow("导出时间", exportTime));
        metaRows.add(new MetaRow("时间范围", timeRange));
        metaRows.add(new MetaRow("过滤条件", filters));
        metaRows.add(new MetaRow("生成者", operator));
        metaRows.add(new MetaRow("数据总数", String.valueOf(dataList.size())));

        try (ExcelWriter excelWriter = EasyExcel.write(response.getOutputStream()).build()) {
            WriteSheet metaSheet = EasyExcel.writerSheet(0, "导出说明")
                .head(MetaRow.class)
                .registerWriteHandler(buildMetaStyleStrategy())
                .build();
            excelWriter.write(metaRows, metaSheet);

            WriteSheet dataSheet = EasyExcel.writerSheet(1, "风险样本明细")
                .head(RiskSampleExcelVO.class)
                .build();
            excelWriter.write(dataList, dataSheet);
        }
    }

    private HorizontalCellStyleStrategy buildMetaStyleStrategy() {
        WriteCellStyle headWriteCellStyle = new WriteCellStyle();
        headWriteCellStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headWriteCellStyle.setFillPatternType(FillPatternType.SOLID_FOREGROUND);
        headWriteCellStyle.setHorizontalAlignment(HorizontalAlignmentEnum.LEFT);
        WriteFont headFont = new WriteFont();
        headFont.setFontHeightInPoints((short) 12);
        headFont.setBold(true);
        headWriteCellStyle.setWriteFont(headFont);

        WriteCellStyle contentWriteCellStyle = new WriteCellStyle();
        contentWriteCellStyle.setHorizontalAlignment(HorizontalAlignmentEnum.LEFT);

        return new HorizontalCellStyleStrategy(headWriteCellStyle, contentWriteCellStyle);
    }

    private Specification<EmailRecord> buildRecordSpecification(BaseQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getStatus() != null && !query.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), query.getStatus()));
            }
            if (query.getOwner() != null && !query.getOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("owner"), query.getOwner()));
            }
            if (query.getSource() != null && !query.getSource().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("source"), query.getSource()));
            }
            if (query.getLegalOwner() != null && !query.getLegalOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("legalOwner"), query.getLegalOwner()));
            }
            if (query.getStartTime() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createTime"), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createTime"), query.getEndTime()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<RiskSample> buildRiskSpecification(BaseQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getStatus() != null && !query.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("reviewStatus"), query.getStatus()));
            }
            if (query.getOwner() != null && !query.getOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("owner"), query.getOwner()));
            }
            if (query.getSource() != null && !query.getSource().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("source"), query.getSource()));
            }
            if (query.getLegalOwner() != null && !query.getLegalOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("legalOwner"), query.getLegalOwner()));
            }
            if (query.getStartTime() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createTime"), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createTime"), query.getEndTime()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String buildTimeRange(BaseQuery query) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String start = query.getStartTime() != null ? query.getStartTime().format(formatter) : "不限";
        String end = query.getEndTime() != null ? query.getEndTime().format(formatter) : "不限";
        return start + " 至 " + end;
    }

    private String buildFilters(BaseQuery query) {
        StringBuilder sb = new StringBuilder();
        if (query.getStatus() != null && !query.getStatus().isEmpty()) {
            sb.append("状态:").append(query.getStatus()).append("; ");
        }
        if (query.getOwner() != null && !query.getOwner().isEmpty()) {
            sb.append("负责人:").append(query.getOwner()).append("; ");
        }
        if (query.getSource() != null && !query.getSource().isEmpty()) {
            sb.append("来源:").append(query.getSource()).append("; ");
        }
        if (query.getLegalOwner() != null && !query.getLegalOwner().isEmpty()) {
            sb.append("法务负责人:").append(query.getLegalOwner()).append("; ");
        }
        if (query.getErrorReason() != null && !query.getErrorReason().isEmpty()) {
            sb.append("异常原因:").append(query.getErrorReason()).append("; ");
        }
        if (sb.length() == 0) {
            sb.append("无");
        }
        return sb.toString();
    }

    public static class MetaRow {
        @ExcelProperty("项目")
        @ColumnWidth(20)
        private String label;

        @ExcelProperty("值")
        @ColumnWidth(60)
        private String value;

        public MetaRow() {
        }

        public MetaRow(String label, String value) {
            this.label = label;
            this.value = value;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }

    public static class EmailRecordExcelVO {
        @ExcelProperty("ID")
        @ColumnWidth(10)
        private Long id;

        @ExcelProperty("任务名称")
        @ColumnWidth(25)
        private String taskName;

        @ExcelProperty("模板名称")
        @ColumnWidth(25)
        private String templateName;

        @ExcelProperty("收件人邮箱")
        @ColumnWidth(25)
        private String recipientEmail;

        @ExcelProperty("收件人姓名")
        @ColumnWidth(15)
        private String recipientName;

        @ExcelProperty("邮件主题")
        @ColumnWidth(30)
        private String subject;

        @ExcelProperty("状态")
        @ColumnWidth(10)
        private String status;

        @ExcelProperty("是否风险")
        @ColumnWidth(10)
        private String isRisk;

        @ExcelProperty("风险原因")
        @ColumnWidth(20)
        private String riskReason;

        @ExcelProperty("来源")
        @ColumnWidth(15)
        private String source;

        @ExcelProperty("负责人")
        @ColumnWidth(15)
        private String owner;

        @ExcelProperty("法务负责人")
        @ColumnWidth(15)
        private String legalOwner;

        @ExcelProperty("错误信息")
        @ColumnWidth(25)
        private String errorMessage;

        @ExcelProperty("创建人")
        @ColumnWidth(15)
        private String createBy;

        @ExcelProperty("创建时间")
        @ColumnWidth(20)
        private String createTime;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTaskName() {
            return taskName;
        }

        public void setTaskName(String taskName) {
            this.taskName = taskName;
        }

        public String getTemplateName() {
            return templateName;
        }

        public void setTemplateName(String templateName) {
            this.templateName = templateName;
        }

        public String getRecipientEmail() {
            return recipientEmail;
        }

        public void setRecipientEmail(String recipientEmail) {
            this.recipientEmail = recipientEmail;
        }

        public String getRecipientName() {
            return recipientName;
        }

        public void setRecipientName(String recipientName) {
            this.recipientName = recipientName;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getIsRisk() {
            return isRisk;
        }

        public void setIsRisk(String isRisk) {
            this.isRisk = isRisk;
        }

        public String getRiskReason() {
            return riskReason;
        }

        public void setRiskReason(String riskReason) {
            this.riskReason = riskReason;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getOwner() {
            return owner;
        }

        public void setOwner(String owner) {
            this.owner = owner;
        }

        public String getLegalOwner() {
            return legalOwner;
        }

        public void setLegalOwner(String legalOwner) {
            this.legalOwner = legalOwner;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public String getCreateBy() {
            return createBy;
        }

        public void setCreateBy(String createBy) {
            this.createBy = createBy;
        }

        public String getCreateTime() {
            return createTime;
        }

        public void setCreateTime(String createTime) {
            this.createTime = createTime;
        }
    }

    public static class RiskSampleExcelVO {
        @ExcelProperty("ID")
        @ColumnWidth(10)
        private Long id;

        @ExcelProperty("任务名称")
        @ColumnWidth(25)
        private String taskName;

        @ExcelProperty("模板名称")
        @ColumnWidth(25)
        private String templateName;

        @ExcelProperty("邮件主题")
        @ColumnWidth(30)
        private String subject;

        @ExcelProperty("风险类型")
        @ColumnWidth(15)
        private String riskType;

        @ExcelProperty("风险描述")
        @ColumnWidth(30)
        private String riskDescription;

        @ExcelProperty("风险等级")
        @ColumnWidth(10)
        private String riskLevel;

        @ExcelProperty("来源")
        @ColumnWidth(15)
        private String source;

        @ExcelProperty("负责人")
        @ColumnWidth(15)
        private String owner;

        @ExcelProperty("法务负责人")
        @ColumnWidth(15)
        private String legalOwner;

        @ExcelProperty("复核状态")
        @ColumnWidth(12)
        private String reviewStatus;

        @ExcelProperty("复核意见")
        @ColumnWidth(25)
        private String reviewComment;

        @ExcelProperty("复核人")
        @ColumnWidth(15)
        private String reviewBy;

        @ExcelProperty("复核时间")
        @ColumnWidth(20)
        private String reviewTime;

        @ExcelProperty("创建人")
        @ColumnWidth(15)
        private String createBy;

        @ExcelProperty("创建时间")
        @ColumnWidth(20)
        private String createTime;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTaskName() {
            return taskName;
        }

        public void setTaskName(String taskName) {
            this.taskName = taskName;
        }

        public String getTemplateName() {
            return templateName;
        }

        public void setTemplateName(String templateName) {
            this.templateName = templateName;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getRiskType() {
            return riskType;
        }

        public void setRiskType(String riskType) {
            this.riskType = riskType;
        }

        public String getRiskDescription() {
            return riskDescription;
        }

        public void setRiskDescription(String riskDescription) {
            this.riskDescription = riskDescription;
        }

        public String getRiskLevel() {
            return riskLevel;
        }

        public void setRiskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getOwner() {
            return owner;
        }

        public void setOwner(String owner) {
            this.owner = owner;
        }

        public String getLegalOwner() {
            return legalOwner;
        }

        public void setLegalOwner(String legalOwner) {
            this.legalOwner = legalOwner;
        }

        public String getReviewStatus() {
            return reviewStatus;
        }

        public void setReviewStatus(String reviewStatus) {
            this.reviewStatus = reviewStatus;
        }

        public String getReviewComment() {
            return reviewComment;
        }

        public void setReviewComment(String reviewComment) {
            this.reviewComment = reviewComment;
        }

        public String getReviewBy() {
            return reviewBy;
        }

        public void setReviewBy(String reviewBy) {
            this.reviewBy = reviewBy;
        }

        public String getReviewTime() {
            return reviewTime;
        }

        public void setReviewTime(String reviewTime) {
            this.reviewTime = reviewTime;
        }

        public String getCreateBy() {
            return createBy;
        }

        public void setCreateBy(String createBy) {
            this.createBy = createBy;
        }

        public String getCreateTime() {
            return createTime;
        }

        public void setCreateTime(String createTime) {
            this.createTime = createTime;
        }
    }
}
