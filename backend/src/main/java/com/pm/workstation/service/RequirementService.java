package com.pm.workstation.service;

import com.pm.workstation.dto.ImportResultDTO;
import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.RequirementDTO;
import com.pm.workstation.entity.Requirement;
import com.pm.workstation.enums.RequirementConclusion;
import java.util.List;

public interface RequirementService {

    Requirement submitRequirement(RequirementDTO dto, Long submitterId);

    Requirement updateRequirement(Long id, RequirementDTO dto);

    Requirement getRequirementById(Long id);

    PageResultDTO<Requirement> pageRequirements(int page, int size, String status, String keyword);

    Requirement completeRequirement(Long id, RequirementConclusion conclusion);

    ImportResultDTO batchApprove(List<Long> ids);
}
