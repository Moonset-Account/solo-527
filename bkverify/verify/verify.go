package verify

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

func parseManifestWithExpiry(path string) ([]db.ManifestEntry, error) {
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
		records = append(records, db.ManifestEntry{
			Bucket:     bucket,
			Path:       objPath,
			Size:       size,
			Checksum:   checksum,
			LineNo:     lineno,
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

func loadManifestExpiry(path string) (map[int]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	result := make(map[int]string)
	scanner := bufio.NewScanner(f)
	lineno := 0
	for scanner.Scan() {
		lineno++
		text := strings.TrimSpace(scanner.Text())
		if text == "" || strings.HasPrefix(text, "#") {
			continue
		}
		fields := strings.SplitN(text, ",", 6)
		if len(fields) >= 5 {
			result[lineno] = strings.TrimSpace(fields[4])
		}
	}
	return result, scanner.Err()
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

func checkExpired(entries []db.ManifestEntry, expiryMap map[int]string) []db.ReportItem {
	now := time.Now().UTC()
	var items []db.ReportItem
	for _, e := range entries {
		expStr, ok := expiryMap[e.LineNo]
		if !ok || expStr == "" {
			continue
		}
		expTime, err := time.Parse("2006-01-02", expStr)
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
				Detail:   fmt.Sprintf("backup expired on %s", expStr),
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

func collectBuckets(entries []db.ManifestEntry, objects []db.StorageObject) []string {
	set := make(map[string]bool)
	for _, e := range entries {
		set[e.Bucket] = true
	}
	for _, o := range objects {
		set[o.Bucket] = true
	}
	var buckets []string
	for b := range set {
		buckets = append(buckets, b)
	}
	return buckets
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

func NewCommand() *cobra.Command {
	var dbPath string
	var bucket string
	var manifestPath string
	var storagePath string

	cmd := &cobra.Command{
		Use:   "verify --manifest FILE --storage FILE [--bucket BUCKET]",
		Short: "Verify backup integrity against manifest and storage listing",
		Long: `Compare the backup manifest with the object storage listing to detect:
  - MISSING:       Files in manifest but not in storage
  - SIZE_MISMATCH: File exists but size differs
  - CHECKSUM_FAIL: File exists but checksum differs (shows manifest line number + object path)
  - EXPIRED:       Backup past retention period (expire_date in manifest CSV)
  - DUPLICATE:     Duplicate snapshot paths in storage

Severe issues (MISSING, CHECKSUM_FAIL) cause non-zero exit code.
Reports are persisted in the local SQLite database for historical review.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if manifestPath == "" && storagePath == "" {
				return fmt.Errorf("at least one of --manifest or --storage is required")
			}

			database, err := db.Open(dbPath)
			if err != nil {
				return err
			}
			defer database.Close()

			started := time.Now().UTC()

			var manifestEntries []db.ManifestEntry
			var storageObjects []db.StorageObject

			if manifestPath != "" {
				manifestEntries, err = parseManifestWithExpiry(manifestPath)
				if err != nil {
					return err
				}
				clearedBuckets := make(map[string]bool)
				now := time.Now().UTC()
				for _, e := range manifestEntries {
					if bucket != "" && e.Bucket != bucket {
						continue
					}
					if !clearedBuckets[e.Bucket] {
						db.ClearManifest(database, e.Bucket)
						clearedBuckets[e.Bucket] = true
					}
					db.InsertManifestEntry(database, db.ManifestEntry{
						Bucket:     e.Bucket,
						Path:       e.Path,
						Size:       e.Size,
						Checksum:   e.Checksum,
						LineNo:     e.LineNo,
						IngestedAt: now,
					})
				}
			}

			if storagePath != "" {
				storageObjects, err = parseStorageFile(storagePath)
				if err != nil {
					return err
				}
				clearedBuckets := make(map[string]bool)
				now := time.Now().UTC()
				for _, o := range storageObjects {
					if bucket != "" && o.Bucket != bucket {
						continue
					}
					if !clearedBuckets[o.Bucket] {
						db.ClearStorage(database, o.Bucket)
						clearedBuckets[o.Bucket] = true
					}
					db.InsertStorageObject(database, db.StorageObject{
						Bucket:     o.Bucket,
						Path:       o.Path,
						Size:       o.Size,
						Checksum:   o.Checksum,
						IngestedAt: now,
					})
				}
			}

			buckets := collectBuckets(manifestEntries, storageObjects)
			if bucket != "" {
				buckets = []string{bucket}
			}

			var allItems []db.ReportItem
			missingCount := 0
			sizeMismatchCount := 0
			checksumFailCount := 0
			expiredCount := 0
			duplicateCount := 0

			expiryMap := make(map[int]string)
			if manifestPath != "" {
				expiryMap, _ = loadManifestExpiry(manifestPath)
			}

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

				expiredItems := checkExpired(me, expiryMap)
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

	cmd.Flags().StringVar(&manifestPath, "manifest", "", "Path to backup manifest CSV")
	cmd.Flags().StringVar(&storagePath, "storage", "", "Path to object storage listing CSV")
	cmd.Flags().StringVar(&bucket, "bucket", "", "Restrict verification to a specific bucket")
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to SQLite database (default: ~/.bkverify/bkverify.db)")

	return cmd
}
