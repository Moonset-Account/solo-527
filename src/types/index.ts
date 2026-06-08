export type ToneType = 'ping' | 'ze' | 'any'

export interface TonePattern {
  tone: ToneType
  expected: string
}

export interface CharacterUnit {
  char: string
  tone: ToneType
  isRhyme: boolean
  isKeyword: boolean
  imagery?: string
}

export interface PoemLine {
  text: string
  characters: CharacterUnit[]
  tonePattern: TonePattern[]
  rhymeGroup?: string
}

export interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  lines: PoemLine[]
  imagery: string[]
  difficulty: number
  ciPaiId: string
}

export interface MetricalPattern {
  upperTune: TonePattern[]
  lowerTune: TonePattern[]
  rhymeScheme: string
  totalLines: number
  lineLengths: number[]
}

export interface CiPai {
  id: string
  name: string
  alias?: string
  description: string
  origin: string
  metricalPattern: MetricalPattern
  representativeWorks: string[]
  imagery: string[]
}

export interface RuleConfig {
  showToneHint: boolean
  showImageryHint: boolean
  requireRhymeMatch: boolean
  requireAntithesis: boolean
  allowSwapAdjacent: boolean
  showPositionHint: boolean
  maxErrors: number
  scoreMultiplier: number
}

export interface LevelConfig {
  id: string
  poemId: string
  difficulty: number
  timeLimit: number
  hintPoints: number
  rules: Partial<RuleConfig>
  unlockCondition: string
}

export interface ChapterConfig {
  id: string
  ciPaiId: string
  name: string
  description: string
  unlockRequirement: string
  rules: RuleConfig
  levels: LevelConfig[]
}

export interface LevelProgress {
  levelId: string
  stars: number
  bestTime: number
  completed: boolean
  attempts: number
}

export interface ChapterProgress {
  chapterId: string
  levels: LevelProgress[]
}

export interface PlayStats {
  totalPlayTime: number
  totalLevels: number
  totalStars: number
  perfectClears: number
}

export interface GameSettings {
  musicVolume: number
  sfxVolume: number
  showFps: boolean
  frameRateMode: 'auto' | '30' | '60'
  inputMapping: Record<string, string>
}

export interface ChoiceRecord {
  timestamp: number
  type: 'place' | 'swap' | 'remove' | 'hint'
  detail: string
  correct: boolean
}

export interface SessionRecord {
  levelId: string
  chapterId: string
  startTime: number
  endTime: number
  duration: number
  failureCount: number
  hintsUsed: number
  keyChoices: ChoiceRecord[]
  result: 'success' | 'quit'
  score: number
  stars: number
}

export interface AnalyticsData {
  sessions: SessionRecord[]
}

export interface SaveData {
  version: string
  timestamp: number
  progress: ChapterProgress[]
  stats: PlayStats
  settings: GameSettings
  unlockedCards: string[]
  analytics: AnalyticsData
  tutorialCompleted: boolean
}

export interface CardData {
  id: string
  ciPaiId: string
  title: string
  content: string
  origin: string
  metrical: string
  imagery: string
  appreciation: string
}

export interface PuzzleSlot {
  index: number
  expectedChar: string
  placedChar: string | null
  tone: ToneType
  isRhyme: boolean
  isKeyword: boolean
  imagery?: string
}

export interface PuzzleChar {
  id: string
  char: string
  tone: ToneType
  isRhyme: boolean
  isKeyword: boolean
  imagery?: string
  slotIndex: number | null
  originIndex: number
}

export interface ErrorFeedback {
  type: 'tone_mismatch' | 'imagery_clash' | 'wrong_position' | 'rhyme_mismatch' | 'antithesis_violation'
  message: string
  detail: string
  char: string
  position: number
}

export interface HintResult {
  type: 'tone' | 'imagery' | 'position'
  message: string
  detail: string
  cost: number
}

export interface ScoreResult {
  baseScore: number
  timeBonus: number
  hintPenalty: number
  errorPenalty: number
  totalScore: number
  stars: number
}

export interface GameCanvasState {
  slots: PuzzleSlot[]
  chars: PuzzleChar[]
  dragging: string | null
  dragOffsetX: number
  dragOffsetY: number
  mouseX: number
  mouseY: number
  animations: AnimationState[]
}

export interface AnimationState {
  type: 'ink_spread' | 'shake' | 'bloom' | 'float' | 'fade'
  x: number
  y: number
  progress: number
  duration: number
  color?: string
  text?: string
}

export interface PerfReport {
  fps: number
  minFps: number
  maxFps: number
  avgFps: number
  frameTime: number
  batchCount: number
}
