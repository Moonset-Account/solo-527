package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.dto.KilnOutRecordCreateDTO;
import com.ceramic.kiln.entity.ArtworkPhoto;
import com.ceramic.kiln.entity.KilnOutRecord;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.service.AuthService;
import com.ceramic.kiln.service.KilnOutRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kiln-out-records")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
public class KilnOutRecordController {

    private final KilnOutRecordService kilnOutRecordService;
    private final AuthService authService;

    @PostMapping
    public ApiResponse<KilnOutRecord> createRecord(@Valid @RequestBody KilnOutRecordCreateDTO dto,
                                                    Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("出窑记录创建成功", 
            kilnOutRecordService.createKilnOutRecord(dto, user.getId()));
    }

    @PostMapping("/photos")
    public ApiResponse<ArtworkPhoto> uploadPhoto(@RequestParam Long artworkId,
                                                  @RequestParam(required = false) Long kilnOutRecordId,
                                                  @RequestParam("file") MultipartFile file,
                                                  @RequestParam(required = false) String description,
                                                  Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("照片上传成功",
            kilnOutRecordService.uploadPhoto(artworkId, kilnOutRecordId, file, description, user.getId()));
    }

    @GetMapping
    public ApiResponse<Page<KilnOutRecord>> searchRecords(@RequestParam(required = false) Map<String, Object> params,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(kilnOutRecordService.searchRecords(params, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<KilnOutRecord> getRecord(@PathVariable Long id) {
        return ApiResponse.success(kilnOutRecordService.getRecord(id));
    }

    @GetMapping("/artwork/{artworkId}/photos")
    public ApiResponse<List<ArtworkPhoto>> getArtworkPhotos(@PathVariable Long artworkId) {
        return ApiResponse.success(kilnOutRecordService.getArtworkPhotos(artworkId));
    }
}
