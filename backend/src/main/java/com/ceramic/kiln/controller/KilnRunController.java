package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.dto.KilnRunCreateDTO;
import com.ceramic.kiln.entity.KilnRun;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.service.AuthService;
import com.ceramic.kiln.service.KilnRunService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/kiln-runs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
public class KilnRunController {

    private final KilnRunService kilnRunService;
    private final AuthService authService;

    @PostMapping
    public ApiResponse<KilnRun> createKilnRun(@Valid @RequestBody KilnRunCreateDTO dto,
                                               Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("窑次创建成功", kilnRunService.createKilnRun(dto, user.getId()));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<KilnRun> approveKilnRun(@PathVariable Long id,
                                                Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("窑次审批通过", kilnRunService.approveKilnRun(id, user.getId()));
    }

    @PostMapping("/{id}/withdraw")
    public ApiResponse<KilnRun> withdrawKilnRun(@PathVariable Long id,
                                                 Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("窑次已撤回", kilnRunService.withdrawKilnRun(id, user.getId()));
    }

    @PostMapping("/{id}/start")
    public ApiResponse<KilnRun> startFiring(@PathVariable Long id,
                                             Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("开始烧制", kilnRunService.startFiring(id, user.getId()));
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<KilnRun> completeFiring(@PathVariable Long id,
                                                Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("烧制完成", kilnRunService.completeFiring(id, user.getId()));
    }

    @GetMapping
    public ApiResponse<Page<KilnRun>> searchKilnRuns(@RequestParam(required = false) Map<String, Object> params,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(kilnRunService.searchKilnRuns(params, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<KilnRun> getKilnRun(@PathVariable Long id) {
        return ApiResponse.success(kilnRunService.getKilnRun(id));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportArtworks(@PathVariable Long id) throws Exception {
        byte[] data = kilnRunService.exportKilnRunArtworks(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "kiln_run_" + id + ".xlsx");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(data);
    }
}
