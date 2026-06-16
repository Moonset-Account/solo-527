package com.pm.workstation.util;

import com.pm.workstation.enums.AuditAction;
import com.pm.workstation.service.AuditLogService;
import java.util.List;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.pm.workstation.entity.Comment;

@Aspect
@Component
public class AuditLogAspect {

    @Autowired
    private AuditLogService auditLogService;

    @Pointcut("execution(* com.pm.workstation.service.CommentService.checkUnrepliedComments())")
    public void checkUnrepliedCommentsPointcut() {
    }

    @AfterReturning(pointcut = "checkUnrepliedCommentsPointcut()", returning = "result")
    public void afterCheckUnrepliedComments(Object result) {
        @SuppressWarnings("unchecked")
        List<Comment> unreplied = (List<Comment>) result;
        for (Comment comment : unreplied) {
            auditLogService.logAction(
                    comment.getUserId(),
                    AuditAction.COMMENT_NO_REPLY,
                    "COMMENT",
                    comment.getId(),
                    "评论超过24小时无人回复，需求ID：" + comment.getRequirementId()
            );
        }
    }
}
