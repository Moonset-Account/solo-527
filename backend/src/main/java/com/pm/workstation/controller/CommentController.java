package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.CommentDTO;
import com.pm.workstation.entity.Comment;
import com.pm.workstation.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping
    public ApiResponseDTO<Comment> addComment(
            @Valid @RequestBody CommentDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        return ApiResponseDTO.success(commentService.addComment(dto, userId));
    }

    @GetMapping("/requirement/{id}")
    public ApiResponseDTO<List<Comment>> getCommentsByRequirementId(@PathVariable Long id) {
        return ApiResponseDTO.success(commentService.getCommentsByRequirementId(id));
    }
}
