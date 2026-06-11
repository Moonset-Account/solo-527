package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.Course;
import com.qinghe.course.repository.CourseRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final OperationPanelService operationPanelService;

    public PageResult<Course> search(QueryParams params) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<Course> page = courseRepository.search(
                params.getKeyword(),
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public Course getById(Long id) {
        return courseRepository.findById(id).orElseThrow(() -> new RuntimeException("课程不存在"));
    }

    @Transactional
    public Course create(Course course) {
        course.setCreatedBy(SecurityUtils.getCurrentUserId());
        course.setStatus(course.getStatus() != null ? course.getStatus() : "DRAFT");
        return courseRepository.save(course);
    }

    @Transactional
    public Course update(Long id, Course course) {
        Course existing = getById(id);
        String oldStatus = existing.getStatus();

        if (course.getTitle() != null) existing.setTitle(course.getTitle());
        if (course.getSubtitle() != null) existing.setSubtitle(course.getSubtitle());
        if (course.getDescription() != null) existing.setDescription(course.getDescription());
        if (course.getCoverUrl() != null) existing.setCoverUrl(course.getCoverUrl());
        if (course.getPrice() != null) existing.setPrice(course.getPrice());
        if (course.getOriginalPrice() != null) existing.setOriginalPrice(course.getOriginalPrice());
        if (course.getTotalHours() != null) existing.setTotalHours(course.getTotalHours());
        if (course.getTotalLessons() != null) existing.setTotalLessons(course.getTotalLessons());
        if (course.getCategory() != null) existing.setCategory(course.getCategory());
        if (course.getTags() != null) existing.setTags(course.getTags());

        if (course.getStatus() != null && !course.getStatus().equals(oldStatus)) {
            existing.setStatus(course.getStatus());
            operationPanelService.logStatusFlow("COURSE", id, oldStatus, course.getStatus(), "课程状态变更");
        }

        return courseRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        courseRepository.deleteById(id);
    }
}
