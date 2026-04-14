package com.example.schedule_back_end.repository;

import com.example.schedule_back_end.model.EmploiDuTemps;
import com.example.schedule_back_end.repository.projection.EmploiSummaryProjection;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmploiDuTempsRepository extends JpaRepository<EmploiDuTemps, Long> {
    List<EmploiDuTemps> findByOwnerIdOrderByGeneratedAtDesc(Long userId);

    @Query("""
            select
                e.id as id,
                n.id as negotiationId,
                n.titre as negotiationTitre,
                cast(n.niveau as string) as negotiationNiveau,
                n.filiere as negotiationFiliere,
                n.finalSlot as negotiationFinalSlot,
                e.anneeUniversitaire as anneeUniversitaire,
                e.promotion as promotion,
                e.scoreSatisfaction as scoreSatisfaction,
                e.statut as statut,
                e.generatedAt as generatedAt
            from EmploiDuTemps e
            join e.negotiation n
            where e.owner.id = :userId
            order by e.generatedAt desc
            """)
    List<EmploiSummaryProjection> findSummaryByOwnerIdOrderByGeneratedAtDesc(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("""
            delete from EmploiDuTemps e
            where e.negotiation.id = :negotiationId
              and e.owner.id = :userId
            """)
    int deleteByNegotiationIdAndOwnerId(@Param("negotiationId") Long negotiationId, @Param("userId") Long userId);
}
