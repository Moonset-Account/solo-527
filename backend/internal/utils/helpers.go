package utils

import (
	"encoding/json"
	"math"
)

const MinTemperature = 2.0
const MaxTemperature = 8.0

func IsTemperatureNormal(temp float64) bool {
	return temp >= MinTemperature && temp <= MaxTemperature
}

func ParseJSONStringArray(jsonStr string) []string {
	var result []string
	err := json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		return []string{}
	}
	return result
}

func RoundFloat(val float64, precision int) float64 {
	ratio := math.Pow(10, float64(precision))
	return math.Round(val*ratio) / ratio
}

func StringPtr(s string) *string {
	return &s
}

func TimePtr(t interface{}) *interface{} {
	return &t
}

func BoolPtr(b bool) *bool {
	return &b
}
