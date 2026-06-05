package com.gym.repository;

import com.gym.common.enums.MemberStatusEnum;
import com.gym.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByMemberNo(String memberNo);

    Optional<Member> findByPhone(String phone);

    List<Member> findByStatus(MemberStatusEnum status);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.status = 'ACTIVE'")
    long countActiveMembers();

    @Query("SELECT COUNT(m) FROM Member m WHERE m.status = 'FROZEN'")
    long countFrozenMembers();

    @Query("SELECT m FROM Member m WHERE m.totalRemainingSessions <= ?1 AND m.status = 'ACTIVE'")
    List<Member> findMembersLowOnSessions(Integer threshold);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.status = 'EXPIRED'")
    long countExpiredMembers();
}
