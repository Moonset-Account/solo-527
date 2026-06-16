package com.pm.workstation.repository;

import com.pm.workstation.entity.MeetingMinutes;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface MeetingMinutesRepository extends JpaRepository<MeetingMinutes, Long> {

    List<MeetingMinutes> findByRequirementIdOrderByMeetingDateDesc(Long requirementId);

    List<MeetingMinutes> findByRecorderId(Long recorderId);

    List<MeetingMinutes> findByMeetingDateBetween(LocalDate start, LocalDate end);
}
