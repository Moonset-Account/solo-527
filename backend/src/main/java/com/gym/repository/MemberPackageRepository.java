package com.gym.repository;

import com.gym.entity.MemberPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberPackageRepository extends JpaRepository<MemberPackage, Long> {

    List<MemberPackage> findByMemberIdAndActiveTrueOrderByPurchaseDateDesc(Long memberId);

    @Query("SELECT SUM(mp.remainingSessions) FROM MemberPackage mp WHERE mp.member.id = :memberId AND mp.active = true")
    Integer sumRemainingSessionsByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(mp) FROM MemberPackage mp WHERE mp.active = true AND mp.remainingSessions > 0")
    long countActivePackages();
}
