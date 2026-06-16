package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.MeetingMinutesDTO;
import com.pm.workstation.entity.MeetingMinutes;
import com.pm.workstation.service.MeetingMinutesService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meetings")
public class MeetingMinutesController {

    @Autowired
    private MeetingMinutesService meetingMinutesService;

    @PostMapping
    public ApiResponseDTO<MeetingMinutes> createMinutes(
            @Valid @RequestBody MeetingMinutesDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return ApiResponseDTO.success(meetingMinutesService.createMinutes(dto, userId));
    }

    @PutMapping("/{id}")
    public ApiResponseDTO<MeetingMinutes> updateMinutes(
            @PathVariable Long id,
            @Valid @RequestBody MeetingMinutesDTO dto) {
        return ApiResponseDTO.success(meetingMinutesService.updateMinutes(id, dto));
    }

    @GetMapping("/requirement/{id}")
    public ApiResponseDTO<List<MeetingMinutes>> getMinutesByRequirementId(@PathVariable Long id) {
        return ApiResponseDTO.success(meetingMinutesService.getMinutesByRequirementId(id));
    }
}
