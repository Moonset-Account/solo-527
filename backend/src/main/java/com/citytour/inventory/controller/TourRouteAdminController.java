package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.TourRoute;
import com.citytour.inventory.service.TourRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/routes")
@RequiredArgsConstructor
public class TourRouteAdminController {

    private final TourRouteService tourRouteService;

    @GetMapping
    public Result<PageResult<TourRoute>> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              @RequestParam(required = false) String routeName,
                                              @RequestParam(required = false) String city,
                                              @RequestParam(required = false) String status) {
        return Result.success(tourRouteService.list(page, size, routeName, city, status));
    }

    @GetMapping("/{id}")
    public Result<TourRoute> getById(@PathVariable Long id) {
        return Result.success(tourRouteService.getById(id));
    }

    @PostMapping
    public Result<TourRoute> create(@RequestBody TourRoute route,
                                     @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        route.setCreatedBy(operator);
        return Result.success(tourRouteService.create(route));
    }

    @PutMapping
    public Result<TourRoute> update(@RequestBody TourRoute route,
                                    @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        route.setUpdatedBy(operator);
        return Result.success(tourRouteService.update(route));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tourRouteService.delete(id);
        return Result.success();
    }
}
