package com.example.schedule_back_end.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    @JsonProperty("room_id")
    private String roomId;
    
    @JsonProperty("capacity")
    private Integer capacity;
    
    @JsonProperty("available_slots")
    private List<String> availableSlots;
}
