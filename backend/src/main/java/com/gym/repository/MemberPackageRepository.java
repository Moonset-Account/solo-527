package com.gym.repository;

import com.gym.entity.MemberPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MemberPackageRepository extends JpaRepository<MemberPackage, Long> {
    List<MemberPackage> findByMemberId(Long memberId);
    List<MemberPackage> findByCoachId(Long coachId);
    List<MemberPackage> findByStatus(String status);

    @Query("SELECT mp FROM MemberPackage mp WHERE mp.memberId = :memberId AND mp.status = 'ACTIVE' AND mp.remainingSessions > 0")
    List<MemberPackage> findActivePackagesByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT mp FROM MemberPackage mp WHERE mp.expireDate BETWEEN :start AND :end")
    List<MemberPackage> findExpiringPackages(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT mp FROM MemberPackage mp WHERE mp.coachId = :coachId AND mp.status = 'ACTIVE'")
    List<MemberPackage> findActivePackagesByCoachId(@Param("coachId") Long coachId);
}
