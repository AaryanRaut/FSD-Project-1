package com.urbanheat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class AppUser {
    @Id private String id;
    private String username;
    private String password;
    private String displayName;
    private String role;
    public AppUser() {}
    public AppUser(String username, String password, String displayName, String role) {
        this.username = username; this.password = password; this.displayName = displayName; this.role = role;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
