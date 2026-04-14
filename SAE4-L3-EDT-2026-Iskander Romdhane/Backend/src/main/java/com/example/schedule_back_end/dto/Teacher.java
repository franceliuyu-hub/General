package com.example.schedule_back_end.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Teacher {
    @JsonProperty("teacher_id")
    private String teacherId;
    
    @JsonProperty("preferred_slots")
    private List<String> preferredSlots;
    
    @JsonProperty("unavailable_slots")
    private List<String> unavailableSlots;
    
    @JsonProperty("min_slots_needed")
    private Integer minSlotsNeeded;
}
