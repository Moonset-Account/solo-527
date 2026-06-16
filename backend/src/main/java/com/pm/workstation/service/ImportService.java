package com.pm.workstation.service;

import com.pm.workstation.dto.ImportResultDTO;
import com.pm.workstation.entity.ImportError;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ImportService {

    ImportResultDTO batchImportRequirements(MultipartFile file);

    void batchApproveWithValidation(List<Long> ids);

    List<ImportError> getImportErrors(String batchNo);

    byte[] downloadErrorTemplate(String batchNo);
}
