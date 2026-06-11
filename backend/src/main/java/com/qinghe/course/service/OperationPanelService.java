package com.qinghe.course.service;

import com.qinghe.course.entity.*;
import com.qinghe.course.repository.*;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OperationPanelService {

    private final AttachmentRepository attachmentRepository;
    private final RemarkRepository remarkRepository;
    private final ChangeHistoryRepository changeHistoryRepository;
    private final StatusFlowRepository statusFlowRepository;
    private final SysUserRepository sysUserRepository;

    public List<Attachment> getAttachments(String bizType, Long bizId) {
        return attachmentRepository.findByBizTypeAndBizIdOrderByCreatedAtDesc(bizType, bizId);
    }

    @Transactional
    public Attachment addAttachment(String bizType, Long bizId, Attachment attachment) {
        attachment.setBizType(bizType);
        attachment.setBizId(bizId);
        attachment.setUploadedBy(SecurityUtils.getCurrentUserId());
        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void deleteAttachment(Long id) {
        attachmentRepository.deleteById(id);
    }

    public List<Remark> getRemarks(String bizType, Long bizId) {
        return remarkRepository.findByBizTypeAndBizIdOrderByCreatedAtDesc(bizType, bizId);
    }

    @Transactional
    public Remark addRemark(String bizType, Long bizId, String content) {
        Remark remark = new Remark();
        remark.setBizType(bizType);
        remark.setBizId(bizId);
        remark.setContent(content);
        remark.setCreatedBy(SecurityUtils.getCurrentUserId());
        return remarkRepository.save(remark);
    }

    public List<ChangeHistory> getChangeHistories(String bizType, Long bizId) {
        return changeHistoryRepository.findByBizTypeAndBizIdOrderByCreatedAtDesc(bizType, bizId);
    }

    @Transactional
    public void logChange(String bizType, Long bizId, String fieldName, String oldValue, String newValue, String remark) {
        ChangeHistory history = new ChangeHistory();
        history.setBizType(bizType);
        history.setBizId(bizId);
        history.setFieldName(fieldName);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        history.setChangedBy(SecurityUtils.getCurrentUserId());
        history.setChangeRemark(remark);
        changeHistoryRepository.save(history);
    }

    public List<StatusFlow> getStatusFlows(String bizType, Long bizId) {
        return statusFlowRepository.findByBizTypeAndBizIdOrderByCreatedAtDesc(bizType, bizId);
    }

    @Transactional
    public void logStatusFlow(String bizType, Long bizId, String oldStatus, String newStatus, String remark) {
        StatusFlow flow = new StatusFlow();
        flow.setBizType(bizType);
        flow.setBizId(bizId);
        flow.setOldStatus(oldStatus);
        flow.setNewStatus(newStatus);
        Long userId = SecurityUtils.getCurrentUserId();
        flow.setOperatorId(userId);
        sysUserRepository.findById(userId).ifPresent(user -> flow.setOperatorName(user.getNickname()));
        flow.setRemark(remark);
        statusFlowRepository.save(flow);
    }
}
