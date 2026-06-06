package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.dto.ExternalArtworkSubmitDTO;
import com.ceramic.kiln.entity.Artwork;
import com.ceramic.kiln.entity.Clay;
import com.ceramic.kiln.entity.Glaze;
import com.ceramic.kiln.service.ArtworkService;
import com.ceramic.kiln.service.MasterDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/external")
@RequiredArgsConstructor
public class ExternalController {

    private final ArtworkService artworkService;
    private final MasterDataService masterDataService;

    @PostMapping("/artworks")
    public ApiResponse<Artwork> submitArtwork(@Valid @RequestBody ExternalArtworkSubmitDTO dto) {
        return ApiResponse.success("作品提交成功", artworkService.submitArtworkExternal(dto));
    }

    @GetMapping("/clays")
    public ApiResponse<List<Clay>> getClays() {
        return ApiResponse.success(masterDataService.getAllClays());
    }

    @GetMapping("/glazes")
    public ApiResponse<List<Glaze>> getGlazes() {
        return ApiResponse.success(masterDataService.getAllGlazes());
    }

    @GetMapping("/artworks/{id}")
    public ApiResponse<Artwork> getArtwork(@PathVariable Long id) {
        return ApiResponse.success(artworkService.getArtwork(id));
    }
}
