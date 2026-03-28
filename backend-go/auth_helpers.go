package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
)

const (
	authUserKey = "authUserID"
)

func tokenForUser(id uint) string {
	return fmt.Sprintf("mock-token-%d", id)
}

func parseMockToken(token string) (uint, error) {
	if !strings.HasPrefix(token, "mock-token-") {
		return 0, fmt.Errorf("invalid token")
	}
	idPart := strings.TrimPrefix(token, "mock-token-")
	id, err := strconv.ParseUint(idPart, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func generateOTPCode() (string, error) {
	digits := make([]byte, 4)
	for i := range digits {
		b := make([]byte, 1)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		digits[i] = '0' + (b[0] % 10)
	}
	return string(digits), nil
}

func isProfileCompleted(user User) bool {
	if user.Name == "" || user.Email == nil {
		return false
	}
	return strings.TrimSpace(*user.Email) != ""
}

func hashPartnerKey(value string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(value)))
	return hex.EncodeToString(sum[:])
}
