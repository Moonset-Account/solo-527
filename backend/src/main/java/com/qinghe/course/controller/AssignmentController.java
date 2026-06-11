package com.qinghe.course.controller;

import com.qinghe.course.common.Result;
import com.qinghe.course.entity.AssignmentSubmission;
import com.qinghe.course.service.AssignmentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping("/class/{classId}")
    public Result<List<com.qinghe.course.entity.Assignment>> getClassAssignments(@PathVariable Long classId) {
        return Result.success(assignmentService.getClassAssignments(classId));
    }

    @GetMapping("/{assignmentId}/submissions")
    public Result<List<AssignmentSubmission>> getSubmissions(@PathVariable Long assignmentId) {
        return Result.success(assignmentService.getSubmissionsByAssignment(assignmentId));
    }

    @PostMapping("/submit")
    public Result<AssignmentSubmission> submit(@RequestBody SubmitRequest request) {
        return Result.success(assignmentService.submitAssignment(
                request.getAssignmentId(),
                request.getContent(),
                request.getAttachmentUrl()
        ));
    }

    @PostMapping("/submissions/{id}/review")
    public Result<AssignmentSubmission> review(@PathVariable Long id, @RequestBody ReviewRequest request) {
        return Result.success(assignmentService.reviewSubmission(id, request.getScore(), request.getComment()));
    }

    @Data
    public static class SubmitRequest {
        private Long assignmentId;
        private String content;
        private String attachmentUrl;
    }

    @Data
    public static class ReviewRequest {
        private BigDecimal score;
        private String comment;
    }
}
