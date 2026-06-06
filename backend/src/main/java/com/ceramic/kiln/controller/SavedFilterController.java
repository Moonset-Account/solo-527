package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.entity.SavedFilter;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.service.AuthService;
import com.ceramic.kiln.service.SavedFilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-filters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
public class SavedFilterController {

    private final SavedFilterService savedFilterService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<SavedFilter>> getFilters(@RequestParam String pageName,
                                                      Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success(savedFilterService.getFilters(user.getId(), pageName));
    }

    @GetMapping("/default")
    public ApiResponse<SavedFilter> getDefaultFilter(@RequestParam String pageName,
                                                      Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success(savedFilterService.getDefaultFilter(user.getId(), pageName));
    }

    @PostMapping
    public ApiResponse<SavedFilter> saveFilter(@RequestParam String pageName,
                                                 @RequestParam String filterName,
                                                 @RequestBody Map<String, Object> criteria,
                                                 @RequestParam(required = false) Boolean isDefault,
                                                 Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("筛选条件保存成功",
            savedFilterService.saveFilter(user.getId(), pageName, filterName, criteria, isDefault));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteFilter(@PathVariable Long id,
                                           Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        savedFilterService.deleteFilter(id, user.getId());
        return ApiResponse.success("删除成功", null);
    }
}
