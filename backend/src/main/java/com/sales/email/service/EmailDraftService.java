package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sales.email.common.BusinessException;
import com.sales.email.common.PageResult;
import com.sales.email.dto.EmailDraftDTO;
import com.sales.email.dto.EmailDraftQueryDTO;
import com.sales.email.entity.EmailDraft;
import com.sales.email.entity.EmailVersion;
import com.sales.email.mapper.EmailDraftMapper;
import com.sales.email.mapper.EmailVersionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import cn.hutool.core.util.StrUtil;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailDraftService {

    private final EmailDraftMapper draftMapper;
    private final EmailVersionMapper versionMapper;
    private final OperationLogService operationLogService;

    private static final DateTimeFormatter DRAFT_NO_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Transactional
    public EmailDraft createDraft(EmailDraftDTO dto) {
        EmailDraft draft = new EmailDraft();
        BeanUtils.copyProperties(dto, draft);
        draft.setDraftNo(generateDraftNo());
        draft.setCurrentVersion(1);
        draft.setStatus("DRAFT");
        if (draft.getRiskLevel() == null) {
            draft.setRiskLevel("LOW");
        }
        draftMapper.insert(draft);

        EmailVersion version = new EmailVersion();
        version.setDraftId(draft.getId());
        version.setDraftNo(draft.getDraftNo());
        version.setVersion(1);
        version.setSubject(draft.getSubject());
        version.setRecipient(draft.getRecipient());
        version.setCc(draft.getCc());
        version.setBcc(draft.getBcc());
        version.setContent(draft.getContent());
        version.setContentSource("MANUAL");
        version.setPromptVersionId(draft.getPromptVersionId());
        version.setOperatorId(dto.getAgentId());
        version.setOperatorName(dto.getAgentName());
        version.setChangeSummary(dto.getChangeSummary() != null ? dto.getChangeSummary() : "创建草稿");
        versionMapper.insert(version);

        operationLogService.log("CREATE_DRAFT", "EMAIL_DRAFT", draft.getId().toString(),
                draft.getSourceOrderNo(), dto.getAgentId(), dto.getAgentName(), "创建邮件草稿");

        return draft;
    }

    @Transactional
    public EmailDraft saveDraft(Long id, EmailDraftDTO dto) {
        EmailDraft draft = draftMapper.selectById(id);
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }

        int newVersion = draft.getCurrentVersion() + 1;

        EmailVersion version = new EmailVersion();
        version.setDraftId(draft.getId());
        version.setDraftNo(draft.getDraftNo());
        version.setVersion(newVersion);
        version.setSubject(draft.getSubject());
        version.setRecipient(draft.getRecipient());
        version.setCc(draft.getCc());
        version.setBcc(draft.getBcc());
        version.setContent(draft.getContent());
        version.setContentSource("MANUAL");
        version.setPromptVersionId(draft.getPromptVersionId());
        version.setOperatorId(dto.getAgentId());
        version.setOperatorName(dto.getAgentName());
        version.setChangeSummary(dto.getChangeSummary() != null ? dto.getChangeSummary() : "编辑保存版本");
        versionMapper.insert(version);

        if (dto.getSubject() != null) draft.setSubject(dto.getSubject());
        if (dto.getRecipient() != null) draft.setRecipient(dto.getRecipient());
        if (dto.getCc() != null) draft.setCc(dto.getCc());
        if (dto.getBcc() != null) draft.setBcc(dto.getBcc());
        if (dto.getContent() != null) draft.setContent(dto.getContent());
        if (dto.getPromptVersionId() != null) draft.setPromptVersionId(dto.getPromptVersionId());
        if (dto.getRemark() != null) draft.setRemark(dto.getRemark());
        draft.setCurrentVersion(newVersion);
        draftMapper.updateById(draft);

        operationLogService.log("SAVE_VERSION", "EMAIL_DRAFT", draft.getId().toString(),
                draft.getSourceOrderNo(), dto.getAgentId(), dto.getAgentName(),
                "保存草稿版本 v" + newVersion);

        return draft;
    }

    @Transactional
    public EmailDraft generateByAI(Long id, EmailDraftDTO dto) {
        EmailDraft draft = draftMapper.selectById(id);
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }

        int newVersion = draft.getCurrentVersion() + 1;

        String aiContent = simulateAIGeneration(draft, dto);
        String aiSubject = draft.getSubject() != null ? draft.getSubject() : "关于您的咨询回复";

        EmailVersion version = new EmailVersion();
        version.setDraftId(draft.getId());
        version.setDraftNo(draft.getDraftNo());
        version.setVersion(newVersion);
        version.setSubject(aiSubject);
        version.setRecipient(draft.getRecipient());
        version.setCc(draft.getCc());
        version.setBcc(draft.getBcc());
        version.setContent(aiContent);
        version.setContentSource("AI_GENERATED");
        version.setPromptVersionId(dto.getPromptVersionId());
        version.setOperatorId(dto.getAgentId());
        version.setOperatorName(dto.getAgentName());
        version.setChangeSummary("AI生成内容");
        versionMapper.insert(version);

        draft.setSubject(aiSubject);
        draft.setContent(aiContent);
        draft.setCurrentVersion(newVersion);
        draft.setStatus("AI_GENERATED");
        draft.setPromptVersionId(dto.getPromptVersionId());
        draftMapper.updateById(draft);

        operationLogService.log("AI_GENERATE", "EMAIL_DRAFT", draft.getId().toString(),
                draft.getSourceOrderNo(), dto.getAgentId(), dto.getAgentName(),
                "AI生成邮件内容 v" + newVersion);

        return draft;
    }

    public PageResult<EmailDraft> queryDrafts(EmailDraftQueryDTO query) {
        Page<EmailDraft> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<EmailDraft> wrapper = new LambdaQueryWrapper<>();

        if (StrUtil.isNotBlank(query.getDraftNo())) {
            wrapper.like(EmailDraft::getDraftNo, query.getDraftNo());
        }
        if (StrUtil.isNotBlank(query.getSubject())) {
            wrapper.like(EmailDraft::getSubject, query.getSubject());
        }
        if (StrUtil.isNotBlank(query.getSourceOrderNo())) {
            wrapper.like(EmailDraft::getSourceOrderNo, query.getSourceOrderNo());
        }
        if (StrUtil.isNotBlank(query.getSourceType())) {
            wrapper.eq(EmailDraft::getSourceType, query.getSourceType());
        }
        if (query.getAgentId() != null) {
            wrapper.eq(EmailDraft::getAgentId, query.getAgentId());
        }
        if (query.getSupervisorId() != null) {
            wrapper.eq(EmailDraft::getSupervisorId, query.getSupervisorId());
        }
        if (StrUtil.isNotBlank(query.getStatus())) {
            wrapper.eq(EmailDraft::getStatus, query.getStatus());
        }
        if (StrUtil.isNotBlank(query.getRiskLevel())) {
            wrapper.eq(EmailDraft::getRiskLevel, query.getRiskLevel());
        }
        if (StrUtil.isNotBlank(query.getStartDate())) {
            wrapper.ge(EmailDraft::getCreatedAt, query.getStartDate() + " 00:00:00");
        }
        if (StrUtil.isNotBlank(query.getEndDate())) {
            wrapper.le(EmailDraft::getCreatedAt, query.getEndDate() + " 23:59:59");
        }
        wrapper.orderByDesc(EmailDraft::getCreatedAt);

        Page<EmailDraft> result = draftMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), query.getPageNum(), query.getPageSize());
    }

    public EmailDraft getDraftById(Long id) {
        EmailDraft draft = draftMapper.selectById(id);
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }
        return draft;
    }

    public List<EmailVersion> getDraftVersions(Long draftId) {
        LambdaQueryWrapper<EmailVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EmailVersion::getDraftId, draftId);
        wrapper.orderByDesc(EmailVersion::getVersion);
        return versionMapper.selectList(wrapper);
    }

    public EmailVersion getDraftVersion(Long draftId, Integer version) {
        LambdaQueryWrapper<EmailVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EmailVersion::getDraftId, draftId);
        wrapper.eq(EmailVersion::getVersion, version);
        return versionMapper.selectOne(wrapper);
    }

    @Transactional
    public EmailDraft revertToVersion(Long draftId, Integer version, Long operatorId, String operatorName) {
        EmailDraft draft = draftMapper.selectById(draftId);
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }
        EmailVersion targetVersion = getDraftVersion(draftId, version);
        if (targetVersion == null) {
            throw BusinessException.retryable("目标版本不存在");
        }

        int newVersion = draft.getCurrentVersion() + 1;
        EmailVersion newVersionRecord = new EmailVersion();
        newVersionRecord.setDraftId(draft.getId());
        newVersionRecord.setDraftNo(draft.getDraftNo());
        newVersionRecord.setVersion(newVersion);
        newVersionRecord.setSubject(targetVersion.getSubject());
        newVersionRecord.setRecipient(targetVersion.getRecipient());
        newVersionRecord.setCc(targetVersion.getCc());
        newVersionRecord.setBcc(targetVersion.getBcc());
        newVersionRecord.setContent(targetVersion.getContent());
        newVersionRecord.setContentSource("MANUAL");
        newVersionRecord.setPromptVersionId(targetVersion.getPromptVersionId());
        newVersionRecord.setOperatorId(operatorId);
        newVersionRecord.setOperatorName(operatorName);
        newVersionRecord.setChangeSummary("回滚至版本 v" + version);
        versionMapper.insert(newVersionRecord);

        draft.setSubject(targetVersion.getSubject());
        draft.setRecipient(targetVersion.getRecipient());
        draft.setCc(targetVersion.getCc());
        draft.setBcc(targetVersion.getBcc());
        draft.setContent(targetVersion.getContent());
        draft.setCurrentVersion(newVersion);
        draftMapper.updateById(draft);

        operationLogService.log("REVERT_VERSION", "EMAIL_DRAFT", draft.getId().toString(),
                draft.getSourceOrderNo(), operatorId, operatorName,
                "回滚至版本 v" + version + "，新版本 v" + newVersion);

        return draft;
    }

    @Transactional
    public void updateStatus(Long draftId, String status, String remark) {
        EmailDraft draft = draftMapper.selectById(draftId);
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }
        draft.setStatus(status);
        if (remark != null) {
            draft.setRemark(remark);
        }
        draftMapper.updateById(draft);
    }

    private String generateDraftNo() {
        String timestamp = LocalDateTime.now().format(DRAFT_NO_FORMATTER);
        String random = String.format("%04d", new Random().nextInt(10000));
        return "DR" + timestamp + random;
    }

    private String simulateAIGeneration(EmailDraft draft, EmailDraftDTO dto) {
        StringBuilder sb = new StringBuilder();
        sb.append("尊敬的客户：\n\n");
        sb.append("感谢您的来信。针对您反馈的问题，我们非常重视。\n\n");

        if ("CUSTOMER_COMPLAINT".equals(draft.getSourceType())) {
            sb.append("首先，对于给您带来的不便，我们深表歉意。我们已经安排专人跟进您的问题，\n");
            sb.append("预计将在24小时内给出详细的解决方案和处理进展。\n\n");
            sb.append("我们会确保此类问题不再发生，并持续改进我们的服务质量。\n");
        } else if ("ORDER_FOLLOWUP".equals(draft.getSourceType())) {
            sb.append("关于您的订单，目前正在正常处理中。我们会加快进度，\n");
            sb.append("预计在1-2个工作日内完成发货。如有特殊需求，请随时与我们联系。\n\n");
            sb.append("订单如有任何更新，我们将第一时间通知您。\n");
        } else {
            sb.append("我们很高兴为您介绍此次的优惠活动。本次活动提供了多款优质产品，\n");
            sb.append("价格优惠力度大，活动期间下单还有额外赠品。\n\n");
            sb.append("如您对任何产品有兴趣，欢迎随时回复邮件或致电咨询。\n");
        }

        sb.append("\n如有任何疑问，请随时联系我们。\n\n");
        sb.append("此致\n");
        sb.append(draft.getAgentName() != null ? draft.getAgentName() : "客户服务团队");
        sb.append("\n").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy年MM月dd日")));

        return sb.toString();
    }
}
