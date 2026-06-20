package com.carcore.admin.repository;

import com.carcore.admin.entity.DetectionRecordItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetectionRecordItemRepository extends JpaRepository<DetectionRecordItem, Long> {

    List<DetectionRecordItem> findByRecordId(Long recordId);

    void deleteByRecordId(Long recordId);
}
