package com.gym.repository;

import com.gym.entity.MemberFreeze;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MemberFreezeRepository extends JpaRepository<MemberFreeze, Long> {

    List<MemberFreeze> findByMemberIdOrderByStartDateDesc(Long memberId);

    @Query("SELECT mf FROM MemberFreeze mf WHERE mf.member.id = :memberId AND mf.active = true " +
           "AND mf.startDate <= :date AND mf.endDate >= :date")
    List<MemberFreeze> findActiveFreezesForMemberAndDate(@Param("memberId") Long memberId, @Param("date") LocalDate date);
}
