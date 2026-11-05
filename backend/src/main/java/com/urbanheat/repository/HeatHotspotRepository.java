package com.urbanheat.repository;
import com.urbanheat.model.HeatHotspot;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface HeatHotspotRepository extends MongoRepository<HeatHotspot, String> {}
