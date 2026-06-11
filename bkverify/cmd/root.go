package cmd

import (
	"github.com/ops/bkverify/ingest"
	"github.com/ops/bkverify/report"
	"github.com/ops/bkverify/verify"
	"github.com/spf13/cobra"
)

func NewRootCommand() *cobra.Command {
	root := &cobra.Command{
		Use:   "bkverify",
		Short: "Backup checklist verification tool for ops on-call engineers",
		Long: `bkverify reads backup manifests, object storage listings, and checksums,
then checks for missing files, size mismatches, expired backups, and duplicate snapshots.

Read-only access to object storage by default. Severe issues (MISSING, CHECKSUM_FAIL)
return non-zero exit code. Historical reports are kept in local SQLite for review.`,
		SilenceUsage:  true,
		SilenceErrors: true,
	}

	root.AddCommand(ingest.NewCommand())
	root.AddCommand(verify.NewCommand())
	root.AddCommand(report.NewCommand())

	return root
}
