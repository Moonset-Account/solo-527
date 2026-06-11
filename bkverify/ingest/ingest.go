package ingest

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/ops/bkverify/db"
	"github.com/spf13/cobra"
)

type manifestLine struct {
	bucket     string
	path       string
	size       int64
	checksum   string
	lineNo     int
	expireDate string
}

type storageLine struct {
	bucket   string
	path     string
	size     int64
	checksum string
}

func parseManifestFile(path string) ([]manifestLine, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open manifest: %w", err)
	}
	defer f.Close()
	var lines []manifestLine
	scanner := bufio.NewScanner(f)
	lineno := 0
	for scanner.Scan() {
		lineno++
		text := strings.TrimSpace(scanner.Text())
		if text == "" || strings.HasPrefix(text, "#") {
			continue
		}
		fields := strings.SplitN(text, ",", 6)
		if len(fields) < 4 {
			return nil, fmt.Errorf("manifest line %d: expected at least 4 comma-separated fields (bucket,path,size,checksum[,expire_date]), got %d", lineno, len(fields))
		}
		bucket := strings.TrimSpace(fields[0])
		objPath := strings.TrimSpace(fields[1])
		size, err := strconv.ParseInt(strings.TrimSpace(fields[2]), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("manifest line %d: invalid size %q: %w", lineno, fields[2], err)
		}
		checksum := strings.TrimSpace(fields[3])
		var expireDate string
		if len(fields) >= 5 {
			expireDate = strings.TrimSpace(fields[4])
		}
		lines = append(lines, manifestLine{
			bucket:     bucket,
			path:       objPath,
			size:       size,
			checksum:   checksum,
			lineNo:     lineno,
			expireDate: expireDate,
		})
	}
	return lines, scanner.Err()
}

func parseStorageFile(path string) ([]storageLine, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open storage list: %w", err)
	}
	defer f.Close()
	var lines []storageLine
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		text := strings.TrimSpace(scanner.Text())
		if text == "" || strings.HasPrefix(text, "#") {
			continue
		}
		fields := strings.SplitN(text, ",", 4)
		if len(fields) < 3 {
			return nil, fmt.Errorf("storage list: expected at least 3 comma-separated fields (bucket,path,size[,checksum]), got %d", len(fields))
		}
		bucket := strings.TrimSpace(fields[0])
		objPath := strings.TrimSpace(fields[1])
		size, err := strconv.ParseInt(strings.TrimSpace(fields[2]), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("storage list: invalid size %q: %w", fields[2], err)
		}
		var checksum string
		if len(fields) >= 4 {
			checksum = strings.TrimSpace(fields[3])
		}
		lines = append(lines, storageLine{
			bucket:   bucket,
			path:     objPath,
			size:     size,
			checksum: checksum,
		})
	}
	return lines, scanner.Err()
}

func NewCommand() *cobra.Command {
	var dbPath string
	var bucket string

	cmd := &cobra.Command{
		Use:   "ingest --manifest FILE --storage FILE [--bucket BUCKET]",
		Short: "Ingest backup manifest and object storage list into local index",
		Long: `Parse a backup manifest CSV and an object storage listing CSV into the local SQLite index.
Manifest CSV format: bucket,path,size,checksum[,expire_date]
Storage CSV format: bucket,path,size[,checksum]

When --bucket is specified, only that bucket's old index is cleared before ingestion.
When --bucket is not specified, ALL old indices are cleared first to avoid stale accumulation.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			manifestPath, _ := cmd.Flags().GetString("manifest")
			storagePath, _ := cmd.Flags().GetString("storage")

			if manifestPath == "" && storagePath == "" {
				return fmt.Errorf("at least one of --manifest or --storage is required")
			}

			database, err := db.Open(dbPath)
			if err != nil {
				return err
			}
			defer database.Close()

			now := time.Now().UTC()

			if manifestPath != "" {
				if bucket != "" {
					if err := db.ClearManifest(database, bucket); err != nil {
						return fmt.Errorf("clear old manifest for bucket %s: %w", bucket, err)
					}
				} else {
					if err := db.ClearAllManifest(database); err != nil {
						return fmt.Errorf("clear all old manifest entries: %w", err)
					}
				}
				entries, err := parseManifestFile(manifestPath)
				if err != nil {
					return err
				}
				count := 0
				for _, e := range entries {
					if bucket != "" && e.bucket != bucket {
						continue
					}
					err := db.InsertManifestEntry(database, db.ManifestEntry{
						Bucket:     e.bucket,
						Path:       e.path,
						Size:       e.size,
						Checksum:   e.checksum,
						LineNo:     e.lineNo,
						ExpireDate: e.expireDate,
						IngestedAt: now,
					})
					if err != nil {
						return fmt.Errorf("insert manifest entry (line %d): %w", e.lineNo, err)
					}
					count++
				}
				fmt.Fprintf(cmd.OutOrStdout(), "Ingested %d manifest entries\n", count)
			}

			if storagePath != "" {
				if bucket != "" {
					if err := db.ClearStorage(database, bucket); err != nil {
						return fmt.Errorf("clear old storage for bucket %s: %w", bucket, err)
					}
				} else {
					if err := db.ClearAllStorage(database); err != nil {
						return fmt.Errorf("clear all old storage entries: %w", err)
					}
				}
				objects, err := parseStorageFile(storagePath)
				if err != nil {
					return err
				}
				count := 0
				for _, o := range objects {
					if bucket != "" && o.bucket != bucket {
						continue
					}
					err := db.InsertStorageObject(database, db.StorageObject{
						Bucket:     o.bucket,
						Path:       o.path,
						Size:       o.size,
						Checksum:   o.checksum,
						IngestedAt: now,
					})
					if err != nil {
						return fmt.Errorf("insert storage object %s/%s: %w", o.bucket, o.path, err)
					}
					count++
				}
				fmt.Fprintf(cmd.OutOrStdout(), "Ingested %d storage objects\n", count)
			}

			return nil
		},
	}

	cmd.Flags().String("manifest", "", "Path to backup manifest CSV file")
	cmd.Flags().String("storage", "", "Path to object storage listing CSV file")
	cmd.Flags().StringVar(&bucket, "bucket", "", "Restrict ingestion to a specific bucket")
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to SQLite database (default: ~/.bkverify/bkverify.db)")

	return cmd
}
