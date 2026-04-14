package com.example.schedule_back_end.repository;

import com.example.schedule_back_end.model.Negotiation;
import com.example.schedule_back_end.repository.projection.NegotiationDetailsProjection;
import com.example.schedule_back_end.repository.projection.NegotiationSummaryProjection;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NegotiationRepository extends JpaRepository<Negotiation, Long> {
    List<Negotiation> findByCreatedByIdOrderByDateOuvertureDesc(Long userId);
    Optional<Negotiation> findByIdAndCreatedById(Long id, Long userId);
    boolean existsByScenarioId(String scenarioId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("""
            delete from Negotiation n
            where n.id = :negotiationId
              and n.createdBy.id = :userId
            """)
    int deleteByIdAndCreatedById(@Param("negotiationId") Long negotiationId, @Param("userId") Long userId);

    @Query("""
            select
                n.id as id,
                n.titre as titre,
                n.description as description,
                n.scenarioId as scenarioId,
                n.niveau as niveau,
                n.filiere as filiere,
                n.finalSlot as finalSlot,
                n.scoreConsensus as scoreConsensus,
                n.success as success,
                n.statut as statut,
                n.dateOuverture as dateOuverture,
                n.dateCloture as dateCloture
            from Negotiation n
            where n.createdBy.id = :userId
            order by n.dateOuverture desc
            """)
    List<NegotiationSummaryProjection> findSummaryByCreatedById(@Param("userId") Long userId);

    @Query("""
            select
                n.id as id,
                n.titre as titre,
                n.description as description,
                n.scenarioId as scenarioId,
                n.niveau as niveau,
                n.filiere as filiere,
                n.difficulty as difficulty,
                n.targetSlot as targetSlot,
                n.finalSlot as finalSlot,
                n.scoreConsensus as scoreConsensus,
                n.success as success,
                n.statut as statut,
                n.dateOuverture as dateOuverture,
                n.dateCloture as dateCloture,
                n.requestPayload as requestPayload,
                n.responsePayload as responsePayload
            from Negotiation n
            where n.id = :negotiationId
              and n.createdBy.id = :userId
            """)
    Optional<NegotiationDetailsProjection> findDetailsByIdAndCreatedById(
            @Param("negotiationId") Long negotiationId,
            @Param("userId") Long userId
    );
}
