package com.gym.repository;

import com.gym.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByMemberNo(String memberNo);
    Optional<Member> findByPhone(String phone);
    List<Member> findByStatus(String status);
    List<Member> findByNameContaining(String name);

    @Query("SELECT m FROM Member m WHERE m.createdAt >= :startDate AND m.createdAt < :endDate")
    List<Member> findByCreatedAtBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.status = 'ACTIVE'")
    long countActiveMembers();
}
