package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type ManifestEntry struct {
	ID        int64
	Bucket    string
	Path      string
	Size      int64
	Checksum  string
	LineNo    int
	IngestedAt time.Time
}

type StorageObject struct {
	ID        int64
	Bucket    string
	Path      string
	Size      int64
	Checksum  string
	IngestedAt time.Time
}

type VerifyReport struct {
	ID           int64
	Bucket       string
	StartedAt    time.Time
	FinishedAt   time.Time
	MissingCount int
	SizeMismatchCount int
	ChecksumFailCount int
	ExpiredCount int
	DuplicateCount int
	HasSevere    bool
}

type ReportItem struct {
	ID        int64
	ReportID  int64
	Severity  string
	Category  string
	Bucket    string
	Path      string
	LineNo    int
	Detail    string
}

const schema = `
CREATE TABLE IF NOT EXISTS manifest_entries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	bucket TEXT NOT NULL,
	path TEXT NOT NULL,
	size INTEGER NOT NULL,
	checksum TEXT NOT NULL DEFAULT '',
	line_no INTEGER NOT NULL,
	ingested_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manifest_bucket_path ON manifest_entries(bucket, path);

CREATE TABLE IF NOT EXISTS storage_objects (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	bucket TEXT NOT NULL,
	path TEXT NOT NULL,
	size INTEGER NOT NULL,
	checksum TEXT NOT NULL DEFAULT '',
	ingested_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storage_bucket_path ON storage_objects(bucket, path);

CREATE TABLE IF NOT EXISTS verify_reports (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	bucket TEXT NOT NULL,
	started_at DATETIME NOT NULL,
	finished_at DATETIME NOT NULL,
	missing_count INTEGER NOT NULL DEFAULT 0,
	size_mismatch_count INTEGER NOT NULL DEFAULT 0,
	checksum_fail_count INTEGER NOT NULL DEFAULT 0,
	expired_count INTEGER NOT NULL DEFAULT 0,
	duplicate_count INTEGER NOT NULL DEFAULT 0,
	has_severe BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_reports_bucket ON verify_reports(bucket);
CREATE INDEX IF NOT EXISTS idx_reports_started ON verify_reports(started_at);

CREATE TABLE IF NOT EXISTS report_items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	report_id INTEGER NOT NULL REFERENCES verify_reports(id),
	severity TEXT NOT NULL,
	category TEXT NOT NULL,
	bucket TEXT NOT NULL,
	path TEXT NOT NULL,
	line_no INTEGER NOT NULL DEFAULT 0,
	detail TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_items_report ON report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON report_items(category);
`

func defaultDBPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".bkverify", "bkverify.db")
}

func Open(dbPath string) (*sql.DB, error) {
	if dbPath == "" {
		dbPath = defaultDBPath()
	}
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}
	return db, nil
}

func InsertManifestEntry(db *sql.DB, e ManifestEntry) error {
	_, err := db.Exec(
		`INSERT INTO manifest_entries (bucket, path, size, checksum, line_no, ingested_at) VALUES (?, ?, ?, ?, ?, ?)`,
		e.Bucket, e.Path, e.Size, e.Checksum, e.LineNo, e.IngestedAt,
	)
	return err
}

func InsertStorageObject(db *sql.DB, o StorageObject) error {
	_, err := db.Exec(
		`INSERT INTO storage_objects (bucket, path, size, checksum, ingested_at) VALUES (?, ?, ?, ?, ?)`,
		o.Bucket, o.Path, o.Size, o.Checksum, o.IngestedAt,
	)
	return err
}

func ClearManifest(db *sql.DB, bucket string) error {
	_, err := db.Exec(`DELETE FROM manifest_entries WHERE bucket = ?`, bucket)
	return err
}

func ClearStorage(db *sql.DB, bucket string) error {
	_, err := db.Exec(`DELETE FROM storage_objects WHERE bucket = ?`, bucket)
	return err
}

func ListManifestEntries(db *sql.DB, bucket string) ([]ManifestEntry, error) {
	rows, err := db.Query(
		`SELECT id, bucket, path, size, checksum, line_no, ingested_at FROM manifest_entries WHERE bucket = ? ORDER BY path`,
		bucket,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var entries []ManifestEntry
	for rows.Next() {
		var e ManifestEntry
		if err := rows.Scan(&e.ID, &e.Bucket, &e.Path, &e.Size, &e.Checksum, &e.LineNo, &e.IngestedAt); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func ListStorageObjects(db *sql.DB, bucket string) ([]StorageObject, error) {
	rows, err := db.Query(
		`SELECT id, bucket, path, size, checksum, ingested_at FROM storage_objects WHERE bucket = ? ORDER BY path`,
		bucket,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var objects []StorageObject
	for rows.Next() {
		var o StorageObject
		if err := rows.Scan(&o.ID, &o.Bucket, &o.Path, &o.Size, &o.Checksum, &o.IngestedAt); err != nil {
			return nil, err
		}
		objects = append(objects, o)
	}
	return objects, rows.Err()
}

func InsertReport(db *sql.DB, r VerifyReport) (int64, error) {
	res, err := db.Exec(
		`INSERT INTO verify_reports (bucket, started_at, finished_at, missing_count, size_mismatch_count, checksum_fail_count, expired_count, duplicate_count, has_severe)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		r.Bucket, r.StartedAt, r.FinishedAt, r.MissingCount, r.SizeMismatchCount, r.ChecksumFailCount, r.ExpiredCount, r.DuplicateCount, r.HasSevere,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func InsertReportItem(db *sql.DB, item ReportItem) error {
	_, err := db.Exec(
		`INSERT INTO report_items (report_id, severity, category, bucket, path, line_no, detail) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		item.ReportID, item.Severity, item.Category, item.Bucket, item.Path, item.LineNo, item.Detail,
	)
	return err
}

func ListReports(db *sql.DB, bucket string, since time.Time) ([]VerifyReport, error) {
	var rows *sql.Rows
	var err error
	if bucket != "" {
		rows, err = db.Query(
			`SELECT id, bucket, started_at, finished_at, missing_count, size_mismatch_count, checksum_fail_count, expired_count, duplicate_count, has_severe
			 FROM verify_reports WHERE bucket = ? AND started_at >= ? ORDER BY started_at DESC`,
			bucket, since,
		)
	} else {
		rows, err = db.Query(
			`SELECT id, bucket, started_at, finished_at, missing_count, size_mismatch_count, checksum_fail_count, expired_count, duplicate_count, has_severe
			 FROM verify_reports WHERE started_at >= ? ORDER BY started_at DESC`,
			since,
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var reports []VerifyReport
	for rows.Next() {
		var r VerifyReport
		if err := rows.Scan(&r.ID, &r.Bucket, &r.StartedAt, &r.FinishedAt, &r.MissingCount, &r.SizeMismatchCount, &r.ChecksumFailCount, &r.ExpiredCount, &r.DuplicateCount, &r.HasSevere); err != nil {
			return nil, err
		}
		reports = append(reports, r)
	}
	return reports, rows.Err()
}

func ListReportItems(db *sql.DB, reportID int64) ([]ReportItem, error) {
	rows, err := db.Query(
		`SELECT id, report_id, severity, category, bucket, path, line_no, detail FROM report_items WHERE report_id = ? ORDER BY category, path`,
		reportID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ReportItem
	for rows.Next() {
		var i ReportItem
		if err := rows.Scan(&i.ID, &i.ReportID, &i.Severity, &i.Category, &i.Bucket, &i.Path, &i.LineNo, &i.Detail); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}
