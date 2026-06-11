package verify

import (
	"bufio"
	"database/sql"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/ops/bkverify/db"
	"github.com/spf13/cobra"
)

func parseManifestFile(path string) ([]db.ManifestEntry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open manifest: %w", err)
	}
	defer f.Close()
	var records []db.ManifestEntry
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
			return nil, fmt.Errorf("manifest line %d: need at least 4 fields (bucket,path,size,checksum[,expire_date]), got %d", lineno, len(fields))
		}
		bucket := strings.TrimSpace(fields[0])
		objPath := strings.TrimSpace(fields[1])
		size, err := strconv.ParseInt(strings.TrimSpace(fields[2]), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("manifest line %d: invalid size: %w", lineno, err)
		}
		checksum := strings.TrimSpace(fields[3])
		var expireDate string
		if len(fields) >= 5 {
			expireDate = strings.TrimSpace(fields[4])
		}
		records = append(records, db.ManifestEntry{
			Bucket:     bucket,
			Path:       objPath,
			Size:       size,
			Checksum:   checksum,
			LineNo:     lineno,
			ExpireDate: expireDate,
			IngestedAt: time.Now().UTC(),
		})
	}
	return records, scanner.Err()
}

func parseStorageFile(path string) ([]db.StorageObject, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open storage list: %w", err)
	}
	defer f.Close()
	var records []db.StorageObject
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		text := strings.TrimSpace(scanner.Text())
		if text == "" || strings.HasPrefix(text, "#") {
			continue
		}
		fields := strings.SplitN(text, ",", 4)
		if len(fields) < 3 {
			continue
		}
		bucket := strings.TrimSpace(fields[0])
		objPath := strings.TrimSpace(fields[1])
		size, err := strconv.ParseInt(strings.TrimSpace(fields[2]), 10, 64)
		if err != nil {
			continue
		}
		var checksum string
		if len(fields) >= 4 {
			checksum = strings.TrimSpace(fields[3])
		}
		records = append(records, db.StorageObject{
			Bucket:     bucket,
			Path:       objPath,
			Size:       size,
			Checksum:   checksum,
			IngestedAt: time.Now().UTC(),
		})
	}
	return records, scanner.Err()
}

func ingestManifestToDB(database *sql.DB, entries []db.ManifestEntry, bucket string) error {
	clearedBuckets := make(map[string]bool)
	now := time.Now().UTC()
	for _, e := range entries {
		if bucket != "" && e.Bucket != bucket {
			continue
		}
		if !clearedBuckets[e.Bucket] {
			if err := db.ClearManifest(database, e.Bucket); err != nil {
				return fmt.Errorf("clear manifest for bucket %s: %w", e.Bucket, err)
			}
			clearedBuckets[e.Bucket] = true
		}
		if err := db.InsertManifestEntry(database, db.ManifestEntry{
			Bucket:     e.Bucket,
			Path:       e.Path,
			Size:       e.Size,
			Checksum:   e.Checksum,
			LineNo:     e.LineNo,
			ExpireDate: e.ExpireDate,
			IngestedAt: now,
		}); err != nil {
			return fmt.Errorf("insert manifest entry (line %d): %w", e.LineNo, err)
		}
	}
	return nil
}

func ingestStorageToDB(database *sql.DB, objects []db.StorageObject, bucket string) error {
	clearedBuckets := make(map[string]bool)
	now := time.Now().UTC()
	for _, o := range objects {
		if bucket != "" && o.Bucket != bucket {
			continue
		}
		if !clearedBuckets[o.Bucket] {
			if err := db.ClearStorage(database, o.Bucket); err != nil {
				return fmt.Errorf("clear storage for bucket %s: %w", o.Bucket, err)
			}
			clearedBuckets[o.Bucket] = true
		}
		if err := db.InsertStorageObject(database, db.StorageObject{
			Bucket:     o.Bucket,
			Path:       o.Path,
			Size:       o.Size,
			Checksum:   o.Checksum,
			IngestedAt: now,
		}); err != nil {
			return fmt.Errorf("insert storage object %s/%s: %w", o.Bucket, o.Path, err)
		}
	}
	return nil
}

func checkManifestVsStorage(entries []db.ManifestEntry, storageMap map[string]db.StorageObject) (missing, sizeMismatch, checksumFail []db.ReportItem) {
	for _, e := range entries {
		obj, found := storageMap[e.Path]
		if !found {
			missing = append(missing, db.ReportItem{
				Severity: "CRITICAL",
				Category: "MISSING",
				Bucket:   e.Bucket,
				Path:     e.Path,
				LineNo:   e.LineNo,
				Detail:   "file not found in object storage",
			})
			continue
		}
		if e.Size != obj.Size {
			sizeMismatch = append(sizeMismatch, db.ReportItem{
				Severity: "WARNING",
				Category: "SIZE_MISMATCH",
				Bucket:   e.Bucket,
				Path:     e.Path,
				LineNo:   e.LineNo,
				Detail:   fmt.Sprintf("manifest size=%d, storage size=%d", e.Size, obj.Size),
			})
		}
		if e.Checksum != "" && obj.Checksum != "" && e.Checksum != obj.Checksum {
			checksumFail = append(checksumFail, db.ReportItem{
				Severity: "CRITICAL",
				Category: "CHECKSUM_FAIL",
				Bucket:   e.Bucket,
				Path:     e.Path,
				LineNo:   e.LineNo,
				Detail:   fmt.Sprintf("manifest checksum=%s, storage checksum=%s", e.Checksum, obj.Checksum),
			})
		}
	}
	return
}

func checkExpired(entries []db.ManifestEntry) []db.ReportItem {
	now := time.Now().UTC()
	var items []db.ReportItem
	for _, e := range entries {
		if e.ExpireDate == "" {
			continue
		}
		expTime, err := time.Parse("2006-01-02", e.ExpireDate)
		if err != nil {
			continue
		}
		if now.After(expTime) {
			items = append(items, db.ReportItem{
				Severity: "WARNING",
				Category: "EXPIRED",
				Bucket:   e.Bucket,
				Path:     e.Path,
				LineNo:   e.LineNo,
				Detail:   fmt.Sprintf("backup expired on %s", e.ExpireDate),
			})
		}
	}
	return items
}

func checkDuplicates(objects []db.StorageObject) []db.ReportItem {
	seen := make(map[string]int)
	var items []db.ReportItem
	for _, o := range objects {
		seen[o.Path]++
		if seen[o.Path] == 2 {
			items = append(items, db.ReportItem{
				Severity: "WARNING",
				Category: "DUPLICATE",
				Bucket:   o.Bucket,
				Path:     o.Path,
				LineNo:   0,
				Detail:   "duplicate snapshot detected",
			})
		}
	}
	return items
}

func printSummary(cmd *cobra.Command, bucket string, started, finished time.Time, missing, sizeMismatch, checksumFail, expired, duplicate int) {
	fmt.Fprintf(cmd.OutOrStdout(), "\n=== Verification Report ===\n")
	fmt.Fprintf(cmd.OutOrStdout(), "Bucket:          %s\n", bucket)
	fmt.Fprintf(cmd.OutOrStdout(), "Started at:      %s\n", started.Format(time.RFC3339))
	fmt.Fprintf(cmd.OutOrStdout(), "Finished at:     %s\n", finished.Format(time.RFC3339))
	fmt.Fprintf(cmd.OutOrStdout(), "Missing:         %d\n", missing)
	fmt.Fprintf(cmd.OutOrStdout(), "Size mismatch:   %d\n", sizeMismatch)
	fmt.Fprintf(cmd.OutOrStdout(), "Checksum fail:   %d\n", checksumFail)
	fmt.Fprintf(cmd.OutOrStdout(), "Expired:         %d\n", expired)
	fmt.Fprintf(cmd.OutOrStdout(), "Duplicate:       %d\n", duplicate)
	fmt.Fprintf(cmd.OutOrStdout(), "===========================\n\n")
}

func printItem(cmd *cobra.Command, item db.ReportItem) {
	lineInfo := ""
	if item.LineNo > 0 {
		lineInfo = fmt.Sprintf(" (manifest line %d)", item.LineNo)
	}
	fmt.Fprintf(cmd.OutOrStdout(), "[%s] %s: %s/%s%s — %s\n",
		item.Severity, item.Category, item.Bucket, item.Path, lineInfo, item.Detail)
}

func listManifestBuckets(database *sql.DB) ([]string, error) {
	rows, err := database.Query(`SELECT DISTINCT bucket FROM manifest_entries ORDER BY bucket`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var buckets []string
	for rows.Next() {
		var b string
		if err := rows.Scan(&b); err != nil {
			return nil, err
		}
		buckets = append(buckets, b)
	}
	return buckets, rows.Err()
}

func listStorageBuckets(database *sql.DB) ([]string, error) {
	rows, err := database.Query(`SELECT DISTINCT bucket FROM storage_objects ORDER BY bucket`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var buckets []string
	for rows.Next() {
		var b string
		if err := rows.Scan(&b); err != nil {
			return nil, err
		}
		buckets = append(buckets, b)
	}
	return buckets, rows.Err()
}

func NewCommand() *cobra.Command {
	var dbPath string
	var bucket string
	var manifestPath string
	var storagePath string

	cmd := &cobra.Command{
		Use:   "verify [--manifest FILE] [--storage FILE] [--bucket BUCKET]",
		Short: "Verify backup integrity against manifest and storage listing",
		Long: `Verify backup integrity by comparing the manifest with the object storage listing.

Data sources (in order of priority):
  1. If --manifest and/or --storage are provided, they are ingested into SQLite first
  2. Otherwise, the previously ingested SQLite index is used directly

Checks performed:
  - MISSING:       Files in manifest but not in storage
  - SIZE_MISMATCH: File exists but size differs
  - CHECKSUM_FAIL: File exists but checksum differs (shows manifest line number + object path)
  - EXPIRED:       Backup past retention period (expire_date stored from manifest)
  - DUPLICATE:     Duplicate snapshot paths in storage

Severe issues (MISSING, CHECKSUM_FAIL) cause non-zero exit code.
Reports are persisted in the local SQLite database for historical review.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			database, err := db.Open(dbPath)
			if err != nil {
				return err
			}
			defer database.Close()

			started := time.Now().UTC()

			var manifestBuckets, storageBuckets map[string]bool
			hasAnyInput := false

			if manifestPath != "" {
				entries, err := parseManifestFile(manifestPath)
				if err != nil {
					return err
				}
				manifestBuckets = make(map[string]bool)
				for _, e := range entries {
					manifestBuckets[e.Bucket] = true
				}
				hasAnyInput = true
				if err := ingestManifestToDB(database, entries, bucket); err != nil {
					return err
				}
			}

			if storagePath != "" {
				objects, err := parseStorageFile(storagePath)
				if err != nil {
					return err
				}
				storageBuckets = make(map[string]bool)
				for _, o := range objects {
					storageBuckets[o.Bucket] = true
				}
				hasAnyInput = true
				if err := ingestStorageToDB(database, objects, bucket); err != nil {
					return err
				}
			}

			inputBuckets := make(map[string]bool)
			for b := range manifestBuckets {
				inputBuckets[b] = true
			}
			for b := range storageBuckets {
				inputBuckets[b] = true
			}

			if bucket == "" && hasAnyInput {
				allManifestBuckets, err := listManifestBuckets(database)
				if err != nil {
					return fmt.Errorf("list manifest buckets for cleanup: %w", err)
				}
				for _, b := range allManifestBuckets {
					if !inputBuckets[b] {
						if err := db.ClearManifest(database, b); err != nil {
							return fmt.Errorf("clear stale manifest bucket %s: %w", b, err)
						}
					}
				}
				allStorageBuckets, err := listStorageBuckets(database)
				if err != nil {
					return fmt.Errorf("list storage buckets for cleanup: %w", err)
				}
				for _, b := range allStorageBuckets {
					if !inputBuckets[b] {
						if err := db.ClearStorage(database, b); err != nil {
							return fmt.Errorf("clear stale storage bucket %s: %w", b, err)
						}
					}
				}
			}

			var buckets []string
			if bucket != "" {
				buckets = []string{bucket}
			} else if hasAnyInput {
				for b := range inputBuckets {
					buckets = append(buckets, b)
				}
				sort.Strings(buckets)
			} else {
				buckets, err = db.ListBuckets(database)
				if err != nil {
					return fmt.Errorf("list buckets: %w", err)
				}
			}

			if len(buckets) == 0 {
				return fmt.Errorf("no data in local index; run 'ingest' first or provide --manifest/--storage")
			}

			var allItems []db.ReportItem
			missingCount := 0
			sizeMismatchCount := 0
			checksumFailCount := 0
			expiredCount := 0
			duplicateCount := 0

			for _, b := range buckets {
				me, err := db.ListManifestEntries(database, b)
				if err != nil {
					return fmt.Errorf("list manifest for bucket %s: %w", b, err)
				}
				so, err := db.ListStorageObjects(database, b)
				if err != nil {
					return fmt.Errorf("list storage for bucket %s: %w", b, err)
				}

				storageMap := make(map[string]db.StorageObject)
				for _, o := range so {
					storageMap[o.Path] = o
				}

				missing, sizeItems, checksumItems := checkManifestVsStorage(me, storageMap)
				missingCount += len(missing)
				sizeMismatchCount += len(sizeItems)
				checksumFailCount += len(checksumItems)

				expiredItems := checkExpired(me)
				expiredCount += len(expiredItems)

				dupItems := checkDuplicates(so)
				duplicateCount += len(dupItems)

				allItems = append(allItems, missing...)
				allItems = append(allItems, sizeItems...)
				allItems = append(allItems, checksumItems...)
				allItems = append(allItems, expiredItems...)
				allItems = append(allItems, dupItems...)
			}

			finished := time.Now().UTC()
			hasSevere := missingCount > 0 || checksumFailCount > 0

			reportBucket := bucket
			if reportBucket == "" && len(buckets) == 1 {
				reportBucket = buckets[0]
			} else if reportBucket == "" {
				reportBucket = "all"
			}

			reportID, err := db.InsertReport(database, db.VerifyReport{
				Bucket:            reportBucket,
				StartedAt:         started,
				FinishedAt:        finished,
				MissingCount:      missingCount,
				SizeMismatchCount: sizeMismatchCount,
				ChecksumFailCount: checksumFailCount,
				ExpiredCount:      expiredCount,
				DuplicateCount:    duplicateCount,
				HasSevere:         hasSevere,
			})
			if err != nil {
				return fmt.Errorf("save report: %w", err)
			}

			for i := range allItems {
				allItems[i].ReportID = reportID
				if err := db.InsertReportItem(database, allItems[i]); err != nil {
					return fmt.Errorf("save report item: %w", err)
				}
			}

			printSummary(cmd, reportBucket, started, finished,
				missingCount, sizeMismatchCount, checksumFailCount, expiredCount, duplicateCount)

			for _, item := range allItems {
				printItem(cmd, item)
			}

			if hasSevere {
				return fmt.Errorf("verification failed: %d missing, %d checksum failures", missingCount, checksumFailCount)
			}

			return nil
		},
	}

	cmd.Flags().StringVar(&manifestPath, "manifest", "", "Path to backup manifest CSV (optional; uses SQLite index if omitted)")
	cmd.Flags().StringVar(&storagePath, "storage", "", "Path to object storage listing CSV (optional; uses SQLite index if omitted)")
	cmd.Flags().StringVar(&bucket, "bucket", "", "Restrict verification to a specific bucket")
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to SQLite database (default: ~/.bkverify/bkverify.db)")

	return cmd
}
