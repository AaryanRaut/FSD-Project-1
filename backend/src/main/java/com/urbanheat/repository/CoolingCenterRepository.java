package com.urbanheat.repository;
import com.urbanheat.model.CoolingCenter;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface CoolingCenterRepository extends MongoRepository<CoolingCenter, String> {}
