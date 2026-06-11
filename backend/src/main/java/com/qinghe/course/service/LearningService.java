package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.LearningProgress;
import com.qinghe.course.repository.LearningProgressRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearningService {

    private final LearningProgressRepository learningProgressRepository;
    private final OperationPanelService operationPanelService;

    public PageResult<LearningProgress> search(QueryParams params, Long userId) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<LearningProgress> page = learningProgressRepository.search(
                userId,
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public List<LearningProgress> getMyProgress() {
        return learningProgressRepository.findByUserId(SecurityUtils.getCurrentUserId());
    }

    public LearningProgress getProgress(Long userId, Long courseId, Long classId) {
        return learningProgressRepository.findByUserIdAndCourseIdAndClassId(userId, courseId, classId)
                .orElseThrow(() -> new RuntimeException("学习记录不存在"));
    }

    @Transactional
    public LearningProgress updateProgress(Long progressId, BigDecimal hours, Integer completedLessons) {
        LearningProgress progress = learningProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("学习记录不存在"));

        BigDecimal oldConsumed = progress.getConsumedHours();

        if (hours != null) {
            progress.setConsumedHours(progress.getConsumedHours().add(hours));
        }
        if (completedLessons != null) {
            progress.setCompletedLessons(completedLessons);
        }
        progress.setLastStudyAt(LocalDateTime.now());

        if (progress.getTotalHours() > 0) {
            BigDecimal rate = progress.getConsumedHours()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(progress.getTotalHours()), 2, RoundingMode.HALF_UP);
            progress.setCompletionRate(rate);

            if (rate.compareTo(BigDecimal.valueOf(100)) >= 0) {
                String oldStatus = progress.getStatus();
                progress.setStatus("COMPLETED");
                operationPanelService.logStatusFlow("PROGRESS", progressId, oldStatus, "COMPLETED", "课程学习完成");
            }
        }

        operationPanelService.logChange("PROGRESS", progressId, "consumedHours",
                oldConsumed.toPlainString(), progress.getConsumedHours().toPlainString(), "课时更新");

        return learningProgressRepository.save(progress);
    }

    @Transactional
    public void writeBackHours(Long progressId, BigDecimal hoursToReturn) {
        LearningProgress progress = learningProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("学习记录不存在"));

        BigDecimal oldConsumed = progress.getConsumedHours();
        BigDecimal newConsumed = oldConsumed.subtract(hoursToReturn).max(BigDecimal.ZERO);
        progress.setConsumedHours(newConsumed);

        if (progress.getTotalHours() > 0) {
            BigDecimal rate = newConsumed
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(progress.getTotalHours()), 2, RoundingMode.HALF_UP);
            progress.setCompletionRate(rate);
        }

        operationPanelService.logChange("PROGRESS", progressId, "consumedHours",
                oldConsumed.toPlainString(), newConsumed.toPlainString(), "退款回写课时");

        learningProgressRepository.save(progress);
    }

    public List<LearningProgress> getClassProgress(Long classId) {
        return learningProgressRepository.findByClassId(classId);
    }
}
