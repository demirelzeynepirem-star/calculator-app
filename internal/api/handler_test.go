package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculate(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/calculate", bytes.NewBufferString(`{"expression":"3 + 5 * 2"}`))
	response := httptest.NewRecorder()
	NewHandler().ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", response.Code, response.Body)
	}
	var body struct {
		Result float64 `json:"result"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Result != 13 {
		t.Errorf("result = %v, want 13", body.Result)
	}
	if response.Header().Get("X-Request-ID") == "" {
		t.Error("X-Request-ID header is missing")
	}
}

func TestCalculateBadInput(t *testing.T) {
	tests := []struct {
		name, body string
		status     int
	}{
		{"bad json", `{`, http.StatusBadRequest},
		{"unknown field", `{"value":"2+2"}`, http.StatusBadRequest},
		{"trailing data", `{"expression":"2+2"} true`, http.StatusBadRequest},
		{"bad expression", `{"expression":"1/0"}`, http.StatusUnprocessableEntity},
		{"too long", `{"expression":"` + strings.Repeat("1", 501) + `"}`, http.StatusBadRequest},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/calculate", bytes.NewBufferString(tt.body))
			response := httptest.NewRecorder()
			NewHandler().ServeHTTP(response, request)
			if response.Code != tt.status {
				t.Errorf("status = %d, want %d", response.Code, tt.status)
			}
		})
	}
}

func TestCalculateErrorHasMachineReadableCode(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/calculate", bytes.NewBufferString(`{"expression":"1/0"}`))
	response := httptest.NewRecorder()
	NewHandler().ServeHTTP(response, request)

	var body errorResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "invalid_expression" {
		t.Errorf("code = %q, want invalid_expression", body.Code)
	}
}

func TestCORS(t *testing.T) {
	tests := []struct {
		origin, want string
	}{
		{"http://localhost:5173", "http://localhost:5173"},
		{"https://example.com", ""},
	}
	for _, tt := range tests {
		t.Run(tt.origin, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodOptions, "/api/calculate", nil)
			request.Header.Set("Origin", tt.origin)
			response := httptest.NewRecorder()
			NewHandler().ServeHTTP(response, request)
			if got := response.Header().Get("Access-Control-Allow-Origin"); got != tt.want {
				t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, tt.want)
			}
		})
	}
}
