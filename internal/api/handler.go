package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"time"

	"calculator/internal/calculator"
)

const (
	maxRequestBodyBytes = 4096
	maxExpressionLength = 500
	requestIDBytes      = 8
)

type calculateRequest struct {
	Expression string `json:"expression"`
}
type calculateResponse struct {
	Expression string  `json:"expression"`
	Result     float64 `json:"result"`
}
type errorResponse struct {
	Code  string `json:"code"`
	Error string `json:"error"`
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", health)
	mux.HandleFunc("POST /api/calculate", calculate)
	return withRequestLogging(withCORS(mux))
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func withRequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		requestID := newRequestID()
		w.Header().Set("X-Request-ID", requestID)
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, r)
		log.Printf("request_id=%s method=%s path=%s status=%d duration_ms=%d", requestID, r.Method, r.URL.Path, recorder.status, time.Since(started).Milliseconds())
	})
}

func newRequestID() string {
	randomBytes := make([]byte, requestIDBytes)
	if _, err := rand.Read(randomBytes); err != nil {
		return "unavailable"
	}
	return hex.EncodeToString(randomBytes)
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var request calculateRequest
	if err := decoder.Decode(&request); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Code: "invalid_request", Error: "request body must be valid JSON with an expression field"})
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		writeJSON(w, http.StatusBadRequest, errorResponse{Code: "invalid_request", Error: "request body must contain one JSON object"})
		return
	}
	if len([]rune(request.Expression)) > maxExpressionLength {
		writeJSON(w, http.StatusBadRequest, errorResponse{Code: "expression_too_long", Error: "expression must be 500 characters or fewer"})
		return
	}
	result, err := calculator.Evaluate(request.Expression)
	if err != nil {
		var expressionError *calculator.Error
		if errors.As(err, &expressionError) {
			writeJSON(w, http.StatusUnprocessableEntity, errorResponse{Code: "invalid_expression", Error: err.Error()})
			return
		}
		writeJSON(w, http.StatusInternalServerError, errorResponse{Code: "calculation_failed", Error: "calculation failed"})
		return
	}
	writeJSON(w, http.StatusOK, calculateResponse{Expression: request.Expression, Result: result})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" || origin == "http://127.0.0.1:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
