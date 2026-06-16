package com.pm.workstation.repository;

import com.pm.workstation.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByRequirementIdOrderByCreatedAtDesc(Long requirementId);

    List<Comment> findByUserId(Long userId);

    List<Comment> findByParentId(Long parentId);

    List<Comment> findByHasReplyFalseAndReplyRemindedFalse();

    long countByRequirementId(Long requirementId);
}
