package com.pm.workstation.dto;

import com.pm.workstation.enums.RequirementPriority;
import com.pm.workstation.enums.RequirementStatus;
import com.pm.workstation.enums.RequirementConclusion;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportQueryDTO {

    private LocalDate startDate;

    private LocalDate endDate;

    private String department;

    private RequirementStatus status;

    private RequirementPriority priority;

    private RequirementConclusion conclusion;

    private Long submitterId;

    private Long assigneeId;

    private Integer page;

    private Integer size;

    public Integer getPage() {
        return page != null && page > 0 ? page : 1;
    }

    public Integer getSize() {
        return size != null && size > 0 ? size : 20;
    }
}
