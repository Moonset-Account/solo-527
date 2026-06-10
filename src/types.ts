export type ImageFormat =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'gif'
  | 'webp'
  | 'svg'
  | 'avif'
  | 'ico'
  | 'bmp';

export interface SizeRule {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  allowedRatios?: string[];
}

export interface GlobalSizeConfig {
  default?: SizeRule;
  byFormat?: Partial<Record<ImageFormat, SizeRule>>;
  byPathGlob?: Record<string, SizeRule>;
}

export interface DynamicRefRule {
  pattern: string;
  glob: string;
  captureGroup?: number;
}

export interface AuditConfig {
  imageDir: string;
  manifestPath?: string;
  include: string[];
  ignore: string[];
  sizeRules: GlobalSizeConfig;
  dynamicRefs: DynamicRefRule[];
  json: boolean;
  dryRun: boolean;
  progress: boolean;
  deletePlanPath?: string;
  undoListPath?: string;
  candidateThreshold?: number;
}

export interface ImageMeta {
  path: string;
  normalizedPath: string;
  format: ImageFormat;
  width: number;
  height: number;
  fileSize: number;
  md5: string;
  isSymlink: boolean;
  symlinkTarget?: string;
}

export interface ReferenceInfo {
  imagePath: string;
  sourceFile: string;
  line?: number;
  alt?: string;
  rawRef: string;
}

export interface SizeViolation {
  image: ImageMeta;
  rule: SizeRule;
  issues: string[];
}

export interface DuplicateGroup {
  md5: string;
  images: ImageMeta[];
}

export interface MissingAlt {
  reference: ReferenceInfo;
  image: ImageMeta;
}

export interface SymlinkWarning {
  path: string;
  message: string;
  cycle: string[];
}

export interface UnreferencedCandidate {
  image: ImageMeta;
  lastModified: number;
  matchScore: number;
  potentialMatches: string[];
}

export interface AuditReport {
  summary: {
    totalImages: number;
    totalReferences: number;
    scannedAt: string;
  };
  sizeViolations: SizeViolation[];
  duplicates: DuplicateGroup[];
  missingAlts: MissingAlt[];
  unreferencedCandidates: UnreferencedCandidate[];
  symlinkWarnings: SymlinkWarning[];
  errors: string[];
}

export interface DeleteAction {
  type: 'delete' | 'move';
  image: ImageMeta;
  reason: 'duplicate' | 'unreferenced';
  originalPath: string;
  backupPath?: string;
}

export interface DeletePlan {
  generatedAt: string;
  dryRun: boolean;
  actions: DeleteAction[];
  undoList: string[];
}
