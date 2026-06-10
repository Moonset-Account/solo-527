package com.energy.dashboard.service;

import java.util.Map;

public interface AuthService {

    Map<String, Object> login(String username, String password);

    void logout();
}
