package com.finance.approval.service;

import com.finance.approval.entity.ChangeLog;
import com.finance.approval.entity.SysUser;
import com.finance.approval.repository.ChangeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChangeLogService {

    private final ChangeLogRepository changeLogRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<ChangeLog> getChangeLogList(String changeType, Pageable pageable) {
        if (changeType != null && !changeType.isEmpty()) {
            return changeLogRepository.findByChangeType(changeType, pageable);
        }
        return changeLogRepository.findAll(pageable);
    }

    @Transactional
    public ChangeLog createChangeLog(String changeType, String oldValue, String newValue, String description) {
        SysUser currentUser = userService.getCurrentUser();

        ChangeLog changeLog = ChangeLog.builder()
                .changeType(changeType)
                .oldValue(oldValue)
                .newValue(newValue)
                .description(description)
                .changedBy(currentUser.getId())
                .build();

        return changeLogRepository.save(changeLog);
    }
}
