package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.InventoryDetail;
import com.citytour.inventory.service.InventoryDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/inventory-details")
@RequiredArgsConstructor
public class InventoryDetailController {

    private final InventoryDetailService inventoryDetailService;

    @GetMapping
    public Result<PageResult<InventoryDetail>> list(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    @RequestParam(required = false) Long roomInventoryId,
                                                    @RequestParam(required = false) Long routeId,
                                                    @RequestParam(required = false) String hotelCode,
                                                    @RequestParam(required = false) String roomType,
                                                    @RequestParam(required = false) String roomNumber,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                    @RequestParam(required = false) String roomStatus,
                                                    @RequestParam(required = false) String cleanStatus) {
        return Result.success(inventoryDetailService.list(page, size, roomInventoryId, routeId,
                hotelCode, roomType, roomNumber, startDate, endDate, roomStatus, cleanStatus));
    }

    @GetMapping("/{id}")
    public Result<InventoryDetail> getById(@PathVariable Long id) {
        return Result.success(inventoryDetailService.getById(id));
    }

    @GetMapping("/by-inventory/{roomInventoryId}")
    public Result<List<InventoryDetail>> getByRoomInventoryId(@PathVariable Long roomInventoryId) {
        return Result.success(inventoryDetailService.getByRoomInventoryId(roomInventoryId));
    }

    @PostMapping
    public Result<InventoryDetail> create(@RequestBody InventoryDetail detail,
                                          @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        detail.setCreatedBy(operator);
        return Result.success(inventoryDetailService.create(detail));
    }

    @PutMapping
    public Result<InventoryDetail> update(@RequestBody InventoryDetail detail,
                                          @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        detail.setUpdatedBy(operator);
        return Result.success(inventoryDetailService.update(detail));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        inventoryDetailService.delete(id);
        return Result.success();
    }
}
