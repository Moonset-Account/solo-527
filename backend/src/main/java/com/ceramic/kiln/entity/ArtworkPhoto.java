package com.ceramic.kiln.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "artwork_photos")
public class ArtworkPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "artwork_id", nullable = false)
    private Long artworkId;

    @Column(name = "kiln_out_record_id")
    private Long kilnOutRecordId;

    @Column(name = "photo_url", nullable = false, length = 500)
    private String photoUrl;

    @Column(name = "photo_type", length = 20)
    private String photoType = "OUT_KILN";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
