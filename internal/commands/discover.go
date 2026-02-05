package commands

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/WQGroup/logger"
)

// Discoverer discovers slash commands
type Discoverer struct {
	workingDir string
	homeDir    string
}

// NewDiscoverer creates a new command discoverer
func NewDiscoverer(workingDir, homeDir string) *Discoverer {
	return &Discoverer{
		workingDir: workingDir,
		homeDir:    homeDir,
	}
}

// DiscoverAll discovers all commands
func (d *Discoverer) DiscoverAll() (map[string]*Command, error) {
	commands := make(map[string]*Command)

	// 1. Builtin commands
	builtin, err := d.discoverBuiltin()
	if err != nil {
		logger.Warnf("Failed to discover builtin commands: %v", err)
	}
	for k, v := range builtin {
		commands[k] = v
	}

	// 2. User commands
	user, err := d.discoverUserCommands()
	if err != nil {
		logger.Warnf("Failed to discover user commands: %v", err)
	}
	for k, v := range user {
		commands[k] = v
	}

	// 3. Project commands
	project, err := d.discoverProjectCommands()
	if err != nil {
		logger.Warnf("Failed to discover project commands: %v", err)
	}
	for k, v := range project {
		commands[k] = v
	}

	logger.Infof("Discovered %d commands", len(commands))
	return commands, nil
}

// discoverBuiltin discovers builtin commands
func (d *Discoverer) discoverBuiltin() (map[string]*Command, error) {
	builtins := []struct {
		path     string
		category string
		desc     string
		examples []string
	}{
		{"/help", "core", "Show help", []string{"/help"}},
		{"/clear", "core", "Clear conversation", []string{"/clear"}},
		{"/exit", "core", "Exit Claude", []string{"/exit"}},
		{"/commit", "git", "Create a git commit", []string{"/commit", "/commit Fix bug"}},
		{"/test", "dev", "Run tests", []string{"/test", "/test ./..."}},
	}

	commands := make(map[string]*Command)
	for _, b := range builtins {
		commands[b.path] = &Command{
			Path:        b.path,
			Category:    b.category,
			Description: b.desc,
			Examples:    b.examples,
			Source:      SourceBuiltin,
			CreatedAt:   time.Now(),
		}
	}

	return commands, nil
}

// discoverUserCommands discovers user commands
func (d *Discoverer) discoverUserCommands() (map[string]*Command, error) {
	userCmdDir := filepath.Join(d.homeDir, ".claude", "commands")
	return d.discoverFromDirectory(userCmdDir, SourceUser)
}

// discoverProjectCommands discovers project commands
func (d *Discoverer) discoverProjectCommands() (map[string]*Command, error) {
	projectCmdDir := filepath.Join(d.workingDir, ".claude", "commands")
	return d.discoverFromDirectory(projectCmdDir, SourceProject)
}

// discoverFromDirectory discovers commands from a directory
func (d *Discoverer) discoverFromDirectory(dir string, source CommandSource) (map[string]*Command, error) {
	commands := make(map[string]*Command)

	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return commands, nil
		}
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			// Recursively scan subdirectories
			subdir := filepath.Join(dir, entry.Name())
			subcommands, err := d.discoverFromDirectory(subdir, source)
			if err != nil {
				logger.Warnf("Failed to read subdir %s: %v", subdir, err)
				continue
			}
			for k, v := range subcommands {
				commands[k] = v
			}
		}

		if !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}

		// Parse markdown file
		filepath := filepath.Join(dir, entry.Name())
		cmd, err := d.parseCommandFile(filepath, source)
		if err != nil {
			logger.Warnf("Failed to parse %s: %v", filepath, err)
			continue
		}

		commands[cmd.Path] = cmd
	}

	return commands, nil
}

// parseCommandFile parses a command file
func (d *Discoverer) parseCommandFile(filePath string, source CommandSource) (*Command, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var inFrontmatter bool
	var frontmatter []string
	var content []string

	for scanner.Scan() {
		line := scanner.Text()

		if line == "---" {
			inFrontmatter = !inFrontmatter
			continue
		}

		if inFrontmatter {
			frontmatter = append(frontmatter, line)
		} else {
			content = append(content, line)
		}
	}

	// Parse frontmatter
	cmd := &Command{
		Source:    source,
		Content:   strings.Join(content, "\n"),
		CreatedAt: time.Now(),
	}

	for _, line := range frontmatter {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		switch key {
		case "path":
			cmd.Path = value
		case "category":
			cmd.Category = value
		case "description":
			cmd.Description = value
		case "examples":
			// Simple parsing
			cmd.Examples = []string{value}
		}
	}

	// Infer path from filename if not set
	if cmd.Path == "" {
		filename := filepath.Base(filePath)
		cmd.Path = "/" + strings.TrimSuffix(filename, ".md")
	}

	return cmd, nil
}
