package com.urbanheat.repository;

import com.urbanheat.model.HeatRiskHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface HeatRiskHistoryRepository extends MongoRepository<HeatRiskHistory, String> {
    List<HeatRiskHistory> findTop50ByOrderByClassifiedAtDesc();
}
