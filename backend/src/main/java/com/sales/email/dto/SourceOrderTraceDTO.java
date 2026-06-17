package com.sales.email.dto;

import com.sales.email.entity.EmailDraft;
import com.sales.email.entity.EmailReview;
import com.sales.email.entity.EmailVersion;
import com.sales.email.entity.ForbiddenWordHit;
import com.sales.email.entity.PromptVersion;
import lombok.Data;

import java.util.List;

@Data
public class SourceOrderTraceDTO {

    private String sourceOrderNo;

    private List<EmailDraft> drafts;

    private List<DraftReviewDetail> draftDetails;

    @Data
    public static class DraftReviewDetail {
        private EmailDraft draft;
        private List<EmailReview> aiReviews;
        private List<EmailReview> manualReviews;
        private List<ForbiddenWordHit> forbiddenHits;
        private List<VersionPromptPair> aiGeneratedVersions;
        private Boolean reminderSent;
    }

    @Data
    public static class VersionPromptPair {
        private EmailVersion emailVersion;
        private PromptVersion promptVersion;
    }
}
