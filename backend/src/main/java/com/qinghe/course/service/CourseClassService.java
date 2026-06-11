package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.CourseClass;
import com.qinghe.course.repository.CourseClassRepository;
import com.qinghe.course.repository.LearningProgressRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CourseClassService {

    private final CourseClassRepository courseClassRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final OperationPanelService operationPanelService;

    public PageResult<CourseClass> search(QueryParams params) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<CourseClass> page = courseClassRepository.search(
                params.getKeyword(),
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public CourseClass getById(Long id) {
        return courseClassRepository.findById(id).orElseThrow(() -> new RuntimeException("班级不存在"));
    }

    @Transactional
    public CourseClass create(CourseClass courseClass) {
        courseClass.setCreatedBy(SecurityUtils.getCurrentUserId());
        courseClass.setStatus(courseClass.getStatus() != null ? courseClass.getStatus() : "PENDING");
        return courseClassRepository.save(courseClass);
    }

    @Transactional
    public CourseClass update(Long id, CourseClass courseClass) {
        CourseClass existing = getById(id);
        String oldStatus = existing.getStatus();

        if (courseClass.getClassName() != null) existing.setClassName(courseClass.getClassName());
        if (courseClass.getStartDate() != null) existing.setStartDate(courseClass.getStartDate());
        if (courseClass.getEndDate() != null) existing.setEndDate(courseClass.getEndDate());
        if (courseClass.getCapacity() != null) existing.setCapacity(courseClass.getCapacity());
        if (courseClass.getTeacherName() != null) existing.setTeacherName(courseClass.getTeacherName());
        if (courseClass.getAssistantName() != null) existing.setAssistantName(courseClass.getAssistantName());

        if (courseClass.getStatus() != null && !courseClass.getStatus().equals(oldStatus)) {
            existing.setStatus(courseClass.getStatus());
            operationPanelService.logStatusFlow("CLASS", id, oldStatus, courseClass.getStatus(), "班级状态变更");
        }

        return courseClassRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        courseClassRepository.deleteById(id);
    }

    public BigDecimal getCompletionRate(Long classId) {
        BigDecimal rate = learningProgressRepository.calculateAverageCompletionRateByClassId(classId);
        return rate != null ? rate : BigDecimal.ZERO;
    }
}
