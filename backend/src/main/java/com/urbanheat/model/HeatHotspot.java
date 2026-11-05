package com.urbanheat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("hotspots")
public class HeatHotspot {
    @Id
    private String id;
    private String name;
    private String zone;
    private double temperature;
    private String severity;
    private String cause;
    private double x;
    private double y;

    public HeatHotspot() {}
    public HeatHotspot(String name, String zone, double temperature, String severity, String cause, double x, double y) {
        this.name = name; this.zone = zone; this.temperature = temperature; this.severity = severity;
        this.cause = cause; this.x = x; this.y = y;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getCause() { return cause; }
    public void setCause(String cause) { this.cause = cause; }
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }
}
