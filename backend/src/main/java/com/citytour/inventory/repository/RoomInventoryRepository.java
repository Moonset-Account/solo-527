package com.citytour.inventory.repository;

import com.citytour.inventory.entity.RoomInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomInventoryRepository extends JpaRepository<RoomInventory, Long> {

    Optional<RoomInventory> findByRouteIdAndHotelCodeAndRoomTypeAndInventoryDate(
            Long routeId, String hotelCode, String roomType, LocalDate inventoryDate);

    List<RoomInventory> findByRouteIdAndInventoryDate(Long routeId, LocalDate inventoryDate);

    @Query("SELECT ri FROM RoomInventory ri WHERE " +
           "(:routeId IS NULL OR ri.routeId = :routeId) AND " +
           "(:hotelCode IS NULL OR ri.hotelCode = :hotelCode) AND " +
           "(:roomType IS NULL OR ri.roomType = :roomType) AND " +
           "(:startDate IS NULL OR ri.inventoryDate >= :startDate) AND " +
           "(:endDate IS NULL OR ri.inventoryDate <= :endDate) AND " +
           "(:roomStatus IS NULL OR ri.roomStatus = :roomStatus)")
    Page<RoomInventory> findByConditions(@Param("routeId") Long routeId,
                                         @Param("hotelCode") String hotelCode,
                                         @Param("roomType") String roomType,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate,
                                         @Param("roomStatus") String roomStatus,
                                         Pageable pageable);

    @Query("SELECT ri FROM RoomInventory ri WHERE " +
           "ri.routeId = :routeId AND ri.inventoryDate BETWEEN :startDate AND :endDate")
    List<RoomInventory> findByRouteIdAndDateRange(@Param("routeId") Long routeId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);
}
