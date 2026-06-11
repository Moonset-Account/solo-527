package report

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ops/bkverify/db"
	"github.com/spf13/cobra"
)

func NewCommand() *cobra.Command {
	var dbPath string
	var bucket string
	var since string
	var reportID int64

	cmd := &cobra.Command{
		Use:   "report [--since DURATION] [--bucket BUCKET] [--id REPORT_ID]",
		Short: "View historical verification reports from local SQLite",
		Long: `Display verification reports stored in the local SQLite database.

Use --since to filter reports by time (e.g. "24h", "7d", "168h").
Use --bucket to filter by storage bucket.
Use --id to show details of a specific report.

Reports include: bucket, path, verification time, and all issue details.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			database, err := db.Open(dbPath)
			if err != nil {
				return err
			}
			defer database.Close()

			if reportID > 0 {
				return showReportByID(cmd, database, reportID)
			}

			sinceTime := time.Time{}
			if since != "" {
				dur, err := time.ParseDuration(since)
				if err != nil {
					return fmt.Errorf("invalid --since duration %q: %w (use values like 24h, 7d=168h)", since, err)
				}
				sinceTime = time.Now().UTC().Add(-dur)
			} else {
				sinceTime = time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)
			}

			reports, err := db.ListReports(database, bucket, sinceTime)
			if err != nil {
				return fmt.Errorf("list reports: %w", err)
			}

			if len(reports) == 0 {
				fmt.Fprintln(cmd.OutOrStdout(), "No verification reports found.")
				return nil
			}

			for _, r := range reports {
				fmt.Fprintf(cmd.OutOrStdout(), "\n--- Report #%d ---\n", r.ID)
				fmt.Fprintf(cmd.OutOrStdout(), "Bucket:          %s\n", r.Bucket)
				fmt.Fprintf(cmd.OutOrStdout(), "Started at:      %s\n", r.StartedAt.Format(time.RFC3339))
				fmt.Fprintf(cmd.OutOrStdout(), "Finished at:     %s\n", r.FinishedAt.Format(time.RFC3339))
				fmt.Fprintf(cmd.OutOrStdout(), "Missing:         %d\n", r.MissingCount)
				fmt.Fprintf(cmd.OutOrStdout(), "Size mismatch:   %d\n", r.SizeMismatchCount)
				fmt.Fprintf(cmd.OutOrStdout(), "Checksum fail:   %d\n", r.ChecksumFailCount)
				fmt.Fprintf(cmd.OutOrStdout(), "Expired:         %d\n", r.ExpiredCount)
				fmt.Fprintf(cmd.OutOrStdout(), "Duplicate:       %d\n", r.DuplicateCount)
				if r.HasSevere {
					fmt.Fprintf(cmd.OutOrStdout(), "Severe:          YES\n")
				}

				items, err := db.ListReportItems(database, r.ID)
				if err != nil {
					return fmt.Errorf("list items for report %d: %w", r.ID, err)
				}
				for _, item := range items {
					lineInfo := ""
					if item.LineNo > 0 {
						lineInfo = fmt.Sprintf(" (manifest line %d)", item.LineNo)
					}
					fmt.Fprintf(cmd.OutOrStdout(), "  [%s] %s: %s/%s%s — %s\n",
						item.Severity, item.Category, item.Bucket, item.Path, lineInfo, item.Detail)
				}
			}

			return nil
		},
	}

	cmd.Flags().StringVar(&bucket, "bucket", "", "Filter by bucket")
	cmd.Flags().StringVar(&since, "since", "", "Show reports since duration (e.g. 24h, 168h)")
	cmd.Flags().Int64Var(&reportID, "id", 0, "Show details of a specific report ID")
	cmd.Flags().StringVar(&dbPath, "db", "", "Path to SQLite database (default: ~/.bkverify/bkverify.db)")

	return cmd
}

func showReportByID(cmd *cobra.Command, database *sql.DB, id int64) error {
	reports, err := db.ListReports(database, "", time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC))
	if err != nil {
		return fmt.Errorf("list reports: %w", err)
	}
	var found *db.VerifyReport
	for _, r := range reports {
		if r.ID == id {
			found = &r
			break
		}
	}
	if found == nil {
		return fmt.Errorf("report #%d not found", id)
	}

	r := found
	fmt.Fprintf(cmd.OutOrStdout(), "\n--- Report #%d ---\n", r.ID)
	fmt.Fprintf(cmd.OutOrStdout(), "Bucket:          %s\n", r.Bucket)
	fmt.Fprintf(cmd.OutOrStdout(), "Started at:      %s\n", r.StartedAt.Format(time.RFC3339))
	fmt.Fprintf(cmd.OutOrStdout(), "Finished at:     %s\n", r.FinishedAt.Format(time.RFC3339))
	fmt.Fprintf(cmd.OutOrStdout(), "Missing:         %d\n", r.MissingCount)
	fmt.Fprintf(cmd.OutOrStdout(), "Size mismatch:   %d\n", r.SizeMismatchCount)
	fmt.Fprintf(cmd.OutOrStdout(), "Checksum fail:   %d\n", r.ChecksumFailCount)
	fmt.Fprintf(cmd.OutOrStdout(), "Expired:         %d\n", r.ExpiredCount)
	fmt.Fprintf(cmd.OutOrStdout(), "Duplicate:       %d\n", r.DuplicateCount)
	if r.HasSevere {
		fmt.Fprintf(cmd.OutOrStdout(), "Severe:          YES\n")
	}

	items, err := db.ListReportItems(database, r.ID)
	if err != nil {
		return fmt.Errorf("list items for report %d: %w", r.ID, err)
	}
	for _, item := range items {
		lineInfo := ""
		if item.LineNo > 0 {
			lineInfo = fmt.Sprintf(" (manifest line %d)", item.LineNo)
		}
		fmt.Fprintf(cmd.OutOrStdout(), "  [%s] %s: %s/%s%s — %s\n",
			item.Severity, item.Category, item.Bucket, item.Path, lineInfo, item.Detail)
	}

	return nil
}
