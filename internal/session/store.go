package session

import (
	"database/sql"
	"time"

	"gorm.io/gorm"
	"gorm.io/driver/sqlite"
	"github.com/WQGroup/logger"
	_ "modernc.org/sqlite"
)

// BaseModel base model for all entities
type BaseModel struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"index"`
	UpdatedAt time.Time `gorm:"index"`
}

// SessionDB database session model
type SessionDB struct {
	BaseModel
	SessionID    string `gorm:"uniqueIndex;size:64"`
	Status       string `gorm:"index;size:32"`
	WorkingDir   string `gorm:"size:512"`
	Model        string `gorm:"size:64"`
	Agent        string `gorm:"size:64"`
	MessageCount int64  `gorm:"default:0"`
	LastSeq      int64  `gorm:"default:0"`
	Messages     []MessageDB `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE"`
}

// MessageDB database message model
type MessageDB struct {
	BaseModel
	SessionID   string `gorm:"index:idx_session_seq,priority:1;index:idx_session_created,priority:1;size:64"`
	Seq         int64  `gorm:"index:idx_session_seq,priority:2;not null"`
	Type        string `gorm:"index;size:32"`
	Content     string `gorm:"type:text"`
	Timestamp   int64  `gorm:"index:idx_session_created,priority:2"`
	MessageHash string `gorm:"index;size:64"`
}

// SessionStore session persistence layer
type SessionStore struct {
	db *gorm.DB
}

// NewSessionStore creates a new session store
func NewSessionStore(dbPath string) (*SessionStore, error) {
	// Use modernc.org/sqlite (pure Go) instead of mattn/go-sqlite3 (requires CGO)
	sqlDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	db, err := gorm.Open(sqlite.Dialector{
		Conn: sqlDB,
	}, &gorm.Config{
		SkipDefaultTransaction: true,
		PrepareStmt:            true,
	})
	if err != nil {
		return nil, err
	}

	// Configure connection pool
	dbSQL, err := db.DB()
	if err != nil {
		return nil, err
	}

	dbSQL.SetMaxIdleConns(10)
	dbSQL.SetMaxOpenConns(100)
	dbSQL.SetConnMaxLifetime(1 * time.Hour)

	// Enable WAL mode
	if err := enableWALMode(db); err != nil {
		return nil, err
	}

	// Auto migrate
	if err := db.AutoMigrate(&SessionDB{}, &MessageDB{}); err != nil {
		return nil, err
	}

	logger.Info("Session store initialized with WAL mode")
	return &SessionStore{db: db}, nil
}

// enableWALMode enables WAL mode for better performance
func enableWALMode(db *gorm.DB) error {
	if err := db.Exec("PRAGMA journal_mode=WAL").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA synchronous=NORMAL").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA cache_size=-64000").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA temp_store=MEMORY").Error; err != nil {
		return err
	}
	if err := db.Exec("PRAGMA busy_timeout=5000").Error; err != nil {
		return err
	}
	return nil
}

// CreateSession creates a new session
func (s *SessionStore) CreateSession(sess *SessionDB) error {
	return s.db.Create(sess).Error
}

// GetSession retrieves a session by ID
func (s *SessionStore) GetSession(sessionID string) (*SessionDB, error) {
	var sess SessionDB
	err := s.db.Where("session_id = ?", sessionID).First(&sess).Error
	if err != nil {
		return nil, err
	}
	return &sess, nil
}

// UpdateSession updates session fields
func (s *SessionStore) UpdateSession(sess *SessionDB) error {
	return s.db.Model(sess).Updates(map[string]interface{}{
		"status":        sess.Status,
		"message_count": sess.MessageCount,
		"last_seq":      sess.LastSeq,
	}).Error
}

// DeleteSession deletes a session
func (s *SessionStore) DeleteSession(sessionID string) error {
	return s.db.Where("session_id = ?", sessionID).Delete(&SessionDB{}).Error
}

// BatchWriteMessages writes messages in batches
func (s *SessionStore) BatchWriteMessages(messages []*MessageDB) error {
	if len(messages) == 0 {
		return nil
	}

	batchSize := 50
	for i := 0; i < len(messages); i += batchSize {
		end := i + batchSize
		if end > len(messages) {
			end = len(messages)
		}

		batch := messages[i:end]
		if err := s.db.CreateInBatches(batch, batchSize).Error; err != nil {
			return err
		}
	}

	return nil
}

// GetMessages retrieves messages with pagination
func (s *SessionStore) GetMessages(sessionID string, opts GetMessagesOptions) ([]*MessageDB, error) {
	var messages []*MessageDB

	query := s.db.Where("session_id = ?", sessionID)

	if opts.SinceSeq > 0 {
		query = query.Where("seq > ?", opts.SinceSeq)
	}
	if opts.BeforeSeq > 0 {
		query = query.Where("seq < ?", opts.BeforeSeq)
	}
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}

	err := query.Order("seq ASC").Find(&messages).Error
	return messages, err
}

// Close closes the database connection
func (s *SessionStore) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetMessagesOptions options for retrieving messages
type GetMessagesOptions struct {
	SinceSeq  int64
	BeforeSeq int64
	Limit     int
}
