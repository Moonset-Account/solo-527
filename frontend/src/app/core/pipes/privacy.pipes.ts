import { Pipe, PipeTransform } from '@angular/core';
import { PrivacyUtils } from '../utils/privacy.utils';

@Pipe({ name: 'maskPhone', standalone: true })
export class MaskPhonePipe implements PipeTransform {
  transform(value: string): string {
    return PrivacyUtils.maskPhone(value);
  }
}

@Pipe({ name: 'maskName', standalone: true })
export class MaskNamePipe implements PipeTransform {
  transform(value: string): string {
    return PrivacyUtils.maskName(value);
  }
}

@Pipe({ name: 'maskEmail', standalone: true })
export class MaskEmailPipe implements PipeTransform {
  transform(value: string): string {
    return PrivacyUtils.maskEmail(value);
  }
}
