package com.urbanheat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("weather_records")
public class WeatherRecord {
    @Id
    private String id;
    private String zone;
    private double temperature;
    private int humidity;
    private String recordedAt;
    private String source;

    public WeatherRecord() {}
    public WeatherRecord(String zone, double temperature, int humidity, String recordedAt, String source) {
        this.zone = zone; this.temperature = temperature; this.humidity = humidity;
        this.recordedAt = recordedAt; this.source = source;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }
    public int getHumidity() { return humidity; }
    public void setHumidity(int humidity) { this.humidity = humidity; }
    public String getRecordedAt() { return recordedAt; }
    public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
