package com.example.schedule_back_end.service;

import com.example.schedule_back_end.dto.*;
import com.example.schedule_back_end.dto.negotiation.EmploiSummaryResponse;
import com.example.schedule_back_end.dto.negotiation.NegotiationDetailsResponse;
import com.example.schedule_back_end.dto.negotiation.NegotiationSaveRequest;
import com.example.schedule_back_end.dto.negotiation.NegotiationSummaryResponse;
import com.example.schedule_back_end.model.*;
import com.example.schedule_back_end.repository.EmploiDuTempsRepository;
import com.example.schedule_back_end.repository.NegotiationRepository;
import com.example.schedule_back_end.repository.UsersRepository;
import com.example.schedule_back_end.repository.projection.EmploiSummaryProjection;
import com.example.schedule_back_end.repository.projection.NegotiationDetailsProjection;
import com.example.schedule_back_end.repository.projection.NegotiationSummaryProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NegotiationService {

    @Value("${transformer.api.url}")
    private String transformerApiUrl;

    private final UsersRepository usersRepository;
    private final NegotiationRepository negotiationRepository;
    private final EmploiDuTempsRepository emploiDuTempsRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public NegotiationDTO startNegotiation(NegotiationDTO request) {
        NegotiationDTO negotiationRequest = buildRequest(request);
        String negotiateUrl = transformerApiUrl + "/negotiate";
        return restTemplate.postForObject(negotiateUrl, negotiationRequest, NegotiationDTO.class);
    }

    public NegotiationSummaryResponse saveNegotiation(Long userId, NegotiationSaveRequest request) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        String title = normalize(request.titre(), "Le nom de la negotiation est obligatoire.");
        String filiere = normalize(request.filiere(), "La filiere est obligatoire.");
        if (request.niveau() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le niveau est obligatoire.");
        }
        if (request.negotiationRequest() == null || request.negotiationResponse() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les donnees de negociation sont obligatoires.");
        }

        Negotiation negotiation = new Negotiation();
        negotiation.setTitre(title);
        negotiation.setDescription(trimToNull(request.description()));
        negotiation.setScenarioId(generateUniqueScenarioId(request.negotiationResponse().getScenarioId()));
        negotiation.setNiveau(request.niveau());
        negotiation.setFiliere(filiere);
        negotiation.setDifficulty(request.negotiationRequest().getDifficulty());
        negotiation.setTargetSlot(request.negotiationRequest().getTargetSlot());
        negotiation.setFinalSlot(request.negotiationResponse().getFinalSlot());
        negotiation.setSuccess(Boolean.TRUE.equals(request.negotiationResponse().getSuccess()));
        negotiation.setScoreConsensus(extractGlobalScore(request.negotiationResponse()));
        negotiation.setStatut(Boolean.TRUE.equals(request.negotiationResponse().getSuccess()) ? StatutNegotiation.RESOLUE : StatutNegotiation.FERMEE);
        negotiation.setDateOuverture(LocalDateTime.now());
        negotiation.setDateCloture(LocalDateTime.now());
        negotiation.setRequestPayload(writeJson(request.negotiationRequest()));
        negotiation.setResponsePayload(writeJson(request.negotiationResponse()));
        negotiation.setCreatedBy(user);

        Negotiation savedNegotiation = negotiationRepository.save(negotiation);

        EmploiDuTemps emploiDuTemps = new EmploiDuTemps();
        emploiDuTemps.setOwner(user);
        emploiDuTemps.setNegotiation(savedNegotiation);
        emploiDuTemps.setScoreSatisfaction(savedNegotiation.getScoreConsensus());
        emploiDuTemps.setAnneeUniversitaire(currentAcademicYear());
        emploiDuTemps.setPromotion(savedNegotiation.getNiveau().name() + " " + savedNegotiation.getFiliere());
        emploiDuTemps.setStatut(Boolean.TRUE.equals(savedNegotiation.getSuccess()) ? StatutEmploi.VALIDE : StatutEmploi.BROUILLON);
        emploiDuTemps.setGeneratedAt(LocalDateTime.now());
        emploiDuTempsRepository.save(emploiDuTemps);

        return toSummary(savedNegotiation);
    }

    public List<NegotiationSummaryResponse> getNegotiationsForUser(Long userId) {
        return negotiationRepository.findSummaryByCreatedById(userId)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public NegotiationDetailsResponse getNegotiationDetails(Long userId, Long negotiationId) {
        NegotiationDetailsProjection negotiation = negotiationRepository.findDetailsByIdAndCreatedById(negotiationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negotiation introuvable."));

        return new NegotiationDetailsResponse(
                negotiation.getId(),
                negotiation.getTitre(),
                negotiation.getDescription(),
                negotiation.getScenarioId(),
                negotiation.getNiveau() != null ? negotiation.getNiveau().name() : null,
                negotiation.getFiliere(),
                negotiation.getDifficulty(),
                negotiation.getTargetSlot(),
                negotiation.getFinalSlot(),
                negotiation.getScoreConsensus(),
                negotiation.getSuccess(),
                negotiation.getStatut(),
                negotiation.getDateOuverture(),
                negotiation.getDateCloture(),
                safeReadNegotiationPayload(negotiation.getRequestPayload()),
                safeReadNegotiationPayload(negotiation.getResponsePayload())
        );
    }

    @Transactional
    public void deleteNegotiation(Long userId, Long negotiationId) {
        boolean exists = negotiationRepository.findByIdAndCreatedById(negotiationId, userId).isPresent();
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negotiation introuvable.");
        }

        emploiDuTempsRepository.deleteByNegotiationIdAndOwnerId(negotiationId, userId);
        negotiationRepository.deleteByIdAndCreatedById(negotiationId, userId);
    }

    public List<EmploiSummaryResponse> getEmploisForUser(Long userId) {
        return emploiDuTempsRepository.findSummaryByOwnerIdOrderByGeneratedAtDesc(userId)
                .stream()
                .map(this::toEmploiSummary)
                .toList();
    }

    private NegotiationDTO buildRequest(NegotiationDTO input) {
        NegotiationDTO dto = new NegotiationDTO();

        dto.setScenarioId(
                input.getScenarioId() != null && !input.getScenarioId().isBlank()
                        ? input.getScenarioId()
                        : "SCEN-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase()
        );
        dto.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z");
        dto.setDifficulty(input.getDifficulty() != null ? input.getDifficulty() : "medium");

        dto.setRoomManager(buildRoomManager(input.getRoomManager()));
        dto.setTeacher(input.getTeacher() != null ? input.getTeacher() : buildDefaultTeacher());
        dto.setStudents(input.getStudents() != null ? input.getStudents() : buildDefaultStudents());

        List<String> computedSlots = collectSlots(input, dto);
        dto.setAllPossibleSlots(computedSlots);
        dto.setTargetSlot(
                input.getTargetSlot() != null && !input.getTargetSlot().isBlank()
                        ? input.getTargetSlot()
                        : (computedSlots.isEmpty() ? "We-11:00" : computedSlots.get(0))
        );

        return dto;
    }

    private RoomManager buildRoomManager(RoomManager input) {
        if (input != null && input.getRooms() != null && !input.getRooms().isEmpty()) {
            Integer totalSlots = input.getTotalSlotsAvailable() != null && input.getTotalSlotsAvailable() > 0
                    ? input.getTotalSlotsAvailable()
                    : input.getRooms().stream()
                    .filter(Objects::nonNull)
                    .map(Room::getAvailableSlots)
                    .filter(Objects::nonNull)
                    .mapToInt(List::size)
                    .sum();

            return new RoomManager(input.getRooms(), totalSlots);
        }

        List<Room> rooms = new ArrayList<>();
        rooms.add(new Room("R001", 30, Arrays.asList("Mo-09:00", "Mo-10:00", "We-11:00")));
        rooms.add(new Room("R002", 50, Arrays.asList("Tu-10:00", "We-11:00", "Fr-14:00")));
        rooms.add(new Room("R003", 100, Arrays.asList("Mo-14:00", "Th-15:00", "Fr-16:00")));

        RoomManager roomManager = new RoomManager();
        roomManager.setRooms(rooms);
        roomManager.setTotalSlotsAvailable(40);
        return roomManager;
    }

    private Teacher buildDefaultTeacher() {
        Teacher teacher = new Teacher();
        teacher.setTeacherId("T001");
        teacher.setPreferredSlots(Arrays.asList("We-11:00", "Mo-10:00", "Fr-14:00"));
        teacher.setUnavailableSlots(Arrays.asList("Tu-09:00", "Th-08:00"));
        teacher.setMinSlotsNeeded(1);
        return teacher;
    }

    private Students buildDefaultStudents() {
        Constraints constraints = new Constraints();
        constraints.setNoEarlyMorning(false);
        constraints.setNoLateAfternoon(false);
        constraints.setMaxDaysPerWeek(2);
        constraints.setPreferredDays(Arrays.asList("Mo", "We", "Fr"));
        
        Students students = new Students();
        students.setGroupId("G001");
        students.setPreferredSlots(Arrays.asList("Mo-10:00", "We-11:00", "Fr-14:00"));
        students.setConstraints(constraints);
        
        return students;
    }

    private List<String> collectSlots(NegotiationDTO input, NegotiationDTO dto) {
        LinkedHashSet<String> slots = new LinkedHashSet<>();

        if (input.getAllPossibleSlots() != null) {
            slots.addAll(input.getAllPossibleSlots());
        }

        if (dto.getRoomManager() != null && dto.getRoomManager().getRooms() != null) {
            dto.getRoomManager().getRooms().stream()
                    .filter(Objects::nonNull)
                    .map(Room::getAvailableSlots)
                    .filter(Objects::nonNull)
                    .forEach(slots::addAll);
        }

        if (dto.getTeacher() != null) {
            if (dto.getTeacher().getPreferredSlots() != null) {
                slots.addAll(dto.getTeacher().getPreferredSlots());
            }
        }

        if (dto.getStudents() != null && dto.getStudents().getPreferredSlots() != null) {
            slots.addAll(dto.getStudents().getPreferredSlots());
        }

        if (slots.isEmpty()) {
            slots.addAll(generateDefaultSlots());
        }

        return new ArrayList<>(slots);
    }

    private List<String> generateDefaultSlots() {
        List<String> slots = new ArrayList<>();
        String[] days = {"Mo", "Tu", "We", "Th", "Fr"};
        int[] hours = {9, 10, 11, 12, 14, 15, 16, 17};

        for (String day : days) {
            for (int hour : hours) {
                slots.add(day + "-" + String.format("%02d:00", hour));
            }
        }

        return slots;
    }

    private NegotiationSummaryResponse toSummary(NegotiationSummaryProjection negotiation) {
        return new NegotiationSummaryResponse(
                negotiation.getId(),
                negotiation.getTitre(),
                negotiation.getDescription(),
                negotiation.getScenarioId(),
                negotiation.getNiveau() != null ? negotiation.getNiveau().name() : null,
                negotiation.getFiliere(),
                negotiation.getFinalSlot(),
                negotiation.getScoreConsensus(),
                negotiation.getSuccess(),
                negotiation.getStatut(),
                negotiation.getDateOuverture(),
                negotiation.getDateCloture()
        );
    }

    private NegotiationSummaryResponse toSummary(Negotiation negotiation) {
        return new NegotiationSummaryResponse(
                negotiation.getId(),
                negotiation.getTitre(),
                negotiation.getDescription(),
                negotiation.getScenarioId(),
                negotiation.getNiveau() != null ? negotiation.getNiveau().name() : null,
                negotiation.getFiliere(),
                negotiation.getFinalSlot(),
                negotiation.getScoreConsensus(),
                negotiation.getSuccess(),
                negotiation.getStatut(),
                negotiation.getDateOuverture(),
                negotiation.getDateCloture()
        );
    }

    private EmploiSummaryResponse toEmploiSummary(EmploiSummaryProjection emploi) {
        return new EmploiSummaryResponse(
                emploi.getId(),
                emploi.getNegotiationId(),
                emploi.getNegotiationTitre(),
                emploi.getNegotiationNiveau(),
                emploi.getNegotiationFiliere(),
                emploi.getNegotiationFinalSlot(),
                emploi.getAnneeUniversitaire(),
                emploi.getPromotion(),
                emploi.getScoreSatisfaction(),
                emploi.getStatut(),
                emploi.getGeneratedAt()
        );
    }

    private Float extractGlobalScore(NegotiationDTO negotiationResponse) {
        try {
            JsonNode root = objectMapper.valueToTree(negotiationResponse);
            JsonNode global = root.path("final_scores").path("global");
            return global.isNumber() ? (float) global.asDouble() : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de serialiser la negotiation.");
        }
    }

    private NegotiationDTO readNegotiationPayload(String payload) {
        try {
            return objectMapper.readValue(payload, NegotiationDTO.class);
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de relire la negotiation.");
        }
    }

    private NegotiationDTO safeReadNegotiationPayload(String payload) {
        if (payload == null || payload.isBlank()) {
            return null;
        }

        try {
            return readNegotiationPayload(payload);
        } catch (ResponseStatusException exception) {
            return null;
        }
    }

    private String normalize(String value, String errorMessage) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String currentAcademicYear() {
        LocalDate today = LocalDate.now();
        int startYear = today.getMonthValue() >= 9 ? today.getYear() : today.getYear() - 1;
        return startYear + "-" + (startYear + 1);
    }

    private String generateUniqueScenarioId(String requestedScenarioId) {
        String base = trimToNull(requestedScenarioId);
        if (base == null) {
            base = "SCEN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        if (!negotiationRepository.existsByScenarioId(base)) {
            return base;
        }

        return base + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
