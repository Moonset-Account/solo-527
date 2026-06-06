package com.gym.validation;

import com.gym.common.BusinessException;
import com.gym.entity.Coach;
import com.gym.entity.User;
import com.gym.enums.UserRole;
import com.gym.repository.CoachRepository;
import com.gym.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CoachPermissionValidator {

    private final UserRepository userRepository;
    private final CoachRepository coachRepository;

    public CoachPermissionValidator(UserRepository userRepository, CoachRepository coachRepository) {
        this.userRepository = userRepository;
        this.coachRepository = coachRepository;
    }

    public void validateViewCoachRevenue(Long targetCoachId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new BusinessException("用户未登录");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.RECEPTIONIST) {
            return;
        }

        if (user.getRole() == UserRole.COACH) {
            Coach currentCoach = coachRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new BusinessException("教练信息不存在"));

            if (!currentCoach.getId().equals(targetCoachId)) {
                throw new BusinessException("教练只能查看自己的业绩数据，无权查看其他教练的收入信息");
            }
        }
    }

    public Long getCurrentCoachId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || user.getRole() != UserRole.COACH) {
            return null;
        }

        Coach coach = coachRepository.findByUserId(user.getId()).orElse(null);
        return coach != null ? coach.getId() : null;
    }

    public boolean isCoachRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        return user != null && user.getRole() == UserRole.COACH;
    }

    public boolean isAdminOrReceptionist() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        return user != null && (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.RECEPTIONIST);
    }
}
