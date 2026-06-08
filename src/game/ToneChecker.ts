import type { CharacterUnit, TonePattern, ToneType } from '@/types'

export class ToneChecker {
  check(char: CharacterUnit, expected: TonePattern): { valid: boolean; message: string } {
    if (expected.tone === 'any') {
      return { valid: true, message: '' }
    }

    if (char.tone === expected.tone) {
      return { valid: true, message: '' }
    }

    const charToneName = char.tone === 'ping' ? '平声' : '仄声'
    const expectedToneName = expected.tone === 'ping' ? '平声' : '仄声'

    return {
      valid: false,
      message: `此字为${charToneName}，此处应填${expectedToneName}字`,
    }
  }

  suggestToneType(expected: TonePattern): ToneType {
    return expected.tone
  }
}
