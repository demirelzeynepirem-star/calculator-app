package calculator

import (
	"math"
	"testing"
)

func TestEvaluate(t *testing.T) {
	tests := []struct {
		name, expression string
		want             float64
	}{
		{"precedence", "3 + 5 * 2", 13},
		{"parentheses", "(3 + 5) * 2", 16},
		{"decimals", "2.5 * 4 - 1", 9},
		{"unary", "-3 + +5", 2},
		{"power", "2 ^ 3 ^ 2", 512},
		{"negative exponent", "2 ^ -2", .25},
		{"unary below power", "-2 ^ 2", -4},
		{"parenthesized negative power", "(-2) ^ 2", 4},
		{"square root", "sqrt(81) + 1", 10},
		{"percentage", "25% * 200", 50},
		{"unicode whitespace", "1\u00a0+\u20032", 3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Evaluate(tt.expression)
			if err != nil {
				t.Fatalf("Evaluate() error = %v", err)
			}
			if math.Abs(got-tt.want) > 1e-10 {
				t.Errorf("Evaluate() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestEvaluateErrors(t *testing.T) {
	for _, expression := range []string{"", "1 / 0", "0 ^ -1", "2 ^ 1024", "sqrt(-1)", "2 +", "(1 + 2", "hello", ".", "1..2"} {
		t.Run(expression, func(t *testing.T) {
			if _, err := Evaluate(expression); err == nil {
				t.Fatalf("Evaluate(%q) expected error", expression)
			}
		})
	}
}

func FuzzEvaluateDoesNotPanic(f *testing.F) {
	for _, expression := range []string{"1 + 2", "sqrt(81)", "2 ^ 3 ^ 2", "((((1))))", "\u20031 / 0"} {
		f.Add(expression)
	}
	f.Fuzz(func(t *testing.T, expression string) {
		if len([]rune(expression)) > 500 {
			t.Skip()
		}
		_, _ = Evaluate(expression)
	})
}
