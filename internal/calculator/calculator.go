// Package calculator solves simple math expressions without running them as code.
package calculator

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"unicode"
)

// Error describes a problem in an expression that the user can fix.
type Error struct {
	Position int
	Message  string
}

func (e *Error) Error() string {
	return fmt.Sprintf("%s at position %d", e.Message, e.Position+1)
}

// Evaluate reads a math expression and calculates its result.
// It supports +, -, *, /, ^, brackets, sqrt(...), positive and negative numbers,
// and % after a value to divide it by 100.
func Evaluate(expression string) (float64, error) {
	if strings.TrimSpace(expression) == "" {
		return 0, &Error{Message: "expression is required"}
	}
	p := parser{input: []rune(expression)}
	result, err := p.parseExpression()
	if err != nil {
		return 0, err
	}
	p.skipSpaces()
	if !p.atEnd() {
		return 0, p.errorf("unexpected character %q", p.peek())
	}
	if math.IsInf(result, 0) || math.IsNaN(result) {
		return 0, &Error{Position: p.pos, Message: "result is not a finite number"}
	}
	return result, nil
}

type parser struct {
	input []rune
	pos   int
}

func (p *parser) parseExpression() (float64, error) {
	left, err := p.parseTerm()
	if err != nil {
		return 0, err
	}
	for {
		p.skipSpaces()
		op := p.peek()
		if op != '+' && op != '-' {
			return left, nil
		}
		p.pos++
		right, err := p.parseTerm()
		if err != nil {
			return 0, err
		}
		if op == '+' {
			left += right
		} else {
			left -= right
		}
	}
}

func (p *parser) parseTerm() (float64, error) {
	left, err := p.parseUnary()
	if err != nil {
		return 0, err
	}
	for {
		p.skipSpaces()
		op := p.peek()
		if op != '*' && op != '/' {
			return left, nil
		}
		operatorPosition := p.pos
		p.pos++
		right, err := p.parseUnary()
		if err != nil {
			return 0, err
		}
		if op == '/' {
			if right == 0 {
				return 0, &Error{Position: operatorPosition, Message: "division by zero"}
			}
			left /= right
		} else {
			left *= right
		}
	}
}

func (p *parser) parseUnary() (float64, error) {
	p.skipSpaces()
	if p.consume('+') {
		return p.parseUnary()
	}
	if p.consume('-') {
		value, err := p.parseUnary()
		return -value, err
	}
	return p.parsePower()
}

// Calculate powers from right to left: 2^3^2 means 2^(3^2).
func (p *parser) parsePower() (float64, error) {
	left, err := p.parsePostfix()
	if err != nil {
		return 0, err
	}
	p.skipSpaces()
	if !p.consume('^') {
		return left, nil
	}
	right, err := p.parseUnary()
	if err != nil {
		return 0, err
	}
	return math.Pow(left, right), nil
}

func (p *parser) parsePostfix() (float64, error) {
	value, err := p.parsePrimary()
	if err != nil {
		return 0, err
	}
	for {
		p.skipSpaces()
		if !p.consume('%') {
			return value, nil
		}
		value /= 100
	}
}

func (p *parser) parsePrimary() (float64, error) {
	p.skipSpaces()
	start := p.pos
	if p.consume('(') {
		value, err := p.parseExpression()
		if err != nil {
			return 0, err
		}
		p.skipSpaces()
		if !p.consume(')') {
			return 0, p.errorf("expected closing parenthesis")
		}
		return value, nil
	}
	if p.hasWord("sqrt") {
		p.pos += len("sqrt")
		p.skipSpaces()
		if !p.consume('(') {
			return 0, p.errorf("expected opening parenthesis after sqrt")
		}
		value, err := p.parseExpression()
		if err != nil {
			return 0, err
		}
		p.skipSpaces()
		if !p.consume(')') {
			return 0, p.errorf("expected closing parenthesis")
		}
		if value < 0 {
			return 0, &Error{Position: start, Message: "square root of a negative number"}
		}
		return math.Sqrt(value), nil
	}
	return p.parseNumber()
}

func (p *parser) parseNumber() (float64, error) {
	p.skipSpaces()
	start := p.pos
	dots := 0
	for !p.atEnd() {
		c := p.peek()
		if c == '.' {
			dots++
			p.pos++
			continue
		}
		if c < '0' || c > '9' {
			break
		}
		p.pos++
	}
	if start == p.pos || dots > 1 {
		if p.atEnd() {
			return 0, p.errorf("expected a number")
		}
		return 0, p.errorf("expected a number, parenthesis, or sqrt")
	}
	value, err := strconv.ParseFloat(string(p.input[start:p.pos]), 64)
	if err != nil {
		return 0, &Error{Position: start, Message: "invalid number"}
	}
	return value, nil
}

func (p *parser) skipSpaces() {
	for !p.atEnd() && unicode.IsSpace(p.peek()) {
		p.pos++
	}
}
func (p *parser) atEnd() bool { return p.pos >= len(p.input) }
func (p *parser) peek() rune {
	if p.atEnd() {
		return 0
	}
	return p.input[p.pos]
}
func (p *parser) consume(want rune) bool {
	if p.peek() != want {
		return false
	}
	p.pos++
	return true
}
func (p *parser) hasWord(word string) bool { return strings.HasPrefix(string(p.input[p.pos:]), word) }
func (p *parser) errorf(format string, args ...any) error {
	return &Error{Position: p.pos, Message: fmt.Sprintf(format, args...)}
}
