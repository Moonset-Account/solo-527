package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sales.email.dto.SourceOrderTraceDTO;
import com.sales.email.entity.EmailDraft;
import com.sales.email.entity.EmailReview;
import com.sales.email.entity.EmailVersion;
import com.sales.email.entity.ForbiddenWordHit;
import com.sales.email.entity.PromptVersion;
import com.sales.email.mapper.EmailDraftMapper;
import com.sales.email.mapper.EmailVersionMapper;
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
    private final EmailVersionMapper versionMapper;
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

            LambdaQueryWrapper<EmailVersion> verWrapper = new LambdaQueryWrapper<>();
            verWrapper.eq(EmailVersion::getDraftId, draft.getId());
            verWrapper.eq(EmailVersion::getContentSource, "AI_GENERATED");
            verWrapper.isNotNull(EmailVersion::getPromptVersionId);
            verWrapper.orderByDesc(EmailVersion::getVersion);
            List<EmailVersion> aiVersions = versionMapper.selectList(verWrapper);

            List<SourceOrderTraceDTO.VersionPromptPair> pairs = new ArrayList<>();
            for (EmailVersion ev : aiVersions) {
                SourceOrderTraceDTO.VersionPromptPair pair = new SourceOrderTraceDTO.VersionPromptPair();
                pair.setEmailVersion(ev);
                if (ev.getPromptVersionId() != null) {
                    PromptVersion pv = promptTemplateService.getVersionById(ev.getPromptVersionId());
                    pair.setPromptVersion(pv);
                }
                pairs.add(pair);
            }
            detail.setAiGeneratedVersions(pairs);

            details.add(detail);
        }
        result.setDraftDetails(details);

        return result;
    }

    public List<SourceOrderTraceDTO.VersionPromptPair> getPromptVersionsBySourceOrderNo(String sourceOrderNo) {
        LambdaQueryWrapper<EmailDraft> draftWrapper = new LambdaQueryWrapper<>();
        draftWrapper.eq(EmailDraft::getSourceOrderNo, sourceOrderNo);
        List<EmailDraft> drafts = draftMapper.selectList(draftWrapper);

        List<SourceOrderTraceDTO.VersionPromptPair> result = new ArrayList<>();
        if (drafts.isEmpty()) return result;

        List<Long> draftIds = new ArrayList<>();
        for (EmailDraft d : drafts) draftIds.add(d.getId());

        LambdaQueryWrapper<EmailVersion> verWrapper = new LambdaQueryWrapper<>();
        verWrapper.in(EmailVersion::getDraftId, draftIds);
        verWrapper.eq(EmailVersion::getContentSource, "AI_GENERATED");
        verWrapper.isNotNull(EmailVersion::getPromptVersionId);
        verWrapper.orderByDesc(EmailVersion::getVersion);
        List<EmailVersion> aiVersions = versionMapper.selectList(verWrapper);

        for (EmailVersion ev : aiVersions) {
            SourceOrderTraceDTO.VersionPromptPair pair = new SourceOrderTraceDTO.VersionPromptPair();
            pair.setEmailVersion(ev);
            if (ev.getPromptVersionId() != null) {
                PromptVersion pv = promptTemplateService.getVersionById(ev.getPromptVersionId());
                pair.setPromptVersion(pv);
            }
            result.add(pair);
        }
        return result;
    }
}
