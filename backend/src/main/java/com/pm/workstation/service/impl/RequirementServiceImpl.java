package com.pm.workstation.service.impl;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.RequirementDTO;
import com.pm.workstation.entity.ImportError;
import com.pm.workstation.entity.Requirement;
import com.pm.workstation.enums.ImportErrorStatus;
import com.pm.workstation.enums.RequirementConclusion;
import com.pm.workstation.enums.RequirementStatus;
import com.pm.workstation.repository.ImportErrorRepository;
import com.pm.workstation.repository.RequirementRepository;
import com.pm.workstation.service.RequirementService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequirementServiceImpl implements RequirementService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private ImportErrorRepository importErrorRepository;

    @Override
    @Transactional
    public Requirement submitRequirement(RequirementDTO dto, Long submitterId) {
        Requirement requirement = new Requirement();
        requirement.setTitle(dto.getTitle());
        requirement.setDescription(dto.getDescription());
        requirement.setPriority(dto.getPriority());
        requirement.setStatus(RequirementStatus.SUBMITTED);
        requirement.setSubmitterId(submitterId);
        requirement.setAssigneeId(dto.getAssigneeId());
        requirement.setDepartment(dto.getDepartment());
        requirement.setDeadline(dto.getDeadline());
        LocalDateTime now = LocalDateTime.now();
        requirement.setCreatedAt(now);
        requirement.setUpdatedAt(now);
        return requirementRepository.save(requirement);
    }

    @Override
    @Transactional
    public Requirement updateRequirement(Long id, RequirementDTO dto) {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("需求不存在"));
        requirement.setTitle(dto.getTitle());
        requirement.setDescription(dto.getDescription());
        requirement.setPriority(dto.getPriority());
        requirement.setAssigneeId(dto.getAssigneeId());
        requirement.setDepartment(dto.getDepartment());
        requirement.setDeadline(dto.getDeadline());
        requirement.setUpdatedAt(LocalDateTime.now());
        return requirementRepository.save(requirement);
    }

    @Override
    public Requirement getRequirementById(Long id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("需求不存在"));
    }

    @Override
    public PageResultDTO<Requirement> pageRequirements(int page, int size, String status, String keyword) {
        RequirementStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            statusEnum = RequirementStatus.valueOf(status);
        }
        Page<Requirement> pageResult = requirementRepository.searchRequirements(
                statusEnum, keyword, PageRequest.of(page - 1, size));
        return PageResultDTO.of(pageResult.getContent(), pageResult.getTotalElements(), page, size);
    }

    @Override
    @Transactional
    public Requirement completeRequirement(Long id, RequirementConclusion conclusion) {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("需求不存在"));
        LocalDateTime now = LocalDateTime.now();
        requirement.setCompletedAt(now);
        requirement.setConclusion(conclusion);
        requirement.setStatus(RequirementStatus.COMPLETED);
        if (requirement.getDeadline() != null && now.toLocalDate().isAfter(requirement.getDeadline())) {
            requirement.setDelayDays((int) java.time.temporal.ChronoUnit.DAYS.between(
                    requirement.getDeadline(), now.toLocalDate()));
        } else {
            requirement.setDelayDays(0);
        }
        requirement.setUpdatedAt(now);
        return requirementRepository.save(requirement);
    }

    @Override
    @Transactional
    public void batchApprove(List<Long> ids) {
        String batchNo = "BATCH_APPROVE_" + System.currentTimeMillis();
        for (Long id : ids) {
            Requirement requirement = requirementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("需求不存在: " + id));
            if (requirement.getStatus() != RequirementStatus.SUBMITTED) {
                ImportError error = new ImportError();
                error.setBatchNo(batchNo);
                error.setRowNumber(ids.indexOf(id) + 1);
                error.setRawData("{\"requirementId\":" + id + "}");
                error.setErrorMessage("需求" + id + "状态不是SUBMITTED，无法审批");
                error.setStatus(ImportErrorStatus.PENDING);
                error.setCreatedAt(LocalDateTime.now());
                importErrorRepository.save(error);
            } else {
                requirement.setStatus(RequirementStatus.IN_PROGRESS);
                requirement.setUpdatedAt(LocalDateTime.now());
                requirementRepository.save(requirement);
            }
        }
    }
}
