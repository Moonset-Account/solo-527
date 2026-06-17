package com.citytour.inventory.repository;

import com.citytour.inventory.entity.TourRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TourRouteRepository extends JpaRepository<TourRoute, Long> {

    Optional<TourRoute> findByRouteCode(String routeCode);

    List<TourRoute> findByStatus(String status);

    @Query("SELECT r FROM TourRoute r WHERE " +
           "(:routeName IS NULL OR r.routeName LIKE %:routeName%) AND " +
           "(:city IS NULL OR r.city = :city) AND " +
           "(:status IS NULL OR r.status = :status)")
    Page<TourRoute> findByConditions(@Param("routeName") String routeName,
                                     @Param("city") String city,
                                     @Param("status") String status,
                                     Pageable pageable);
}
