package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.TourRoute;
import com.citytour.inventory.repository.TourRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TourRouteService {

    private final TourRouteRepository tourRouteRepository;

    @Cacheable(value = "tourRoutes", key = "#page + '-' + #size")
    public PageResult<TourRoute> list(int page, int size, String routeName, String city, String status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<TourRoute> result = tourRouteRepository.findByConditions(routeName, city, status, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    @Cacheable(value = "tourRoute", key = "#id")
    public TourRoute getById(Long id) {
        return tourRouteRepository.findById(id).orElse(null);
    }

    public TourRoute getByCode(String routeCode) {
        return tourRouteRepository.findByRouteCode(routeCode).orElse(null);
    }

    public List<TourRoute> getActiveRoutes() {
        return tourRouteRepository.findByStatus("ACTIVE");
    }

    @Transactional
    @CacheEvict(value = {"tourRoutes", "tourRoute"}, allEntries = true)
    public TourRoute create(TourRoute route) {
        route.setVersion(1);
        return tourRouteRepository.save(route);
    }

    @Transactional
    @CacheEvict(value = {"tourRoutes", "tourRoute"}, allEntries = true)
    public TourRoute update(TourRoute route) {
        TourRoute existing = tourRouteRepository.findById(route.getId()).orElseThrow();
        route.setVersion(existing.getVersion() + 1);
        return tourRouteRepository.save(route);
    }

    @Transactional
    @CacheEvict(value = {"tourRoutes", "tourRoute"}, allEntries = true)
    public void delete(Long id) {
        tourRouteRepository.deleteById(id);
    }
}
