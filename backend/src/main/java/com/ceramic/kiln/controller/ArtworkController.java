package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.*;
import com.ceramic.kiln.entity.Artwork;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.service.ArtworkService;
import com.ceramic.kiln.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
public class ArtworkController {

    private final ArtworkService artworkService;
    private final AuthService authService;

    @PostMapping
    public ApiResponse<Artwork> createArtwork(@Valid @RequestBody ArtworkSubmitDTO dto, 
                                              Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("作品创建成功", artworkService.submitArtworkInternal(dto, user.getId()));
    }

    @PostMapping("/{id}/review")
    public ApiResponse<Artwork> reviewArtwork(@PathVariable Long id,
                                               @Valid @RequestBody ArtworkReviewDTO dto,
                                               Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("审核完成", artworkService.reviewArtwork(id, dto, user.getId()));
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<Artwork> assignToKilnRun(@PathVariable Long id,
                                                 @RequestParam Long kilnRunId,
                                                 Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("安排入窑成功", artworkService.assignToKilnRun(id, kilnRunId, user.getId()));
    }

    @PostMapping("/{id}/withdraw")
    public ApiResponse<Artwork> withdrawFromKilnRun(@PathVariable Long id,
                                                     Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("撤回成功", artworkService.withdrawFromKilnRun(id, user.getId()));
    }

    @GetMapping
    public ApiResponse<Page<Artwork>> searchArtworks(@RequestParam(required = false) Map<String, Object> params,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(artworkService.searchArtworks(params, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<Artwork> getArtwork(@PathVariable Long id) {
        return ApiResponse.success(artworkService.getArtwork(id));
    }

    @GetMapping("/kiln-run/{kilnRunId}")
    public ApiResponse<List<Artwork>> getArtworksByKilnRun(@PathVariable Long kilnRunId) {
        return ApiResponse.success(artworkService.getArtworksByKilnRunId(kilnRunId));
    }
}
