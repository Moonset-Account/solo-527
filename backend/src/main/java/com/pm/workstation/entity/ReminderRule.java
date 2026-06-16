package com.pm.workstation.entity;

import com.pm.workstation.config.RemindMethodListConverter;
import com.pm.workstation.enums.ReminderType;
import com.pm.workstation.enums.RemindMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reminder_rule")
public class ReminderRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String ruleName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderType ruleType;

    @Column(columnDefinition = "JSON")
    private String triggerCondition;

    @Convert(converter = RemindMethodListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<RemindMethod> remindMethod;

    @Column
    private Integer remindBeforeHours;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
