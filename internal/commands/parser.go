package commands

import (
	"strings"
	"time"
)

// CommandSource represents where a command comes from
type CommandSource string

const (
	SourceBuiltin CommandSource = "builtin"
	SourceUser    CommandSource = "user"
	SourceProject CommandSource = "project"
)

// Command represents a slash command
type Command struct {
	Path        string            `json:"path"`
	Category    string            `json:"category"`
	Description string            `json:"description"`
	Examples    []string          `json:"examples"`
	Content     string            `json:"content,omitempty"`
	Source      CommandSource     `json:"source"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
}

// CommandGroup groups commands by category
type CommandGroup struct {
	Category  string              `json:"category"`
	Commands  map[string]*Command `json:"commands"`
}

// Parser parses and manages commands
type Parser struct {
	commands map[string]*Command
}

// NewParser creates a new command parser
func NewParser(commands map[string]*Command) *Parser {
	return &Parser{
		commands: commands,
	}
}

// Parse parses a command string
func (p *Parser) Parse(input string) (*Command, string, bool) {
	input = strings.TrimSpace(input)

	// Check if it's a slash command
	if !strings.HasPrefix(input, "/") {
		return nil, "", false
	}

	// Extract command path and arguments
	parts := strings.Fields(input)
	if len(parts) == 0 {
		return nil, "", false
	}

	commandPath := parts[0]
	args := ""
	if len(parts) > 1 {
		args = strings.Join(parts[1:], " ")
	}

	// Find command
	cmd, ok := p.commands[commandPath]
	if !ok {
		return nil, "", false
	}

	return cmd, args, true
}

// GroupByCategory groups commands by category
func (p *Parser) GroupByCategory() []*CommandGroup {
	groups := make(map[string]*CommandGroup)

	for _, cmd := range p.commands {
		if _, ok := groups[cmd.Category]; !ok {
			groups[cmd.Category] = &CommandGroup{
				Category: cmd.Category,
				Commands: make(map[string]*Command),
			}
		}

		groups[cmd.Category].Commands[cmd.Path] = cmd
	}

	result := make([]*CommandGroup, 0, len(groups))
	for _, group := range groups {
		result = append(result, group)
	}

	return result
}

// GetCommand retrieves a command by path
func (p *Parser) GetCommand(path string) (*Command, bool) {
	cmd, ok := p.commands[path]
	return cmd, ok
}
