package com.carcore.admin.repository;

import com.carcore.admin.entity.Workstation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkstationRepository extends JpaRepository<Workstation, Long> {

    Optional<Workstation> findByStationNo(String stationNo);

    List<Workstation> findByStatus(Integer status);

    List<Workstation> findByStationType(String stationType);

    @Query("SELECT w FROM Workstation w WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "w.stationName LIKE %:keyword% OR w.stationNo LIKE %:keyword%) " +
           "AND (:stationType IS NULL OR :stationType = '' OR w.stationType = :stationType) " +
           "AND (:status IS NULL OR w.status = :status)")
    Page<Workstation> findByConditions(@Param("keyword") String keyword,
                                       @Param("stationType") String stationType,
                                       @Param("status") Integer status,
                                       Pageable pageable);
}
