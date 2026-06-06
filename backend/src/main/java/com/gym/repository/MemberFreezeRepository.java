package com.gym.repository;

import com.gym.entity.MemberFreeze;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberFreezeRepository extends JpaRepository<MemberFreeze, Long> {
    List<MemberFreeze> findByMemberId(Long memberId);
    List<MemberFreeze> findByMemberPackageId(Long memberPackageId);
    List<MemberFreeze> findByStatus(String status);

    @Query("SELECT mf FROM MemberFreeze mf WHERE mf.memberId = :memberId AND mf.status = 'ACTIVE'")
    List<MemberFreeze> findActiveFreezesByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT mf FROM MemberFreeze mf WHERE mf.memberId = :memberId AND :date BETWEEN mf.startDate AND mf.endDate AND mf.status = 'ACTIVE'")
    Optional<MemberFreeze> findFreezeOnDate(@Param("memberId") Long memberId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(mf) > 0 FROM MemberFreeze mf WHERE mf.memberId = :memberId AND :date BETWEEN mf.startDate AND mf.endDate AND mf.status = 'ACTIVE'")
    boolean isMemberFrozenOnDate(@Param("memberId") Long memberId, @Param("date") LocalDate date);
}
