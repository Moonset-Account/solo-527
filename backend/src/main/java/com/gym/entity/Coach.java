package com.gym.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "coaches")
public class Coach extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "coach_no", nullable = false, unique = true, length = 50)
    private String coachNo;

    @Column(length = 200)
    private String specialty;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCoachNo() {
        return coachNo;
    }

    public void setCoachNo(String coachNo) {
        this.coachNo = coachNo;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Coach coach)) return false;
        if (!super.equals(o)) return false;

        if (getId() != null ? !getId().equals(coach.getId()) : coach.getId() != null) return false;
        if (getUserId() != null ? !getUserId().equals(coach.getUserId()) : coach.getUserId() != null) return false;
        if (getCoachNo() != null ? !getCoachNo().equals(coach.getCoachNo()) : coach.getCoachNo() != null) return false;
        if (getSpecialty() != null ? !getSpecialty().equals(coach.getSpecialty()) : coach.getSpecialty() != null) return false;
        if (getDescription() != null ? !getDescription().equals(coach.getDescription()) : coach.getDescription() != null) return false;
        return getHireDate() != null ? getHireDate().equals(coach.getHireDate()) : coach.getHireDate() == null;
    }

    @Override
    public int hashCode() {
        int result = super.hashCode();
        result = 31 * result + (getId() != null ? getId().hashCode() : 0);
        result = 31 * result + (getUserId() != null ? getUserId().hashCode() : 0);
        result = 31 * result + (getCoachNo() != null ? getCoachNo().hashCode() : 0);
        result = 31 * result + (getSpecialty() != null ? getSpecialty().hashCode() : 0);
        result = 31 * result + (getDescription() != null ? getDescription().hashCode() : 0);
        result = 31 * result + (getHireDate() != null ? getHireDate().hashCode() : 0);
        return result;
    }
}
