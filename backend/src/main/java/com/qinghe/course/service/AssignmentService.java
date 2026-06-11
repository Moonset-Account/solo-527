package com.qinghe.course.service;

import com.qinghe.course.entity.AssignmentSubmission;
import com.qinghe.course.repository.AssignmentSubmissionRepository;
import com.qinghe.course.repository.AssignmentRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final OperationPanelService operationPanelService;

    public List<com.qinghe.course.entity.Assignment> getClassAssignments(Long classId) {
        return assignmentRepository.findByClassIdOrderByCreatedAtDesc(classId);
    }

    public AssignmentSubmission submitAssignment(Long assignmentId, String content, String attachmentUrl) {
        Long userId = SecurityUtils.getCurrentUserId();
        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndUserId(assignmentId, userId)
                .orElse(new AssignmentSubmission());

        submission.setAssignmentId(assignmentId);
        submission.setUserId(userId);
        submission.setContent(content);
        submission.setAttachmentUrl(attachmentUrl);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStatus("SUBMITTED");

        return submissionRepository.save(submission);
    }

    @Transactional
    public AssignmentSubmission reviewSubmission(Long submissionId, BigDecimal score, String comment) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("作业提交不存在"));
        String oldStatus = submission.getStatus();

        submission.setScore(score);
        submission.setComment(comment);
        submission.setReviewedBy(SecurityUtils.getCurrentUserId());
        submission.setReviewedAt(LocalDateTime.now());
        submission.setStatus("REVIEWED");

        operationPanelService.logStatusFlow("ASSIGNMENT", submissionId, oldStatus, "REVIEWED", comment);

        return submissionRepository.save(submission);
    }

    public List<AssignmentSubmission> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }
}
