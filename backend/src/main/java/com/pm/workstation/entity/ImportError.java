package com.pm.workstation.entity;

import com.pm.workstation.enums.ImportErrorStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "import_error")
public class ImportError {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String batchNo;

    @Column(nullable = false)
    private Integer rowNumber;

    @Column(columnDefinition = "JSON")
    private String rawData;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImportErrorStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
