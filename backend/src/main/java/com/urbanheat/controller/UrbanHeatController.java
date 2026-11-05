package com.urbanheat.controller;

import com.urbanheat.model.*;
import com.urbanheat.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class UrbanHeatController {
    private final CityZoneRepository zones;
    private final HeatHotspotRepository hotspots;
    private final CoolingCenterRepository centers;
    private final WeatherRecordRepository weather;

    public UrbanHeatController(CityZoneRepository zones, HeatHotspotRepository hotspots,
                               CoolingCenterRepository centers, WeatherRecordRepository weather) {
        this.zones = zones; this.hotspots = hotspots; this.centers = centers; this.weather = weather;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "application", "UrbanHeat API");
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        List<CityZone> zoneList = zones.findAll();
        List<HeatHotspot> hotspotList = hotspots.findAll();
        List<CoolingCenter> centerList = centers.findAll();
        long highRisk = zoneList.stream().filter(z -> "High".equalsIgnoreCase(z.getRiskLevel()) || "Critical".equalsIgnoreCase(z.getRiskLevel())).count();
        int available = (int) centerList.stream().filter(c -> "Open".equalsIgnoreCase(c.getStatus())).count();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cityName", "UrbanHeat City Operations");
        result.put("zoneCount", zoneList.size());
        result.put("hotspotCount", hotspotList.size());
        result.put("highRiskZones", highRisk);
        result.put("openCoolingCenters", available);
        result.put("zones", zoneList);
        result.put("hotspots", hotspotList);
        result.put("coolingCenters", centerList);
        return result;
    }

    @GetMapping("/zones")
    public List<CityZone> getZones() { return zones.findAll(); }

    @GetMapping("/hotspots")
    public List<HeatHotspot> getHotspots() { return hotspots.findAll(); }

    @GetMapping("/cooling-centers")
    public List<CoolingCenter> getCoolingCenters() { return centers.findAll(); }

    @PostMapping("/cooling-centers")
    @ResponseStatus(HttpStatus.CREATED)
    public CoolingCenter addCoolingCenter(@RequestBody CoolingCenter center) {
        if (center.getName() == null || center.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cooling center name is required");
        }
        if (center.getStatus() == null || center.getStatus().isBlank()) center.setStatus("Open");
        return centers.save(center);
    }

    @GetMapping("/weather")
    public List<WeatherRecord> getWeather() { return weather.findAll(); }
}
