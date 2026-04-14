package com.example.schedule_back_end.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Constraints {
    @JsonProperty("no_early_morning")
    private Boolean noEarlyMorning;
    
    @JsonProperty("no_late_afternoon")
    private Boolean noLateAfternoon;
    
    @JsonProperty("max_days_per_week")
    private Integer maxDaysPerWeek;
    
    @JsonProperty("preferred_days")
    private List<String> preferredDays;
}
