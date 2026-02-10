import { getCodeRepairService } from '../src/services/CodeRepairService';
import type { SandboxError, RepairRequest } from '../src/types/sandbox';

// Mock the Gemini API to avoid actual costs and just test logic
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'console.log("Mock Repair Result");',
        },
      }),
    }),
  })),
}));

describe('CodeRepairService Strategy Selection', () => {
  const service = getCodeRepairService();
  
  // We need to spy on the private method or check the logs/output to verify strategy.
  // Since we can't easily spy on private methods in Jest without casting to any,
  // we will infer the strategy by the console.log output if we spy on console.log,
  // or by mocking the `buildStrategyPrompt` if we could (but it's private).
  //
  // Instead, we'll spy on console.log to catch the "Fixing ... with strategy: X" message.
  
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('Should select REBUILD strategy for > 20 errors', async () => {
    const errors: SandboxError[] = Array(25).fill(0).map((_, i) => ({
      type: 'build',
      message: `Error ${i}`,
      raw: `Error ${i}`
    }));

    await service.repair({
      files: [{ path: '/src/App.tsx', content: 'broken code' }],
      errors,
      attempt: 1,
      originalInstructions: 'Fix it'
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('strategy: REBUILD')
    );
  });

  test('Should select REBUILD strategy for critical syntax failures', async () => {
    const errors: SandboxError[] = Array(12).fill(0).map((_, i) => ({
      type: 'syntax',
      message: `Syntax Error ${i}`,
      raw: `Syntax Error ${i}`
    }));

    await service.repair({
      files: [{ path: '/src/App.tsx', content: 'broken code' }],
      errors,
      attempt: 1,
      originalInstructions: 'Fix it'
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('strategy: REBUILD')
    );
  });

  test('Should select IMPORT_FIX strategy for mostly import errors', async () => {
    const errors: SandboxError[] = Array(6).fill(0).map((_, i) => ({
      type: 'import',
      message: `Module not found ${i}`,
      raw: `Module not found ${i}`
    }));

    await service.repair({
      files: [{ path: '/src/App.tsx', content: 'broken code' }],
      errors,
      attempt: 1,
      originalInstructions: 'Fix it'
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('strategy: IMPORT_FIX')
    );
  });

  test('Should select SURGICAL strategy for few miscellaneous errors', async () => {
    const errors: SandboxError[] = [
      { type: 'build', message: 'Unknown var', raw: '' },
      { type: 'type', message: 'Type mismatch', raw: '' }
    ];

    await service.repair({
      files: [{ path: '/src/App.tsx', content: 'broken code' }],
      errors,
      attempt: 1,
      originalInstructions: 'Fix it'
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('strategy: SURGICAL')
    );
  });
});
