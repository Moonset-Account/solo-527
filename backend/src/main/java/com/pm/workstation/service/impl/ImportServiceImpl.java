package com.pm.workstation.service.impl;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.pm.workstation.dto.ImportResultDTO;
import com.pm.workstation.dto.RequirementDTO;
import com.pm.workstation.entity.ImportError;
import com.pm.workstation.entity.Requirement;
import com.pm.workstation.entity.SysUser;
import com.pm.workstation.enums.ImportErrorStatus;
import com.pm.workstation.enums.RequirementPriority;
import com.pm.workstation.enums.RequirementStatus;
import com.pm.workstation.repository.ImportErrorRepository;
import com.pm.workstation.repository.RequirementRepository;
import com.pm.workstation.repository.SysUserRepository;
import com.pm.workstation.service.AuditLogService;
import com.pm.workstation.service.ImportService;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImportServiceImpl implements ImportService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private SysUserRepository sysUserRepository;

    @Autowired
    private ImportErrorRepository importErrorRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Override
    @Transactional
    public ImportResultDTO batchImportRequirements(MultipartFile file) {
        String batchNo = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ImportResultDTO result = new ImportResultDTO();
        result.setBatchNo(batchNo);
        List<ImportResultDTO.ImportErrorDTO> errors = new ArrayList<>();
        List<Requirement> successList = new ArrayList<>();

        try {
            EasyExcel.read(file.getInputStream(), ImportRow.class, new ReadListener<ImportRow>() {
                private int rowNumber = 0;

                @Override
                public void invoke(ImportRow data, AnalysisContext context) {
                    rowNumber++;
                    String error = validateRow(data, rowNumber);
                    if (error != null) {
                        result.setErrorCount(result.getErrorCount() + 1);
                        errors.add(new ImportResultDTO.ImportErrorDTO(rowNumber,
                                data.toString(), error));
                        ImportError ie = new ImportError();
                        ie.setBatchNo(batchNo);
                        ie.setRowNumber(rowNumber);
                        ie.setRawData(data.toString());
                        ie.setErrorMessage(error);
                        ie.setStatus(ImportErrorStatus.PENDING);
                        ie.setCreatedAt(LocalDateTime.now());
                        importErrorRepository.save(ie);
                    } else {
                        result.setSuccessCount(result.getSuccessCount() + 1);
                        Requirement req = new Requirement();
                        req.setTitle(data.title);
                        req.setDescription(data.description);
                        req.setPriority(RequirementPriority.valueOf(data.priority));
                        req.setStatus(RequirementStatus.SUBMITTED);
                        req.setSubmitterId(0L);
                        req.setAssigneeId(data.assigneeId);
                        req.setDeadline(data.deadline != null ? LocalDate.parse(data.deadline) : null);
                        LocalDateTime now = LocalDateTime.now();
                        req.setCreatedAt(now);
                        req.setUpdatedAt(now);
                        successList.add(req);
                    }
                }

                @Override
                public void doAfterAllAnalysed(AnalysisContext context) {
                }
            }).sheet().doRead();
        } catch (IOException e) {
            throw new RuntimeException("读取Excel文件失败", e);
        }

        for (Requirement req : successList) {
            requirementRepository.save(req);
        }

        result.setTotalRows(result.getSuccessCount() + result.getErrorCount());
        result.setErrors(errors);
        auditLogService.logAction(0L,
                com.pm.workstation.enums.AuditAction.BATCH_IMPORT,
                "REQUIREMENT", null,
                "批量导入需求，批次号：" + batchNo + "，成功" + result.getSuccessCount() + "条，失败" + result.getErrorCount() + "条");
        return result;
    }

    @Override
    @Transactional
    public void batchApproveWithValidation(List<Long> ids) {
        String batchNo = "BATCH_APPROVE_" + System.currentTimeMillis();
        for (Long id : ids) {
            Requirement req = requirementRepository.findById(id).orElse(null);
            if (req == null || req.getStatus() != RequirementStatus.SUBMITTED) {
                ImportError error = new ImportError();
                error.setBatchNo(batchNo);
                error.setRowNumber(ids.indexOf(id) + 1);
                error.setRawData("{\"requirementId\":" + id + "}");
                error.setErrorMessage("需求" + id + "状态不是SUBMITTED，无法审批");
                error.setStatus(ImportErrorStatus.PENDING);
                error.setCreatedAt(LocalDateTime.now());
                importErrorRepository.save(error);
            } else {
                req.setStatus(RequirementStatus.IN_PROGRESS);
                req.setUpdatedAt(LocalDateTime.now());
                requirementRepository.save(req);
            }
        }
        auditLogService.logAction(0L,
                com.pm.workstation.enums.AuditAction.BATCH_APPROVE,
                "REQUIREMENT", null,
                "批量审批需求，数量：" + ids.size());
    }

    @Override
    public List<ImportError> getImportErrors(String batchNo) {
        return importErrorRepository.findByBatchNo(batchNo);
    }

    @Override
    public byte[] downloadErrorTemplate(String batchNo) {
        List<ImportError> errors = importErrorRepository.findByBatchNo(batchNo);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        EasyExcel.write(outputStream, ImportError.class).sheet("导入错误").doWrite(errors);
        return outputStream.toByteArray();
    }

    private String validateRow(ImportRow data, int rowNumber) {
        if (data.title == null || data.title.trim().isEmpty()) {
            return "第" + rowNumber + "行：标题不能为空";
        }
        if (data.assigneeId != null) {
            boolean exists = sysUserRepository.existsById(data.assigneeId);
            if (!exists) {
                return "第" + rowNumber + "行：负责人不存在";
            }
        }
        if (data.priority != null) {
            try {
                RequirementPriority.valueOf(data.priority);
            } catch (IllegalArgumentException e) {
                return "第" + rowNumber + "行：优先级不合法，可选值：" + Arrays.toString(RequirementPriority.values());
            }
        } else {
            return "第" + rowNumber + "行：优先级不能为空";
        }
        return null;
    }

    public static class ImportRow {
        private String title;
        private String description;
        private String priority;
        private Long assigneeId;
        private String deadline;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public Long getAssigneeId() { return assigneeId; }
        public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
        public String getDeadline() { return deadline; }
        public void setDeadline(String deadline) { this.deadline = deadline; }
    }
}
