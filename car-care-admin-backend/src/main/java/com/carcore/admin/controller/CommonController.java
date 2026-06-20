package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.Member;
import com.carcore.admin.entity.Technician;
import com.carcore.admin.entity.Workstation;
import com.carcore.admin.repository.MemberRepository;
import com.carcore.admin.repository.TechnicianRepository;
import com.carcore.admin.repository.WorkstationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/common")
public class CommonController {

    private final MemberRepository memberRepository;
    private final TechnicianRepository technicianRepository;
    private final WorkstationRepository workstationRepository;

    public CommonController(MemberRepository memberRepository, TechnicianRepository technicianRepository, WorkstationRepository workstationRepository) {
        this.memberRepository = memberRepository;
        this.technicianRepository = technicianRepository;
        this.workstationRepository = workstationRepository;
    }

    @GetMapping("/members/{id}")
    public Result<Member> getMemberById(@PathVariable Long id) {
        return Result.success(memberRepository.findById(id).orElse(null));
    }

    @GetMapping("/members/page")
    public Result<PageResult<Member>> getMembers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Member> page = memberRepository.findByConditions(keyword, status, pageable);
        return Result.success(PageResult.of(page.getContent(), page.getTotalElements(), pageNum, pageSize));
    }

    @GetMapping("/members/all")
    public Result<List<Member>> getAllMembers() {
        return Result.success(memberRepository.findAll());
    }

    @GetMapping("/technicians/{id}")
    public Result<Technician> getTechnicianById(@PathVariable Long id) {
        return Result.success(technicianRepository.findById(id).orElse(null));
    }

    @GetMapping("/technicians/page")
    public Result<PageResult<Technician>> getTechnicians(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String skillLevel,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Technician> page = technicianRepository.findByConditions(keyword, skillLevel, status, pageable);
        return Result.success(PageResult.of(page.getContent(), page.getTotalElements(), pageNum, pageSize));
    }

    @GetMapping("/technicians/all")
    public Result<List<Technician>> getAllTechnicians() {
        return Result.success(technicianRepository.findAll());
    }

    @GetMapping("/technicians/enabled")
    public Result<List<Technician>> getEnabledTechnicians() {
        return Result.success(technicianRepository.findByStatus(1));
    }

    @GetMapping("/workstations/{id}")
    public Result<Workstation> getWorkstationById(@PathVariable Long id) {
        return Result.success(workstationRepository.findById(id).orElse(null));
    }

    @GetMapping("/workstations/page")
    public Result<PageResult<Workstation>> getWorkstations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String stationType,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Workstation> page = workstationRepository.findByConditions(keyword, stationType, status, pageable);
        return Result.success(PageResult.of(page.getContent(), page.getTotalElements(), pageNum, pageSize));
    }

    @GetMapping("/workstations/all")
    public Result<List<Workstation>> getAllWorkstations() {
        return Result.success(workstationRepository.findAll());
    }

    @GetMapping("/workstations/enabled")
    public Result<List<Workstation>> getEnabledWorkstations() {
        return Result.success(workstationRepository.findByStatus(1));
    }
}
