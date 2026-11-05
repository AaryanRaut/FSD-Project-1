package com.urbanheat.config;

import com.urbanheat.model.*;
import com.urbanheat.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Configuration
public class DemoDataLoader {
    @Bean
    CommandLineRunner seedDemoData(CityZoneRepository zones, HeatHotspotRepository hotspots,
                                   CoolingCenterRepository centers, WeatherRecordRepository weather) {
        return args -> {
            if (zones.count() == 0) {
                zones.saveAll(List.of(
                    new CityZone("Central District", "Central", 41.5, 48, "Critical", 185000, "Dense construction and limited tree cover"),
                    new CityZone("Riverside", "East", 38.2, 61, "Moderate", 92000, "Mixed residential and park areas"),
                    new CityZone("Industrial Belt", "North", 42.1, 39, "High", 127000, "Industrial surfaces and low shade"),
                    new CityZone("Green Park", "South", 36.8, 58, "Low", 76000, "More tree cover and open space"),
                    new CityZone("Old Town", "West", 40.3, 52, "High", 143000, "Crowded streets and older buildings")
                ));
            }
            if (hotspots.count() == 0) {
                hotspots.saveAll(List.of(
                    new HeatHotspot("Market Junction", "Central District", 43.0, "Critical", "Dense paving and traffic", 47, 35),
                    new HeatHotspot("Factory Road", "Industrial Belt", 42.1, "High", "Industrial roofs", 73, 24),
                    new HeatHotspot("Old Bus Depot", "Old Town", 41.0, "High", "Limited shade", 25, 61),
                    new HeatHotspot("Riverside Crossing", "Riverside", 38.2, "Moderate", "Road traffic", 65, 70)
                ));
            }
            if (centers.count() == 0) {
                centers.saveAll(List.of(
                    new CoolingCenter("Civic Community Hall", "Central District", "12 Civic Square", 120, 64, "Open", true),
                    new CoolingCenter("North Ward Library", "Industrial Belt", "8 Foundry Avenue", 80, 80, "Full", true),
                    new CoolingCenter("Green Park Recreation Center", "Green Park", "3 Garden Road", 100, 28, "Open", true),
                    new CoolingCenter("Old Town Health Post", "Old Town", "21 Heritage Street", 50, 19, "Open", false)
                ));
            }
            if (weather.count() == 0) {
                String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                weather.saveAll(List.of(
                    new WeatherRecord("Central District", 41.5, 48, now, "Demo sample"),
                    new WeatherRecord("Riverside", 38.2, 61, now, "Demo sample"),
                    new WeatherRecord("Industrial Belt", 42.1, 39, now, "Demo sample"),
                    new WeatherRecord("Green Park", 36.8, 58, now, "Demo sample"),
                    new WeatherRecord("Old Town", 40.3, 52, now, "Demo sample")
                ));
            }
        };
    }
}
