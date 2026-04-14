package com.example.schedule_back_end.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi;

    @ManyToOne
    private Users auteur;
}
