package com.urbanheat.service;

import com.urbanheat.model.HeatRiskHistory;
import com.urbanheat.repository.HeatRiskHistoryRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class HeatRiskService {
    private final HeatRiskHistoryRepository historyRepository;

    public HeatRiskService(HeatRiskHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    public HeatRiskHistory classify(HeatRiskRequest request, String username) {
        int score;
        if (request.temperature() < 32) score = 0;
        else if (request.temperature() < 36) score = 1;
        else if (request.temperature() < 40) score = 2;
        else score = 3;

        List<String> factors = new ArrayList<>();
        factors.add("Temperature contributes a base risk score of " + score + ".");
        if (request.humidity() >= 70) {
            score++;
            factors.add("High humidity (70% or above) increases the risk by one level.");
        }
        if (request.windSpeed() <= 5) {
            score++;
            factors.add("Low wind speed (5 km/h or below) increases the risk by one level.");
        }
        score = Math.min(score, 3);
        String[] levels = {"Low", "Moderate", "High", "Critical"};
        String risk = levels[score];
        String explanation = String.join(" ", factors) + " Final classification: " + risk + ".";

        List<String> recommendations = switch (risk) {
            case "Critical" -> List.of(
                    "Avoid outdoor activity and remain in a cool or air-conditioned place.",
                    "Drink water regularly; do not wait until you feel thirsty.",
                    "Check on older adults, children and people who may need assistance.",
                    "Use a nearby open cooling centre if your home is not cool.",
                    "Seek urgent medical help if heat-illness symptoms occur."
            );
            case "High" -> List.of(
                    "Limit strenuous outdoor activity, especially during the hottest hours.",
                    "Drink water regularly and wear light, loose-fitting clothing.",
                    "Take breaks in shaded or cool places.",
                    "Check on vulnerable neighbours and family members."
            );
            case "Moderate" -> List.of(
                    "Stay hydrated throughout the day.",
                    "Prefer shade and take breaks during outdoor work.",
                    "Watch for signs of heat exhaustion, such as dizziness or unusual weakness."
            );
            default -> List.of(
                    "Continue normal precautions and drink water regularly.",
                    "Prefer shaded areas when spending long periods outdoors.",
                    "Monitor local weather updates for changing conditions."
            );
        };

        HeatRiskHistory record = new HeatRiskHistory(request.zone().trim(), request.temperature(),
                request.humidity(), request.windSpeed(), risk, explanation, recommendations,
                Instant.now(), username);
        return historyRepository.save(record);
    }

    public record HeatRiskRequest(String zone, double temperature, int humidity, double windSpeed) {}
}
