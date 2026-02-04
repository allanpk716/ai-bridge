package commands

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/WQGroup/logger"
)

// Command represents a slash command
type Command struct {
	Name        string   `yaml:"name"`
	Category    string   `yaml:"category"`
	Description string   `yaml:"description"`
	Examples    []string `yaml:"examples"`
	Content     string   `yaml:"content"`
}

// Discoverer discovers slash commands
type Discoverer struct {
	workingDir string
}

// NewDiscoverer creates a new command discoverer
func NewDiscoverer(workingDir string) *Discoverer {
	return &Discoverer{
		workingDir: workingDir,
	}
}

// DiscoverAll discovers all commands
func (d *Discoverer) DiscoverAll() map[string][]Command {
	commands := make(map[string][]Command)

	// Discover builtin commands
	builtin := d.discoverBuiltin()
	commands["builtin"] = builtin

	// Discover user commands
	user := d.discoverUserCommands()
	if len(user) > 0 {
		commands["user"] = user
	}

	// Discover project commands
	project := d.discoverProjectCommands()
	if len(project) > 0 {
		commands["project"] = project
	}

	logger.Infof("Discovered %d command categories", len(commands))
	return commands
}

// discoverBuiltin returns builtin commands
func (d *Discoverer) discoverBuiltin() []Command {
	return []Command{
		{
			Name:        "help",
			Category:    "builtin",
			Description: "Show help information",
			Examples:    []string{"/help"},
		},
		{
			Name:        "clear",
			Category:    "builtin",
			Description: "Clear the terminal",
			Examples:    []string{"/clear"},
		},
	}
}

// discoverUserCommands discovers user commands from ~/.claude/commands
func (d *Discoverer) discoverUserCommands() []Command {
	homeDir, _ := os.UserHomeDir()
	commandsDir := filepath.Join(homeDir, ".claude", "commands")
	return d.discoverFromDirectory(commandsDir)
}

// discoverProjectCommands discovers project commands
func (d *Discoverer) discoverProjectCommands() []Command {
	commandsDir := filepath.Join(d.workingDir, ".claude", "commands")
	return d.discoverFromDirectory(commandsDir)
}

// discoverFromDirectory discovers commands from a directory
func (d *Discoverer) discoverFromDirectory(dir string) []Command {
	var commands []Command

	entries, err := os.ReadDir(dir)
	if err != nil {
		return commands
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		if !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}

		cmd, err := d.parseCommandFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			logger.Warnf("Failed to parse command file %s: %v", entry.Name(), err)
			continue
		}

		commands = append(commands, cmd)
	}

	return commands
}

// parseCommandFile parses a command markdown file
func (d *Discoverer) parseCommandFile(path string) (Command, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return Command{}, err
	}

	// Simple parsing - in production, use proper frontmatter parser
	lines := strings.Split(string(content), "\n")

	cmd := Command{
		Name:     strings.TrimSuffix(filepath.Base(path), ".md"),
		Category: "user",
		Content:  string(content),
	}

	// Extract frontmatter
	inFrontmatter := false
	for _, line := range lines {
		if strings.HasPrefix(line, "---") {
			inFrontmatter = !inFrontmatter
			continue
		}

		if inFrontmatter {
			if strings.HasPrefix(line, "description:") {
				cmd.Description = strings.TrimSpace(strings.TrimPrefix(line, "description:"))
			} else if strings.HasPrefix(line, "category:") {
				cmd.Category = strings.TrimSpace(strings.TrimPrefix(line, "category:"))
			}
		}
	}

	return cmd, nil
}
