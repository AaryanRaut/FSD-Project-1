package com.urbanheat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document(collection = "heat_risk_history")
public class HeatRiskHistory {
    @Id private String id;
    private String zone;
    private double temperature;
    private int humidity;
    private double windSpeed;
    private String riskLevel;
    private String explanation;
    private List<String> recommendations;
    private Instant classifiedAt;
    private String classifiedBy;

    public HeatRiskHistory() {}
    public HeatRiskHistory(String zone, double temperature, int humidity, double windSpeed,
                           String riskLevel, String explanation, List<String> recommendations,
                           Instant classifiedAt, String classifiedBy) {
        this.zone = zone; this.temperature = temperature; this.humidity = humidity;
        this.windSpeed = windSpeed; this.riskLevel = riskLevel; this.explanation = explanation;
        this.recommendations = recommendations; this.classifiedAt = classifiedAt;
        this.classifiedBy = classifiedBy;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }
    public int getHumidity() { return humidity; }
    public void setHumidity(int humidity) { this.humidity = humidity; }
    public double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(double windSpeed) { this.windSpeed = windSpeed; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    public Instant getClassifiedAt() { return classifiedAt; }
    public void setClassifiedAt(Instant classifiedAt) { this.classifiedAt = classifiedAt; }
    public String getClassifiedBy() { return classifiedBy; }
    public void setClassifiedBy(String classifiedBy) { this.classifiedBy = classifiedBy; }
}
