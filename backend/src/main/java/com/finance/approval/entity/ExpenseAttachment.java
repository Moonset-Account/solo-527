package com.finance.approval.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "expense_attachment")
@EntityListeners(AuditingEntityListener.class)
public class ExpenseAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(nullable = false, length = 200)
    private String fileName;

    @Column(length = 50)
    private String fileType;

    private Long fileSize;

    @Column(length = 500)
    private String fileUrl;

    @Column(nullable = false)
    private Long uploadedBy;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}
