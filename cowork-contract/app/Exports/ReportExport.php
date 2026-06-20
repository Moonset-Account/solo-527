<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReportExport implements FromArray, WithTitle
{
    use Exportable;

    protected array $rows;
    protected array $metadata;
    protected string $sheetTitle;

    public function __construct(array $rows, array $metadata, string $title = 'Report')
    {
        $this->rows = $rows;
        $this->metadata = $metadata;
        $this->sheetTitle = $title;
    }

    public function array(): array
    {
        $columnCount = count($this->rows[0] ?? []);

        $metaRows = array_map(function ($line) use ($columnCount) {
            $row = [$line];
            for ($i = 1; $i < $columnCount; $i++) {
                $row[] = '';
            }
            return $row;
        }, $this->metadata);

        return array_merge($metaRows, [[]], $this->rows);
    }

    public function title(): string
    {
        return $this->sheetTitle;
    }
}
