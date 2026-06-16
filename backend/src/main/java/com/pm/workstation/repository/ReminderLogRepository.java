package com.pm.workstation.repository;

import com.pm.workstation.entity.ReminderLog;
import com.pm.workstation.enums.ReminderLogStatus;
import com.pm.workstation.enums.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderLogRepository extends JpaRepository<ReminderLog, Long> {

    List<ReminderLog> findByRuleId(Long ruleId);

    List<ReminderLog> findByTargetTypeAndTargetId(TargetType targetType, Long targetId);

    List<ReminderLog> findByReceiverId(Long receiverId);

    List<ReminderLog> findByStatus(ReminderLogStatus status);
}
