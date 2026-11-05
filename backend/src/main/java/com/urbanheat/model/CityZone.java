package com.urbanheat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("zones")
public class CityZone {
    @Id
    private String id;
    private String name;
    private String district;
    private double temperature;
    private int humidity;
    private String riskLevel;
    private int population;
    private String notes;

    public CityZone() {}
    public CityZone(String name, String district, double temperature, int humidity, String riskLevel, int population, String notes) {
        this.name = name; this.district = district; this.temperature = temperature; this.humidity = humidity;
        this.riskLevel = riskLevel; this.population = population; this.notes = notes;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }
    public int getHumidity() { return humidity; }
    public void setHumidity(int humidity) { this.humidity = humidity; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public int getPopulation() { return population; }
    public void setPopulation(int population) { this.population = population; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
