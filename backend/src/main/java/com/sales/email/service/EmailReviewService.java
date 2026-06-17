package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.email.common.BusinessException;
import com.sales.email.common.PageResult;
import com.sales.email.dto.EmailReviewDTO;
import com.sales.email.entity.*;
import com.sales.email.mapper.EmailDraftMapper;
import com.sales.email.mapper.EmailReviewMapper;
import com.sales.email.mapper.ForbiddenWordHitMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailReviewService {

    private final EmailReviewMapper reviewMapper;
    private final EmailDraftMapper draftMapper;
    private final ForbiddenWordService forbiddenWordService;
    private final ForbiddenWordHitMapper forbiddenWordHitMapper;
    private final AdoptionStatisticService adoptionStatisticService;
    private final OperationLogService operationLogService;
    private final ObjectMapper objectMapper;

    @Transactional
    public EmailReview aiReview(Long draftId, Integer version) {
        EmailDraft draft = draftMapper.selectById(draftId);
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }

        List<ForbiddenWord> hitWords = forbiddenWordService.checkContent(draft.getContent());
        List<String> hitWordList = new ArrayList<>();
        BigDecimal riskScore = BigDecimal.ZERO;
        String riskLevel = "LOW";

        if (!hitWords.isEmpty()) {
            for (ForbiddenWord word : hitWords) {
                hitWordList.add(word.getWord());
                if ("HIGH".equals(word.getRiskLevel())) {
                    riskScore = riskScore.add(new BigDecimal("30"));
                } else if ("MEDIUM".equals(word.getRiskLevel())) {
                    riskScore = riskScore.add(new BigDecimal("15"));
                } else {
                    riskScore = riskScore.add(new BigDecimal("5"));
                }

                ForbiddenWordHit hit = new ForbiddenWordHit();
                hit.setDraftId(draftId);
                hit.setDraftNo(draft.getDraftNo());
                hit.setVersion(version);
                hit.setWordId(word.getId());
                hit.setWord(word.getWord());
                hit.setSourceOrderNo(draft.getSourceOrderNo());
                hit.setHitCount(1);
                hit.setOperatorRemark("AI审核自动检测命中");
                forbiddenWordHitMapper.insert(hit);
            }

            if (riskScore.compareTo(new BigDecimal("40")) >= 0) {
                riskLevel = "HIGH";
            } else if (riskScore.compareTo(new BigDecimal("20")) >= 0) {
                riskLevel = "MEDIUM";
            }
        }

        EmailReview review = new EmailReview();
        review.setDraftId(draftId);
        review.setDraftNo(draft.getDraftNo());
        review.setVersion(version);
        review.setReviewerId(0L);
        review.setReviewerName("AI系统");
        review.setReviewType("AI");
        review.setReviewResult(hitWords.isEmpty() ? "PASS" : "MODIFY");
        review.setAiRiskScore(riskScore.min(new BigDecimal("100")));
        review.setSourceOrderNo(draft.getSourceOrderNo());

        try {
            review.setForbiddenWordsHit(objectMapper.writeValueAsString(hitWordList));
        } catch (JsonProcessingException e) {
            log.error("序列化禁用词失败", e);
        }

        if (hitWords.isEmpty()) {
            review.setReviewComment("AI审核通过，未检测到风险内容");
        } else {
            review.setReviewComment("AI检测到禁用词：" + String.join("、", hitWordList) + "，请修改后重试");
        }
        review.setOperatorRemark("提交审核时自动触发AI审核");
        review.setReminderSent(hitWords.isEmpty() ? 0 : 1);
        reviewMapper.insert(review);

        draft.setStatus(hitWords.isEmpty() ? "REVIEWED" : "PENDING_REVIEW");
        draft.setRiskLevel(riskLevel);
        try {
            draft.setRiskHitReasons(objectMapper.writeValueAsString(hitWordList));
        } catch (JsonProcessingException e) {
            log.error("序列化风险原因失败", e);
        }
        draftMapper.updateById(draft);

        adoptionStatisticService.recordAiGenerated(draft);

        operationLogService.log("AI_REVIEW", "EMAIL_REVIEW", review.getId().toString(),
                draft.getSourceOrderNo(), 0L, "AI系统",
                "AI审核完成，结果：" + review.getReviewResult() + "，风险评分：" + review.getAiRiskScore());

        return review;
    }

    @Transactional
    public EmailReview manualReview(EmailReviewDTO dto) {
        EmailDraft draft = draftMapper.selectById(dto.getDraftId());
        if (draft == null) {
            throw BusinessException.retryable("草稿不存在，请刷新后重试");
        }

        EmailReview review = new EmailReview();
        review.setDraftId(dto.getDraftId());
        review.setDraftNo(draft.getDraftNo());
        review.setVersion(dto.getVersion());
        review.setReviewerId(dto.getReviewerId());
        review.setReviewerName(dto.getReviewerName());
        review.setReviewType("MANUAL");
        review.setReviewResult(dto.getReviewResult());
        review.setAiRiskScore(dto.getAiRiskScore());
        review.setReviewComment(dto.getReviewComment());
        review.setSourceOrderNo(dto.getSourceOrderNo() != null ? dto.getSourceOrderNo() : draft.getSourceOrderNo());
        review.setOperatorRemark(dto.getOperatorRemark());
        review.setReminderSent(dto.getSendReminder() != null && dto.getSendReminder() ? 1 : 0);

        if (dto.getForbiddenWordsHit() != null) {
            try {
                review.setForbiddenWordsHit(objectMapper.writeValueAsString(dto.getForbiddenWordsHit()));
            } catch (JsonProcessingException e) {
                log.error("序列化禁用词失败", e);
            }
        }
        reviewMapper.insert(review);

        String newStatus = draft.getStatus();
        if ("PASS".equals(dto.getReviewResult())) {
            newStatus = "APPROVED";
        } else if ("REJECT".equals(dto.getReviewResult())) {
            newStatus = "REJECTED";
        } else if ("MODIFY".equals(dto.getReviewResult())) {
            newStatus = "PENDING_REVIEW";
        }
        draft.setStatus(newStatus);
        draftMapper.updateById(draft);

        adoptionStatisticService.recordAdoption(draft, dto);

        operationLogService.log("MANUAL_REVIEW", "EMAIL_REVIEW", review.getId().toString(),
                review.getSourceOrderNo(), dto.getReviewerId(), dto.getReviewerName(),
                "人工复核完成，结果：" + dto.getReviewResult());

        return review;
    }

    public PageResult<EmailReview> queryReviews(Long pageNum, Long pageSize, Long draftId,
                                                String reviewType, String reviewResult,
                                                Long reviewerId, String sourceOrderNo,
                                                String startDate, String endDate) {
        Page<EmailReview> page = new Page<>(pageNum != null ? pageNum : 1, pageSize != null ? pageSize : 10);
        LambdaQueryWrapper<EmailReview> wrapper = new LambdaQueryWrapper<>();

        if (draftId != null) {
            wrapper.eq(EmailReview::getDraftId, draftId);
        }
        if (reviewType != null) {
            wrapper.eq(EmailReview::getReviewType, reviewType);
        }
        if (reviewResult != null) {
            wrapper.eq(EmailReview::getReviewResult, reviewResult);
        }
        if (reviewerId != null) {
            wrapper.eq(EmailReview::getReviewerId, reviewerId);
        }
        if (sourceOrderNo != null && !sourceOrderNo.isEmpty()) {
            wrapper.like(EmailReview::getSourceOrderNo, sourceOrderNo);
        }
        if (startDate != null) {
            wrapper.ge(EmailReview::getCreatedAt, startDate + " 00:00:00");
        }
        if (endDate != null) {
            wrapper.le(EmailReview::getCreatedAt, endDate + " 23:59:59");
        }
        wrapper.orderByDesc(EmailReview::getCreatedAt);

        Page<EmailReview> result = reviewMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), pageNum, pageSize);
    }

    public List<EmailReview> getPendingReviews(Long supervisorId) {
        LambdaQueryWrapper<EmailReview> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EmailReview::getReviewType, "AI");
        wrapper.eq(EmailReview::getReviewResult, "MODIFY");
        wrapper.orderByDesc(EmailReview::getCreatedAt);
        return reviewMapper.selectList(wrapper);
    }

    public long countPendingManualReviews(Long supervisorId) {
        LambdaQueryWrapper<EmailDraft> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EmailDraft::getStatus, "PENDING_REVIEW");
        if (supervisorId != null) {
            wrapper.eq(EmailDraft::getSupervisorId, supervisorId);
        }
        return draftMapper.selectCount(wrapper);
    }
}
