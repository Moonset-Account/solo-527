package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.Coach;
import com.gym.repository.CoachRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/coaches")
public class CoachController {

    private final CoachRepository coachRepository;

    public CoachController(CoachRepository coachRepository) {
        this.coachRepository = coachRepository;
    }

    private boolean isAdminOrManager() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ROLE_MANAGER"));
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Coach maskSensitiveData(Coach coach) {
        if (coach == null) return null;
        if (isAdminOrManager()) {
            return coach;
        }
        Coach currentCoach = coachRepository.findByUserId(getCurrentUserId());
        if (currentCoach != null && coach.getId().equals(currentCoach.getId())) {
            return coach;
        }
        Coach masked = new Coach();
        masked.setId(coach.getId());
        masked.setName(coach.getName());
        masked.setPhone(coach.getPhone());
        masked.setGender(coach.getGender());
        masked.setSpecialty(coach.getSpecialty());
        masked.setIntroduction(coach.getIntroduction());
        masked.setLevel(coach.getLevel());
        masked.setActive(coach.getActive());
        masked.setHireDate(coach.getHireDate());
        masked.setAvatar(coach.getAvatar());
        return masked;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<List<Coach>> list() {
        List<Coach> coaches = coachRepository.findAll().stream()
                .map(this::maskSensitiveData)
                .collect(Collectors.toList());
        return Result.success(coaches);
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public Result<List<Coach>> listActive() {
        List<Coach> coaches = coachRepository.findByActiveTrue().stream()
                .map(this::maskSensitiveData)
                .collect(Collectors.toList());
        return Result.success(coaches);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<Coach> getById(@PathVariable Long id) {
        return coachRepository.findById(id)
                .map(this::maskSensitiveData)
                .map(Result::success)
                .orElse(Result.error("教练不存在"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<Coach> create(@RequestBody Coach coach) {
        coach.setId(null);
        return Result.success(coachRepository.save(coach));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<Coach> update(@PathVariable Long id, @RequestBody Coach coach) {
        return coachRepository.findById(id).map(c -> {
            if (coach.getName() != null) c.setName(coach.getName());
            if (coach.getPhone() != null) c.setPhone(coach.getPhone());
            if (coach.getGender() != null) c.setGender(coach.getGender());
            if (coach.getSpecialty() != null) c.setSpecialty(coach.getSpecialty());
            if (coach.getIntroduction() != null) c.setIntroduction(coach.getIntroduction());
            if (coach.getLevel() != null) c.setLevel(coach.getLevel());
            if (coach.getActive() != null) c.setActive(coach.getActive());
            if (coach.getBaseSalary() != null) c.setBaseSalary(coach.getBaseSalary());
            if (coach.getCommissionRate() != null) c.setCommissionRate(coach.getCommissionRate());
            return Result.success(coachRepository.save(c));
        }).orElse(Result.error("教练不存在"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('COACH')")
    public Result<Coach> getMyProfile() {
        Long currentUserId = (Long) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        Coach coach = coachRepository.findByUserId(currentUserId);
        if (coach == null) {
            return Result.error("教练信息不存在");
        }
        return Result.success(coach);
    }
}
