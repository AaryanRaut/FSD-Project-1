package com.urbanheat.controller;

import com.urbanheat.model.HeatRiskHistory;
import com.urbanheat.repository.HeatRiskHistoryRepository;
import com.urbanheat.service.HeatRiskService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/heat-risk")
@Validated
public class HeatRiskController {
    private final HeatRiskService service;
    private final HeatRiskHistoryRepository historyRepository;

    public HeatRiskController(HeatRiskService service, HeatRiskHistoryRepository historyRepository) {
        this.service = service; this.historyRepository = historyRepository;
    }

    @PostMapping("/classify")
    @ResponseStatus(HttpStatus.CREATED)
    public HeatRiskHistory classify(@Valid @RequestBody ClassificationRequest request, Authentication authentication) {
        return service.classify(new HeatRiskService.HeatRiskRequest(request.zone(), request.temperature(), request.humidity(), request.windSpeed()), authentication.getName());
    }

    @GetMapping("/history")
    public List<HeatRiskHistory> history() {
        return historyRepository.findTop50ByOrderByClassifiedAtDesc();
    }

    public record ClassificationRequest(
            @NotBlank(message = "City zone is required") String zone,
            @NotNull(message = "Temperature is required")
            @DecimalMin(value = "0.0", message = "Temperature must be at least 0°C")
            @DecimalMax(value = "70.0", message = "Temperature must not exceed 70°C") Double temperature,
            @NotNull(message = "Humidity is required")
            @Min(value = 0, message = "Humidity must be between 0 and 100%")
            @Max(value = 100, message = "Humidity must be between 0 and 100%") Integer humidity,
            @NotNull(message = "Wind speed is required")
            @DecimalMin(value = "0.0", message = "Wind speed cannot be negative")
            @DecimalMax(value = "200.0", message = "Wind speed must not exceed 200 km/h") Double windSpeed
    ) {}
}
