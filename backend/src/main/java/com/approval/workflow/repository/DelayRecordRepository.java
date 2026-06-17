package com.approval.workflow.repository;

import com.approval.workflow.entity.DelayRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DelayRecordRepository extends JpaRepository<DelayRecord, Long>, JpaSpecificationExecutor<DelayRecord> {

    List<DelayRecord> findByRequirementIdOrderByCreatedAtDesc(Long requirementId);

    Page<DelayRecord> findByDeptId(Long deptId, Pageable pageable);

    Page<DelayRecord> findByResponsibleDeptId(Long responsibleDeptId, Pageable pageable);

    @Query("SELECT d FROM DelayRecord d WHERE d.responsibleDeptId IN :deptIds")
    List<DelayRecord> findByResponsibleDeptIdIn(@Param("deptIds") List<Long> deptIds);

    @Query("SELECT d.responsibleDeptId, COUNT(d), SUM(d.delayDays) FROM DelayRecord d " +
           "WHERE d.responsibleDeptId IN :deptIds GROUP BY d.responsibleDeptId")
    List<Object[]> countByResponsibleDeptIdIn(@Param("deptIds") List<Long> deptIds);
}
