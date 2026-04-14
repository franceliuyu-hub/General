package com.example.schedule_back_end.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule_back_end.dto.NegotiationDTO;
import com.example.schedule_back_end.dto.negotiation.NegotiationSaveRequest;
import com.example.schedule_back_end.service.NegotiationService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class NegotiationController {

    private final NegotiationService negotiationService;

    public NegotiationController(NegotiationService negotiationService) {
        this.negotiationService = negotiationService;
    }

    @PostMapping("/negotiate/start")
    public ResponseEntity<?> startNegotiation(@RequestBody NegotiationDTO request) {
        try {
            NegotiationDTO result = negotiationService.startNegotiation(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Negotiation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/users/{userId}/negotiations")
    public ResponseEntity<?> saveNegotiation(
            @PathVariable Long userId,
            @RequestBody NegotiationSaveRequest request
    ) {
        return ResponseEntity.ok(negotiationService.saveNegotiation(userId, request));
    }

    @GetMapping("/users/{userId}/negotiations")
    public ResponseEntity<?> getNegotiations(@PathVariable Long userId) {
        return ResponseEntity.ok(negotiationService.getNegotiationsForUser(userId));
    }

    @GetMapping("/users/{userId}/negotiations/{negotiationId}")
    public ResponseEntity<?> getNegotiationDetails(
            @PathVariable Long userId,
            @PathVariable Long negotiationId
    ) {
        try {
            return ResponseEntity.ok(negotiationService.getNegotiationDetails(userId, negotiationId));
        } catch (ResponseStatusException exception) {
            return ResponseEntity.status(exception.getStatusCode())
                    .body(new ErrorResponse(exception.getReason() != null ? exception.getReason() : "Erreur lors du chargement de la negotiation."));
        } catch (Exception exception) {
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("Erreur lors du chargement de la negotiation: " + exception.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}/negotiations/{negotiationId}")
    public ResponseEntity<?> deleteNegotiation(
            @PathVariable Long userId,
            @PathVariable Long negotiationId
    ) {
        try {
            negotiationService.deleteNegotiation(userId, negotiationId);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } catch (ResponseStatusException exception) {
            return ResponseEntity.status(exception.getStatusCode())
                    .body(new ErrorResponse(exception.getReason() != null ? exception.getReason() : "Erreur lors de la suppression de la negotiation."));
        } catch (Exception exception) {
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("Erreur lors de la suppression de la negotiation: " + exception.getMessage()));
        }
    }

    @GetMapping("/users/{userId}/emplois")
    public ResponseEntity<?> getEmplois(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(negotiationService.getEmploisForUser(userId));
        } catch (ResponseStatusException exception) {
            return ResponseEntity.status(exception.getStatusCode())
                    .body(new ErrorResponse(exception.getReason() != null ? exception.getReason() : "Erreur lors du chargement des emplois du temps."));
        } catch (Exception exception) {
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("Erreur lors du chargement des emplois du temps: " + exception.getMessage()));
        }
    }
}

class ErrorResponse {
    public String error;
    
    public ErrorResponse(String error) {
        this.error = error;
    }
}
