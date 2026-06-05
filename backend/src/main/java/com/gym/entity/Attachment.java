package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "attachment")
public class Attachment extends BaseEntity {

    @Column(nullable = false, length = 500)
    private String fileName;

    @Column(length = 500)
    private String originalFileName;

    @Column(nullable = false, length = 200)
    private String filePath;

    @Column(length = 100)
    private String fileType;

    private Long fileSize;

    @Column(length = 100)
    private String relatedType;

    private Long relatedId;

    @Column(length = 20)
    private String uploadStatus;

    @Column(length = 1000)
    private String errorMessage;

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getRelatedType() { return relatedType; }
    public void setRelatedType(String relatedType) { this.relatedType = relatedType; }
    public Long getRelatedId() { return relatedId; }
    public void setRelatedId(Long relatedId) { this.relatedId = relatedId; }
    public String getUploadStatus() { return uploadStatus; }
    public void setUploadStatus(String uploadStatus) { this.uploadStatus = uploadStatus; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
