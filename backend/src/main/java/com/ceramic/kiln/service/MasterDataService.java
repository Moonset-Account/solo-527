package com.ceramic.kiln.service;

import com.ceramic.kiln.entity.*;
import com.ceramic.kiln.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MasterDataService {

    private final ClayRepository clayRepository;
    private final GlazeRepository glazeRepository;
    private final FiringCurveRepository firingCurveRepository;
    private final KilnRepository kilnRepository;
    private final StudentRepository studentRepository;

    public List<Clay> getAllClays() {
        return clayRepository.findByIsActiveTrue();
    }

    public List<Glaze> getAllGlazes() {
        return glazeRepository.findByIsActiveTrue();
    }

    public List<FiringCurve> getAllFiringCurves() {
        return firingCurveRepository.findByIsPublicTrue();
    }

    public List<FiringCurve> getFiringCurvesByTemperatureZone(String temperatureZone) {
        return firingCurveRepository.findByTemperatureZoneAndIsPublicTrue(temperatureZone);
    }

    public List<Kiln> getAllKilns() {
        return kilnRepository.findAll();
    }

    public List<Kiln> getKilnsByTemperatureZone(String temperatureZone) {
        return kilnRepository.findByTemperatureZone(temperatureZone);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
}
