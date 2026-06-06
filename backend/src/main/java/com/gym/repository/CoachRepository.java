package com.gym.repository;

import com.gym.entity.Coach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoachRepository extends JpaRepository<Coach, Long> {
    Optional<Coach> findByCoachNo(String coachNo);
    Optional<Coach> findByUserId(Long userId);
    List<Coach> findBySpecialtyContaining(String specialty);
}
