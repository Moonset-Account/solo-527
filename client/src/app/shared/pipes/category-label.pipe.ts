import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'categoryLabel', standalone: true })
export class CategoryLabelPipe implements PipeTransform {
  transform(value: string): string {
    const labels: Record<string, string> = {
      demolition: '拆除工程',
      plumbing: '水电工程',
      masonry: '泥瓦工程',
      carpentry: '木工工程',
      painting: '油漆工程',
      main_material: '主材',
      other: '其他',
    };
    return labels[value] || value;
  }
}
