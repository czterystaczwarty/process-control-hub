import { renderHook, act } from '@testing-library/react';
import { useProcess } from '../use-process';
import { ProcessMethods } from '../types';

type TestVariables = {
  var1: string;
  var2: number;
};

type TestSteps = 'STEP1' | 'STEP2';

describe('useProcess', () => {
  let methods: ProcessMethods<TestVariables>;

  beforeEach(() => {
    methods = {
      start: jest.fn(),
      continue: jest.fn(),
      get: jest.fn(),
    };
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useProcess<TestVariables, TestSteps>('TEST_PROCESS', methods)
    );

    expect(result.current.processId).toBeNull();
    expect(result.current.isStarted).toBe(false);
    expect(result.current.isFinished).toBe(false);
    expect(result.current.isPending).toBe(false);
  });

  it('should start process successfully', async () => {
    const startResponse = {
      processId: '123',
      processName: 'TEST_PROCESS',
      stepName: 'STEP1',
      variables: [{ name: 'var1', value: 'test' }],
      finished: false,
    };

    (methods.start as jest.Mock).mockResolvedValue(startResponse);

    const { result } = renderHook(() =>
      useProcess<TestVariables, TestSteps>('TEST_PROCESS', methods)
    );

    await act(async () => {
      await result.current.start({ var1: 'test' });
    });

    expect(result.current.processId).toBe('123');
    expect(result.current.isStarted).toBe(true);
    expect(result.current.variables.var1).toBe('test');
  });

  it('should handle errors with suspense', async () => {
    const error = new Error('Test error');
    (methods.start as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useProcess<TestVariables, TestSteps>('TEST_PROCESS', methods, { suspense: true })
    );

    await expect(
      act(async () => {
        await result.current.start({ var1: 'test' });
      })
    ).rejects.toThrow('Test error');
  });
});