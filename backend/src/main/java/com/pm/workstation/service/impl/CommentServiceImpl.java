package com.pm.workstation.service.impl;

import com.pm.workstation.dto.CommentDTO;
import com.pm.workstation.entity.Comment;
import com.pm.workstation.repository.CommentRepository;
import com.pm.workstation.service.CommentService;
import com.pm.workstation.service.ReminderService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ReminderService reminderService;

    @Override
    @Transactional
    public Comment addComment(CommentDTO dto, Long userId) {
        Comment comment = new Comment();
        comment.setRequirementId(dto.getRequirementId());
        comment.setUserId(userId);
        comment.setContent(dto.getContent());
        comment.setParentId(dto.getParentId());
        comment.setHasReply(false);
        comment.setReplyReminded(false);
        LocalDateTime now = LocalDateTime.now();
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        comment = commentRepository.save(comment);

        if (dto.getParentId() != null) {
            commentRepository.findById(dto.getParentId()).ifPresent(parent -> {
                parent.setHasReply(true);
                parent.setUpdatedAt(LocalDateTime.now());
                commentRepository.save(parent);
            });
        }

        return comment;
    }

    @Override
    public List<Comment> getCommentsByRequirementId(Long requirementId) {
        return commentRepository.findByRequirementIdOrderByCreatedAtDesc(requirementId);
    }

    @Override
    @Transactional
    public List<Comment> checkUnrepliedComments() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Comment> unreplied = commentRepository.findByHasReplyFalseAndReplyRemindedFalse();
        List<Comment> overdue = unreplied.stream()
                .filter(c -> c.getCreatedAt().isBefore(cutoff))
                .toList();
        for (Comment comment : overdue) {
            reminderService.sendReminder(null, comment.getId(), comment.getUserId());
            comment.setReplyReminded(true);
            comment.setUpdatedAt(LocalDateTime.now());
            commentRepository.save(comment);
        }
        return overdue;
    }
}
