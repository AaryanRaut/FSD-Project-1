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
        this.zones = zones;
        this.hotspots = hotspots;
        this.centers = centers;
        this.weather = weather;
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
        long highRisk = zoneList.stream()
                .filter(z -> "High".equalsIgnoreCase(z.getRiskLevel())
                        || "Critical".equalsIgnoreCase(z.getRiskLevel()))
                .count();
        int available = (int) centerList.stream()
                .filter(c -> "Open".equalsIgnoreCase(c.getStatus())).count();

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

    // City Zone CRUD
    @GetMapping("/zones")
    public List<CityZone> getZones() {
        return zones.findAll();
    }

    @GetMapping("/zones/{id}")
    public CityZone getZone(@PathVariable String id) {
        return zones.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "City zone not found"));
    }

    @PostMapping("/zones")
    @ResponseStatus(HttpStatus.CREATED)
    public CityZone addZone(@RequestBody CityZone zone) {
        validateZone(zone);
        zone.setId(null);
        return zones.save(zone);
    }

    @PutMapping("/zones/{id}")
    public CityZone updateZone(@PathVariable String id, @RequestBody CityZone updatedZone) {
        validateZone(updatedZone);
        CityZone existing = zones.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "City zone not found"));
        String oldName = existing.getName();
        String newName = updatedZone.getName();
        updatedZone.setId(existing.getId());
        CityZone saved = zones.save(updatedZone);

        // Keep records linked by the zone name in sync if the zone is renamed.
        if (oldName != null && !oldName.equals(newName)) {
            List<HeatHotspot> linkedHotspots = hotspots.findAll().stream()
                    .filter(h -> oldName.equals(h.getZone())).toList();
            linkedHotspots.forEach(h -> h.setZone(newName));
            hotspots.saveAll(linkedHotspots);

            List<CoolingCenter> linkedCenters = centers.findAll().stream()
                    .filter(c -> oldName.equals(c.getZone())).toList();
            linkedCenters.forEach(c -> c.setZone(newName));
            centers.saveAll(linkedCenters);

            List<WeatherRecord> linkedWeather = weather.findAll().stream()
                    .filter(w -> oldName.equals(w.getZone())).toList();
            linkedWeather.forEach(w -> w.setZone(newName));
            weather.saveAll(linkedWeather);
        }
        return saved;
    }

    @DeleteMapping("/zones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteZone(@PathVariable String id) {
        if (!zones.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "City zone not found");
        }
        zones.deleteById(id);
    }

    private void validateZone(CityZone zone) {
        if (zone.getName() == null || zone.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zone name is required");
        }
        if (zone.getRiskLevel() == null || zone.getRiskLevel().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Risk level is required");
        }
        if (zone.getTemperature() < -20 || zone.getTemperature() > 70) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Temperature must be between -20 and 70");
        }
        if (zone.getHumidity() < 0 || zone.getHumidity() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Humidity must be between 0 and 100");
        }
        if (zone.getPopulation() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Population cannot be negative");
        }
    }

    // Heat Hotspot CRUD
    @GetMapping("/hotspots")
    public List<HeatHotspot> getHotspots() {
        return hotspots.findAll();
    }

    @GetMapping("/hotspots/{id}")
    public HeatHotspot getHotspot(@PathVariable String id) {
        return hotspots.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Heat hotspot not found"));
    }

    @PostMapping("/hotspots")
    @ResponseStatus(HttpStatus.CREATED)
    public HeatHotspot addHotspot(@RequestBody HeatHotspot hotspot) {
        validateHotspot(hotspot);
        hotspot.setId(null);
        return hotspots.save(hotspot);
    }

    @PutMapping("/hotspots/{id}")
    public HeatHotspot updateHotspot(@PathVariable String id, @RequestBody HeatHotspot updatedHotspot) {
        validateHotspot(updatedHotspot);
        HeatHotspot existing = hotspots.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Heat hotspot not found"));
        updatedHotspot.setId(existing.getId());
        return hotspots.save(updatedHotspot);
    }

    @DeleteMapping("/hotspots/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHotspot(@PathVariable String id) {
        if (!hotspots.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Heat hotspot not found");
        }
        hotspots.deleteById(id);
    }

    private void validateHotspot(HeatHotspot hotspot) {
        if (hotspot.getName() == null || hotspot.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hotspot name is required");
        }
        if (hotspot.getZone() == null || hotspot.getZone().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A city zone is required");
        }
        if (hotspot.getTemperature() < -20 || hotspot.getTemperature() > 70) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Temperature must be between -20 and 70");
        }
        if (hotspot.getSeverity() == null || hotspot.getSeverity().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Severity is required");
        }
    }

    // Existing Cooling Center and Weather functionality
    @GetMapping("/cooling-centers")
    public List<CoolingCenter> getCoolingCenters() {
        return centers.findAll();
    }

    @GetMapping("/cooling-centers/{id}")
    public CoolingCenter getCoolingCenter(@PathVariable String id) {
        return centers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling center not found"));
    }

    @PostMapping("/cooling-centers")
    @ResponseStatus(HttpStatus.CREATED)
    public CoolingCenter addCoolingCenter(@RequestBody CoolingCenter center) {
        validateCoolingCenter(center);
        center.setId(null);
        return centers.save(center);
    }

    @PutMapping("/cooling-centers/{id}")
    public CoolingCenter updateCoolingCenter(@PathVariable String id, @RequestBody CoolingCenter updated) {
        validateCoolingCenter(updated);
        CoolingCenter existing = centers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling center not found"));
        updated.setId(existing.getId());
        return centers.save(updated);
    }

    @DeleteMapping("/cooling-centers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCoolingCenter(@PathVariable String id) {
        if (!centers.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling center not found");
        centers.deleteById(id);
    }

    private void validateCoolingCenter(CoolingCenter center) {
        if (center.getName() == null || center.getName().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cooling center name is required");
        if (center.getZone() == null || center.getZone().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zone is required");
        if (center.getCapacity() < 1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacity must be at least 1");
        if (center.getPeoplePresent() < 0 || center.getPeoplePresent() > center.getCapacity()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "People present must be between 0 and capacity");
        center.setStatus(center.getPeoplePresent() >= center.getCapacity() ? "Full" : "Open");
    }

    @GetMapping("/weather")
    public List<WeatherRecord> getWeather() {
        return weather.findAll();
    }
}
