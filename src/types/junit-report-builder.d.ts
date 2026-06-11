declare module 'junit-report-builder' {
  interface TestCase {
    className(name: string): TestCase;
    name(name: string): TestCase;
    time(seconds: number): TestCase;
    failure(message?: string, details?: string): TestCase;
    error(message?: string, details?: string): TestCase;
    skipped(message?: string): TestCase;
    property(name: string, value: string): TestCase;
  }

  interface TestSuite {
    name(name: string): TestSuite;
    timestamp(isoDate: string): TestSuite;
    time(seconds: number): TestSuite;
    property(name: string, value: string): TestSuite;
    testCase(): TestCase;
  }

  interface Builder {
    testSuite(): TestSuite;
    writeTo(path: string): void;
    build(): string;
  }

  const builder: Builder;
  export default builder;
  export = builder;
}
