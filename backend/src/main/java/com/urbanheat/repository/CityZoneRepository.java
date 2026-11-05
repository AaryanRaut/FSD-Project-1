package com.urbanheat.repository;
import com.urbanheat.model.CityZone;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface CityZoneRepository extends MongoRepository<CityZone, String> {}
