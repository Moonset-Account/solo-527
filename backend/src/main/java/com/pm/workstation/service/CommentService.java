package com.pm.workstation.service;

import com.pm.workstation.dto.CommentDTO;
import com.pm.workstation.entity.Comment;
import java.util.List;

public interface CommentService {

    Comment addComment(CommentDTO dto, Long userId);

    List<Comment> getCommentsByRequirementId(Long requirementId);

    List<Comment> checkUnrepliedComments();
}
