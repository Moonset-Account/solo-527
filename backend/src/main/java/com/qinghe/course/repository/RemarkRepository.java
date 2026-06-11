package com.qinghe.course.repository;

import com.qinghe.course.entity.Remark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemarkRepository extends JpaRepository<Remark, Long> {

    List<Remark> findByBizTypeAndBizIdOrderByCreatedAtDesc(String bizType, Long bizId);
}
