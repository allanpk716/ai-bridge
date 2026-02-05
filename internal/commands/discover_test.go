package commands

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewDiscoverer(t *testing.T) {
	d := NewDiscoverer("/tmp", "/home/user")

	require.NotNil(t, d)
	assert.Equal(t, "/tmp", d.workingDir)
}

func TestDiscoverer_DiscoverBuiltin(t *testing.T) {
	d := NewDiscoverer("/tmp", "/home/user")

	commands, err := d.discoverBuiltin()
	require.NoError(t, err)
	assert.Greater(t, len(commands), 0)

	// Check for known commands
	_, exists := commands["/help"]
	assert.True(t, exists, "help command should exist")
}

func TestDiscoverer_DiscoverFromDirectory(t *testing.T) {
	// Create temp directory with test commands
	tmpDir := t.TempDir()

	// Create test command file
	cmdFile := filepath.Join(tmpDir, "testcmd.md")
	content := `---
path: /testcmd
category: test
description: Test command
examples:
  - /testcmd
---
This is a test command.
`
	err := os.WriteFile(cmdFile, []byte(content), 0644)
	require.NoError(t, err)

	d := NewDiscoverer(tmpDir, "/home/user")
	commands, err := d.discoverFromDirectory(tmpDir, SourceProject)

	require.NoError(t, err)
	assert.Equal(t, 1, len(commands))

	cmd := commands["/testcmd"]
	assert.Equal(t, "test", cmd.Category)
	assert.Equal(t, "Test command", cmd.Description)
}

func TestParser_Parse(t *testing.T) {
	commands := map[string]*Command{
		"/test": {
			Path:        "/test",
			Description: "Test command",
			Category:    "test",
			Source:      SourceBuiltin,
			CreatedAt:   time.Now(),
		},
	}

	parser := NewParser(commands)

	// Valid command
	cmd, args, ok := parser.Parse("/test arg1 arg2")
	require.True(t, ok)
	assert.Equal(t, "/test", cmd.Path)
	assert.Equal(t, "arg1 arg2", args)

	// Invalid command
	_, _, ok = parser.Parse("not a command")
	assert.False(t, ok)
}

func TestParser_GroupByCategory(t *testing.T) {
	commands := map[string]*Command{
		"/test1": {
			Path:     "/test1",
			Category: "cat1",
			Source:   SourceBuiltin,
			CreatedAt: time.Now(),
		},
		"/test2": {
			Path:     "/test2",
			Category: "cat1",
			Source:   SourceBuiltin,
			CreatedAt: time.Now(),
		},
		"/test3": {
			Path:     "/test3",
			Category: "cat2",
			Source:   SourceBuiltin,
			CreatedAt: time.Now(),
		},
	}

	parser := NewParser(commands)
	groups := parser.GroupByCategory()

	assert.Equal(t, 2, len(groups))

	// Verify categories
	catMap := make(map[string]bool)
	for _, g := range groups {
		catMap[g.Category] = true
	}

	assert.True(t, catMap["cat1"])
	assert.True(t, catMap["cat2"])
}
