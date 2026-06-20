package com.carcore.admin.repository;

import com.carcore.admin.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByMemberNo(String memberNo);

    Optional<Member> findByPhone(String phone);

    Optional<Member> findByPlateNumber(String plateNumber);

    @Query("SELECT m FROM Member m WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "m.name LIKE %:keyword% OR m.phone LIKE %:keyword% OR " +
           "m.plateNumber LIKE %:keyword% OR m.memberNo LIKE %:keyword%) " +
           "AND (:status IS NULL OR m.status = :status)")
    Page<Member> findByConditions(@Param("keyword") String keyword,
                                   @Param("status") Integer status,
                                   Pageable pageable);
}
