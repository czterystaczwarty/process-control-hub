import { createProcessManager } from '../process-manager';
import { ProcessMethods } from '../types';

type TestVariables = {
  var1: string;
  var2: number;
  var3: { key: string };
};

type TestSteps = 'STEP1' | 'STEP2' | 'STEP3';

describe('ProcessManager', () => {
  let methods: ProcessMethods<TestVariables>;
  
  beforeEach(() => {
    methods = {
      start: jest.fn(),
      continue: jest.fn(),
      get: jest.fn(),
    };
  });

  it('should start process successfully', async () => {
    const manager = createProcessManager<TestVariables, TestSteps>('TEST_PROCESS', methods);
    const startResponse = {
      processId: '123',
      processName: 'TEST_PROCESS',
      stepName: 'STEP1',
      variables: [{ name: 'var1', value: 'test' }],
      finished: false,
    };

    (methods.start as jest.Mock).mockResolvedValue(startResponse);

    await manager.start({ var1: 'test' });

    expect(manager.getProcessId()).toBe('123');
    expect(manager.isStarted()).toBe(true);
    expect(manager.isFinished()).toBe(false);
    expect(manager.getVariable('var1')).toBe('test');
  });

  it('should continue process successfully', async () => {
    const manager = createProcessManager<TestVariables, TestSteps>('TEST_PROCESS', methods);
    const startResponse = {
      processId: '123',
      processName: 'TEST_PROCESS',
      stepName: 'STEP1',
      variables: [{ name: 'var1', value: 'test' }],
      finished: false,
    };
    const continueResponse = {
      processId: '123',
      processName: 'TEST_PROCESS',
      stepName: 'STEP2',
      variables: [
        { name: 'var1', value: 'test' },
        { name: 'var2', value: 42 },
      ],
      finished: false,
    };

    (methods.start as jest.Mock).mockResolvedValue(startResponse);
    (methods.continue as jest.Mock).mockResolvedValue(continueResponse);

    await manager.start({ var1: 'test' });
    await manager.continue({ var2: 42 });

    expect(manager.getProcessId()).toBe('123');
    expect(manager.getStepName()).toBe('STEP2');
    expect(manager.getVariable('var2')).toBe(42);
  });

  it('should handle errors', async () => {
    const manager = createProcessManager<TestVariables, TestSteps>('TEST_PROCESS', methods);
    const error = new Error('Test error');

    (methods.start as jest.Mock).mockRejectedValue(error);

    await expect(manager.start({ var1: 'test' })).rejects.toThrow('Test error');
    expect(manager.hasError()).toBe(true);
    expect(manager.getError()).toBe(error);
  });
});