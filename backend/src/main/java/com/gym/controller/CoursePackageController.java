package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.CoursePackage;
import com.gym.repository.CoursePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/course-packages")
@RequiredArgsConstructor
public class CoursePackageController {

    private final CoursePackageRepository coursePackageRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<List<CoursePackage>> list() {
        return Result.success(coursePackageRepository.findAll());
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public Result<List<CoursePackage>> listActive() {
        return Result.success(coursePackageRepository.findByActiveTrue());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<CoursePackage> getById(@PathVariable Long id) {
        return coursePackageRepository.findById(id)
                .map(Result::success)
                .orElse(Result.error("课包不存在"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<CoursePackage> create(@RequestBody CoursePackage coursePackage) {
        coursePackage.setId(null);
        return Result.success(coursePackageRepository.save(coursePackage));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<CoursePackage> update(@PathVariable Long id, @RequestBody CoursePackage coursePackage) {
        return coursePackageRepository.findById(id).map(cp -> {
            if (coursePackage.getName() != null) cp.setName(coursePackage.getName());
            if (coursePackage.getType() != null) cp.setType(coursePackage.getType());
            if (coursePackage.getTotalSessions() != null) cp.setTotalSessions(coursePackage.getTotalSessions());
            if (coursePackage.getPrice() != null) cp.setPrice(coursePackage.getPrice());
            if (coursePackage.getOriginalPrice() != null) cp.setOriginalPrice(coursePackage.getOriginalPrice());
            if (coursePackage.getValidDays() != null) cp.setValidDays(coursePackage.getValidDays());
            if (coursePackage.getDescription() != null) cp.setDescription(coursePackage.getDescription());
            if (coursePackage.getActive() != null) cp.setActive(coursePackage.getActive());
            if (coursePackage.getShowOnApp() != null) cp.setShowOnApp(coursePackage.getShowOnApp());
            return Result.success(coursePackageRepository.save(cp));
        }).orElse(Result.error("课包不存在"));
    }
}
