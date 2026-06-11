package com.qinghe.course.repository;

import com.qinghe.course.entity.StatusFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusFlowRepository extends JpaRepository<StatusFlow, Long> {

    List<StatusFlow> findByBizTypeAndBizIdOrderByCreatedAtDesc(String bizType, Long bizId);
}
