package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.InventoryDetail;
import com.citytour.inventory.repository.InventoryDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryDetailService {

    private final InventoryDetailRepository inventoryDetailRepository;

    public PageResult<InventoryDetail> list(int page, int size, Long roomInventoryId, Long routeId,
                                            String hotelCode, String roomType, String roomNumber,
                                            LocalDate startDate, LocalDate endDate,
                                            String roomStatus, String cleanStatus) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<InventoryDetail> result = inventoryDetailRepository.findByConditions(
                roomInventoryId, routeId, hotelCode, roomType, roomNumber,
                startDate, endDate, roomStatus, cleanStatus, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public InventoryDetail getById(Long id) {
        return inventoryDetailRepository.findById(id).orElse(null);
    }

    public List<InventoryDetail> getByRoomInventoryId(Long roomInventoryId) {
        return inventoryDetailRepository.findByRoomInventoryId(roomInventoryId);
    }

    @Transactional
    public InventoryDetail create(InventoryDetail detail) {
        return inventoryDetailRepository.save(detail);
    }

    @Transactional
    public InventoryDetail update(InventoryDetail detail) {
        return inventoryDetailRepository.save(detail);
    }

    @Transactional
    public void delete(Long id) {
        inventoryDetailRepository.deleteById(id);
    }
}
