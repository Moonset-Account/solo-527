package com.carcore.admin.repository;

import com.carcore.admin.entity.RepairStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairStatusHistoryRepository extends JpaRepository<RepairStatusHistory, Long> {

    List<RepairStatusHistory> findByRepairOrderIdOrderByOperateTimeAsc(Long repairOrderId);
}
