package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.TourRoute;
import com.citytour.inventory.service.TourRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public/routes")
@RequiredArgsConstructor
public class PublicTourRouteController {

    private final TourRouteService tourRouteService;

    @GetMapping
    public Result<PageResult<TourRoute>> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              @RequestParam(required = false) String routeName,
                                              @RequestParam(required = false) String city,
                                              @RequestParam(defaultValue = "ACTIVE") String status) {
        return Result.success(tourRouteService.list(page, size, routeName, city, status));
    }

    @GetMapping("/{id}")
    public Result<TourRoute> getById(@PathVariable Long id) {
        return Result.success(tourRouteService.getById(id));
    }

    @GetMapping("/all")
    public Result<List<TourRoute>> getAllActive() {
        return Result.success(tourRouteService.getActiveRoutes());
    }
}
