package com.pm.workstation.service;

import com.pm.workstation.dto.MeetingMinutesDTO;
import com.pm.workstation.entity.MeetingMinutes;
import java.util.List;

public interface MeetingMinutesService {

    MeetingMinutes createMinutes(MeetingMinutesDTO dto, Long recorderId);

    MeetingMinutes updateMinutes(Long id, MeetingMinutesDTO dto);

    List<MeetingMinutes> getMinutesByRequirementId(Long requirementId);
}
