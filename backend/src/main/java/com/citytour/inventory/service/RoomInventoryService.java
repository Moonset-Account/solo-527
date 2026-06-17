package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.RoomInventory;
import com.citytour.inventory.repository.RoomInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RoomInventoryService {

    private final RoomInventoryRepository roomInventoryRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String INVENTORY_CACHE_KEY = "inventory:room:";

    @Cacheable(value = "roomInventories", key = "#page + '-' + #size + '-' + #routeId")
    public PageResult<RoomInventory> list(int page, int size, Long routeId, String hotelCode,
                                          String roomType, LocalDate startDate, LocalDate endDate,
                                          String roomStatus) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "inventoryDate"));
        Page<RoomInventory> result = roomInventoryRepository.findByConditions(
                routeId, hotelCode, roomType, startDate, endDate, roomStatus, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public RoomInventory getById(Long id) {
        return roomInventoryRepository.findById(id).orElse(null);
    }

    public RoomInventory getInventory(Long routeId, String hotelCode, String roomType, LocalDate date) {
        String cacheKey = INVENTORY_CACHE_KEY + routeId + ":" + hotelCode + ":" + roomType + ":" + date;
        RoomInventory cached = (RoomInventory) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        RoomInventory inventory = roomInventoryRepository
                .findByRouteIdAndHotelCodeAndRoomTypeAndInventoryDate(routeId, hotelCode, roomType, date)
                .orElse(null);
        if (inventory != null) {
            redisTemplate.opsForValue().set(cacheKey, inventory, 5, TimeUnit.MINUTES);
        }
        return inventory;
    }

    public List<RoomInventory> getRouteInventoryByDateRange(Long routeId, LocalDate startDate, LocalDate endDate) {
        return roomInventoryRepository.findByRouteIdAndDateRange(routeId, startDate, endDate);
    }

    @Transactional
    @CacheEvict(value = "roomInventories", allEntries = true)
    public RoomInventory create(RoomInventory inventory) {
        inventory.setVersion(1);
        if (inventory.getBookedQuantity() == null) inventory.setBookedQuantity(0);
        if (inventory.getBlockedQuantity() == null) inventory.setBlockedQuantity(0);
        if (inventory.getAvailableQuantity() == null) {
            inventory.setAvailableQuantity(inventory.getTotalQuantity());
        }
        RoomInventory saved = roomInventoryRepository.save(inventory);
        evictInventoryCache(saved);
        return saved;
    }

    @Transactional
    @CacheEvict(value = "roomInventories", allEntries = true)
    public RoomInventory update(RoomInventory inventory) {
        RoomInventory existing = roomInventoryRepository.findById(inventory.getId()).orElseThrow();
        inventory.setVersion(existing.getVersion() + 1);
        recalculateAvailable(inventory);
        RoomInventory saved = roomInventoryRepository.save(inventory);
        evictInventoryCache(saved);
        return saved;
    }

    @Transactional
    @CacheEvict(value = "roomInventories", allEntries = true)
    public RoomInventory syncInventory(Long routeId, String hotelCode, String roomType,
                                       LocalDate date, Integer totalQuantity, String operator) {
        RoomInventory inventory = roomInventoryRepository
                .findByRouteIdAndHotelCodeAndRoomTypeAndInventoryDate(routeId, hotelCode, roomType, date)
                .orElse(null);

        if (inventory == null) {
            inventory = new RoomInventory();
            inventory.setRouteId(routeId);
            inventory.setHotelCode(hotelCode);
            inventory.setRoomType(roomType);
            inventory.setInventoryDate(date);
            inventory.setTotalQuantity(totalQuantity);
            inventory.setBookedQuantity(0);
            inventory.setBlockedQuantity(0);
            inventory.setAvailableQuantity(totalQuantity);
            inventory.setRoomStatus("NORMAL");
            inventory.setVersion(1);
            inventory.setCreatedBy(operator);
        } else {
            int diff = totalQuantity - inventory.getTotalQuantity();
            inventory.setTotalQuantity(totalQuantity);
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + diff);
            inventory.setVersion(inventory.getVersion() + 1);
            inventory.setUpdatedBy(operator);
        }

        RoomInventory saved = roomInventoryRepository.save(inventory);
        evictInventoryCache(saved);
        return saved;
    }

    @Transactional
    @CacheEvict(value = "roomInventories", allEntries = true)
    public boolean bookInventory(Long id, int quantity) {
        RoomInventory inventory = roomInventoryRepository.findById(id).orElseThrow();
        if (inventory.getAvailableQuantity() < quantity) {
            return false;
        }
        inventory.setBookedQuantity(inventory.getBookedQuantity() + quantity);
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
        inventory.setVersion(inventory.getVersion() + 1);
        roomInventoryRepository.save(inventory);
        evictInventoryCache(inventory);
        return true;
    }

    @Transactional
    @CacheEvict(value = "roomInventories", allEntries = true)
    public boolean releaseInventory(Long id, int quantity) {
        RoomInventory inventory = roomInventoryRepository.findById(id).orElseThrow();
        inventory.setBookedQuantity(Math.max(0, inventory.getBookedQuantity() - quantity));
        recalculateAvailable(inventory);
        inventory.setVersion(inventory.getVersion() + 1);
        roomInventoryRepository.save(inventory);
        evictInventoryCache(inventory);
        return true;
    }

    @Transactional
    @CacheEvict(value = "roomInventories", allEntries = true)
    public void delete(Long id) {
        RoomInventory inventory = roomInventoryRepository.findById(id).orElse(null);
        if (inventory != null) {
            evictInventoryCache(inventory);
            roomInventoryRepository.deleteById(id);
        }
    }

    private void recalculateAvailable(RoomInventory inventory) {
        int available = inventory.getTotalQuantity() - inventory.getBookedQuantity() - inventory.getBlockedQuantity();
        inventory.setAvailableQuantity(Math.max(0, available));
    }

    private void evictInventoryCache(RoomInventory inventory) {
        String cacheKey = INVENTORY_CACHE_KEY + inventory.getRouteId() + ":" +
                inventory.getHotelCode() + ":" + inventory.getRoomType() + ":" +
                inventory.getInventoryDate();
        redisTemplate.delete(cacheKey);
    }
}
