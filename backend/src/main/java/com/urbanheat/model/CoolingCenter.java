package com.urbanheat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("cooling_centers")
public class CoolingCenter {
    @Id
    private String id;
    private String name;
    private String zone;
    private String address;
    private int capacity;
    private int peoplePresent;
    private String status;
    private boolean waterAvailable;

    public CoolingCenter() {}
    public CoolingCenter(String name, String zone, String address, int capacity, int peoplePresent, String status, boolean waterAvailable) {
        this.name = name; this.zone = zone; this.address = address; this.capacity = capacity;
        this.peoplePresent = peoplePresent; this.status = status; this.waterAvailable = waterAvailable;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public int getPeoplePresent() { return peoplePresent; }
    public void setPeoplePresent(int peoplePresent) { this.peoplePresent = peoplePresent; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isWaterAvailable() { return waterAvailable; }
    public void setWaterAvailable(boolean waterAvailable) { this.waterAvailable = waterAvailable; }
}
