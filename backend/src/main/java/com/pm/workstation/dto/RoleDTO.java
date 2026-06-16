package com.pm.workstation.dto;

import com.pm.workstation.enums.RoleType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {

    private Long id;

    private String roleName;

    private String roleCode;

    private RoleType roleType;

    private String description;

    private List<String> permissions;
}
