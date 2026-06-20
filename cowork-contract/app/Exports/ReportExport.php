<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReportExport implements FromArray, WithHeadings, WithTitle
{
    protected array $rows;
    protected array $metadata;

    public function __construct(array $rows, array $metadata)
    {
        $this->rows = $rows;
        $this->metadata = $metadata;
    }

    public function array(): array
    {
        $metaRows = array_map(fn ($line) => [$line], $this->metadata);

        return array_merge($metaRows, [[]], $this->rows);
    }

    public function headings(): array
    {
        return ['Content'];
    }

    public function title(): string
    {
        return 'Report';
    }
}
