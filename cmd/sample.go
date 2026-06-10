package cmd

import (
	"fmt"

	"csvchecker/internal/reporter"
	"csvchecker/internal/types"

	"github.com/spf13/cobra"
)

var (
	sampleRows       int
	sampleRandom     bool
	sampleOnlyInvalid bool
	sampleShowIndex  bool
	sampleColumns    []string
	sampleMaxWidth   int
)

var sampleCmd = &cobra.Command{
	Use:   "sample <csv file>",
	Short: "采样查看 CSV 内容",
	Long:  `以表格形式显示 CSV 的前 N 行或随机抽样行，便于快速了解数据结构。`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		s, err := loadSchema()
		if err != nil {
			return err
		}

		ignoreMgr := buildIgnoreManager(s, nil, nil, nil)
		v := buildValidator(s, ignoreMgr, 0, false)

		opt := types.SampleOptions{
			Rows:        sampleRows,
			Random:      sampleRandom,
			OnlyInvalid: sampleOnlyInvalid,
			ShowIndex:   sampleShowIndex,
			Columns:     sampleColumns,
		}

		rows, header, err := v.SampleFile(args[0], opt)
		if err != nil {
			return fmt.Errorf("读取文件失败: %w", err)
		}

		rep := reporter.New()
		rep.SetNoColor(flagNoColor)
		fmt.Printf("文件: %s (展示 %d / 共读取 %d 行数据)\n\n", args[0], len(rows), len(rows))
		rep.PrintSample(rows, header, sampleMaxWidth)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(sampleCmd)
	sampleCmd.Flags().IntVarP(&sampleRows, "rows", "n", 20, "采样行数")
	sampleCmd.Flags().BoolVar(&sampleRandom, "random", false, "随机采样（否则取前 N 行）")
	sampleCmd.Flags().BoolVar(&sampleOnlyInvalid, "only-invalid", false, "仅展示校验不通过的行（需配合 schema 使用）")
	sampleCmd.Flags().BoolVarP(&sampleShowIndex, "index", "i", false, "在首列显示原始行号")
	sampleCmd.Flags().StringSliceVarP(&sampleColumns, "columns", "c", nil, "仅显示指定列 (逗号分隔)")
	sampleCmd.Flags().IntVar(&sampleMaxWidth, "max-width", 40, "单元格最大显示宽度")
}
