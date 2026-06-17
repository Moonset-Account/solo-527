package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sales.email.dto.SourceOrderTraceDTO;
import com.sales.email.entity.EmailDraft;
import com.sales.email.entity.EmailReview;
import com.sales.email.entity.ForbiddenWordHit;
import com.sales.email.entity.PromptVersion;
import com.sales.email.mapper.EmailDraftMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TraceService {

    private final EmailDraftMapper draftMapper;
    private final EmailReviewService reviewService;
    private final ForbiddenWordService forbiddenWordService;
    private final PromptTemplateService promptTemplateService;

    public SourceOrderTraceDTO traceBySourceOrderNo(String sourceOrderNo) {
        SourceOrderTraceDTO result = new SourceOrderTraceDTO();
        result.setSourceOrderNo(sourceOrderNo);

        LambdaQueryWrapper<EmailDraft> draftWrapper = new LambdaQueryWrapper<>();
        draftWrapper.eq(EmailDraft::getSourceOrderNo, sourceOrderNo);
        draftWrapper.orderByDesc(EmailDraft::getCreatedAt);
        List<EmailDraft> drafts = draftMapper.selectList(draftWrapper);
        result.setDrafts(drafts);

        List<SourceOrderTraceDTO.DraftReviewDetail> details = new ArrayList<>();
        for (EmailDraft draft : drafts) {
            SourceOrderTraceDTO.DraftReviewDetail detail = new SourceOrderTraceDTO.DraftReviewDetail();
            detail.setDraft(draft);

            List<EmailReview> allReviews = reviewService.getReviewsByDraftId(draft.getId());
            List<EmailReview> aiReviews = new ArrayList<>();
            List<EmailReview> manualReviews = new ArrayList<>();
            Boolean reminderSent = false;
            for (EmailReview r : allReviews) {
                if ("AI".equals(r.getReviewType())) {
                    aiReviews.add(r);
                    if (r.getReminderSent() != null && r.getReminderSent() == 1) {
                        reminderSent = true;
                    }
                } else if ("MANUAL".equals(r.getReviewType())) {
                    manualReviews.add(r);
                }
            }
            detail.setAiReviews(aiReviews);
            detail.setManualReviews(manualReviews);
            detail.setReminderSent(reminderSent);

            List<ForbiddenWordHit> hits = forbiddenWordService.getHitsByDraftId(draft.getId());
            detail.setForbiddenHits(hits);

            if (draft.getPromptVersionId() != null) {
                PromptVersion pv = promptTemplateService.getVersionById(draft.getPromptVersionId());
                detail.setPromptVersion(pv);
            }

            details.add(detail);
        }
        result.setDraftDetails(details);

        return result;
    }
}
