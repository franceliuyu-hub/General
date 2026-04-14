package com.example.schedule_back_end.model;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Data
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String ville;

    @Column(length = 1000)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @PrePersist
    @PreUpdate
    public void syncRoleWithSubtype() {
        if (this instanceof GestionnaireSalle) {
            role = UserRole.ROOM_MANAGER;
        } else if (this instanceof Administrateur) {
            role = UserRole.ADMINISTRATOR;
        } else if (this instanceof Enseignant) {
            role = UserRole.TEACHER;
        } else if (this instanceof RepresentantEtudiant) {
            role = UserRole.STUDENT_REPRESENTATIVE;
        }
    }

}
