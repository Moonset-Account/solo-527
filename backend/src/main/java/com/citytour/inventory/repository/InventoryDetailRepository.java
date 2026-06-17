package com.citytour.inventory.repository;

import com.citytour.inventory.entity.InventoryDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryDetailRepository extends JpaRepository<InventoryDetail, Long> {

    List<InventoryDetail> findByRoomInventoryId(Long roomInventoryId);

    @Query("SELECT d FROM InventoryDetail d WHERE " +
           "(:roomInventoryId IS NULL OR d.roomInventoryId = :roomInventoryId) AND " +
           "(:routeId IS NULL OR d.routeId = :routeId) AND " +
           "(:hotelCode IS NULL OR d.hotelCode = :hotelCode) AND " +
           "(:roomType IS NULL OR d.roomType = :roomType) AND " +
           "(:roomNumber IS NULL OR d.roomNumber LIKE %:roomNumber%) AND " +
           "(:startDate IS NULL OR d.inventoryDate >= :startDate) AND " +
           "(:endDate IS NULL OR d.inventoryDate <= :endDate) AND " +
           "(:roomStatus IS NULL OR d.roomStatus = :roomStatus) AND " +
           "(:cleanStatus IS NULL OR d.cleanStatus = :cleanStatus)")
    Page<InventoryDetail> findByConditions(@Param("roomInventoryId") Long roomInventoryId,
                                           @Param("routeId") Long routeId,
                                           @Param("hotelCode") String hotelCode,
                                           @Param("roomType") String roomType,
                                           @Param("roomNumber") String roomNumber,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate,
                                           @Param("roomStatus") String roomStatus,
                                           @Param("cleanStatus") String cleanStatus,
                                           Pageable pageable);

    @Query("SELECT d FROM InventoryDetail d WHERE " +
           "d.hotelCode = :hotelCode AND d.roomNumber = :roomNumber AND d.inventoryDate = :inventoryDate")
    List<InventoryDetail> findByHotelAndRoomAndDate(@Param("hotelCode") String hotelCode,
                                                    @Param("roomNumber") String roomNumber,
                                                    @Param("inventoryDate") LocalDate inventoryDate);
}
