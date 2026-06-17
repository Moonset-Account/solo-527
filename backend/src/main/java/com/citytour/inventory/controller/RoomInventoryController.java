package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.RoomInventory;
import com.citytour.inventory.service.RoomInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/inventory")
@RequiredArgsConstructor
public class RoomInventoryController {

    private final RoomInventoryService roomInventoryService;

    @GetMapping
    public Result<PageResult<RoomInventory>> list(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   @RequestParam(required = false) Long routeId,
                                                   @RequestParam(required = false) String hotelCode,
                                                   @RequestParam(required = false) String roomType,
                                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                   @RequestParam(required = false) String roomStatus) {
        return Result.success(roomInventoryService.list(page, size, routeId, hotelCode, roomType,
                startDate, endDate, roomStatus));
    }

    @GetMapping("/{id}")
    public Result<RoomInventory> getById(@PathVariable Long id) {
        return Result.success(roomInventoryService.getById(id));
    }

    @GetMapping("/query")
    public Result<RoomInventory> getInventory(@RequestParam Long routeId,
                                              @RequestParam String hotelCode,
                                              @RequestParam String roomType,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return Result.success(roomInventoryService.getInventory(routeId, hotelCode, roomType, date));
    }

    @GetMapping("/route/{routeId}")
    public Result<List<RoomInventory>> getRouteInventory(@PathVariable Long routeId,
                                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return Result.success(roomInventoryService.getRouteInventoryByDateRange(routeId, startDate, endDate));
    }

    @PostMapping
    public Result<RoomInventory> create(@RequestBody RoomInventory inventory,
                                        @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        inventory.setCreatedBy(operator);
        return Result.success(roomInventoryService.create(inventory));
    }

    @PutMapping
    public Result<RoomInventory> update(@RequestBody RoomInventory inventory,
                                       @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        inventory.setUpdatedBy(operator);
        return Result.success(roomInventoryService.update(inventory));
    }

    @PostMapping("/sync")
    public Result<RoomInventory> syncInventory(@RequestParam Long routeId,
                                               @RequestParam String hotelCode,
                                               @RequestParam String roomType,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                               @RequestParam Integer totalQuantity,
                                               @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(roomInventoryService.syncInventory(routeId, hotelCode, roomType, date, totalQuantity, operator));
    }

    @PostMapping("/{id}/book")
    public Result<Boolean> bookInventory(@PathVariable Long id,
                                          @RequestParam int quantity) {
        return Result.success(roomInventoryService.bookInventory(id, quantity));
    }

    @PostMapping("/{id}/release")
    public Result<Boolean> releaseInventory(@PathVariable Long id,
                                             @RequestParam int quantity) {
        return Result.success(roomInventoryService.releaseInventory(id, quantity));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        roomInventoryService.delete(id);
        return Result.success();
    }
}
