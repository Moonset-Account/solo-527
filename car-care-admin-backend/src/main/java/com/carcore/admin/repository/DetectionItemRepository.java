package com.carcore.admin.repository;

import com.carcore.admin.entity.DetectionItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DetectionItemRepository extends JpaRepository<DetectionItem, Long> {

    Optional<DetectionItem> findByItemCode(String itemCode);

    List<DetectionItem> findByItemCategory(String itemCategory);

    List<DetectionItem> findByStatus(Integer status);

    @Query("SELECT d FROM DetectionItem d WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "d.itemName LIKE %:keyword% OR d.itemCode LIKE %:keyword%) " +
           "AND (:category IS NULL OR :category = '' OR d.itemCategory = :category) " +
           "AND (:status IS NULL OR d.status = :status)")
    Page<DetectionItem> findByConditions(@Param("keyword") String keyword,
                                         @Param("category") String category,
                                         @Param("status") Integer status,
                                         Pageable pageable);
}
