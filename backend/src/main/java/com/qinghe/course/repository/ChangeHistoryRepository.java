package com.qinghe.course.repository;

import com.qinghe.course.entity.ChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {

    List<ChangeHistory> findByBizTypeAndBizIdOrderByCreatedAtDesc(String bizType, Long bizId);
}
