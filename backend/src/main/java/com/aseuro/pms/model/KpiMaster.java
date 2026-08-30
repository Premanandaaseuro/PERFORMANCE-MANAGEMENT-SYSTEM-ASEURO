package com.aseuro.pms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "kpi_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String designation;

    @Column(name = "kpi_name", nullable = false)
    private String kpiName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double weightage;

    @Column(name = "self_rating_scale")
    private String selfRatingScale;

    @Column(name = "manager_rating_scale")
    private String managerRatingScale;

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
