package com.pm.workstation.service.impl;

import com.pm.workstation.dto.MeetingMinutesDTO;
import com.pm.workstation.entity.MeetingMinutes;
import com.pm.workstation.repository.MeetingMinutesRepository;
import com.pm.workstation.service.MeetingMinutesService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MeetingMinutesServiceImpl implements MeetingMinutesService {

    @Autowired
    private MeetingMinutesRepository meetingMinutesRepository;

    @Override
    @Transactional
    public MeetingMinutes createMinutes(MeetingMinutesDTO dto, Long recorderId) {
        MeetingMinutes minutes = new MeetingMinutes();
        minutes.setRequirementId(dto.getRequirementId());
        minutes.setTitle(dto.getTitle());
        minutes.setContent(dto.getContent());
        minutes.setMeetingDate(dto.getMeetingDate());
        minutes.setRecorderId(recorderId);
        minutes.setParticipants(dto.getParticipantIds() != null
                ? dto.getParticipantIds().toString() : null);
        minutes.setReminderRuleId(dto.getReminderRuleId());
        LocalDateTime now = LocalDateTime.now();
        minutes.setCreatedAt(now);
        minutes.setUpdatedAt(now);
        return meetingMinutesRepository.save(minutes);
    }

    @Override
    @Transactional
    public MeetingMinutes updateMinutes(Long id, MeetingMinutesDTO dto) {
        MeetingMinutes minutes = meetingMinutesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("会议纪要不存在"));
        minutes.setTitle(dto.getTitle());
        minutes.setContent(dto.getContent());
        minutes.setMeetingDate(dto.getMeetingDate());
        if (dto.getParticipantIds() != null) {
            minutes.setParticipants(dto.getParticipantIds().toString());
        }
        minutes.setReminderRuleId(dto.getReminderRuleId());
        minutes.setUpdatedAt(LocalDateTime.now());
        return meetingMinutesRepository.save(minutes);
    }

    @Override
    public List<MeetingMinutes> getMinutesByRequirementId(Long requirementId) {
        return meetingMinutesRepository.findByRequirementIdOrderByMeetingDateDesc(requirementId);
    }
}
