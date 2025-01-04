import { useCallback, useEffect, useRef, useState } from 'react';
import { ProcessMethods, ProcessManager } from './types';
import { createProcessManager } from './process-manager';

type UseProcessState<V extends Record<string, any>, S extends string> = {
  processId: string | null;
  processName: string;
  stepName: S | null;
  variables: Partial<V>;
  isStarted: boolean;
  isFinished: boolean;
  isPending: boolean;
  error: Error | null;
};

type UseProcessResult<V extends Record<string, any>, S extends string> = UseProcessState<V, S> & {
  start: (variables: Partial<V>) => Promise<void>;
  continue: (variables: Partial<V>) => Promise<void>;
};

export function useProcess<V extends Record<string, any>, S extends string>(
  processName: string,
  methods: ProcessMethods<V>,
  options?: { suspense?: boolean }
): UseProcessResult<V, S> {
  const processManager = useRef<ProcessManager<V, S>>();
  const [state, setState] = useState<UseProcessState<V, S>>({
    processId: null,
    processName,
    stepName: null,
    variables: {},
    isStarted: false,
    isFinished: false,
    isPending: false,
    error: null,
  });

  useEffect(() => {
    if (!processManager.current) {
      processManager.current = createProcessManager<V, S>(processName, methods);
    }
  }, [processName, methods]);

  const updateState = useCallback(() => {
    if (!processManager.current) return;

    setState({
      processId: processManager.current.getProcessId(),
      processName,
      stepName: processManager.current.getStepName(),
      variables: processManager.current.getVariables(),
      isStarted: processManager.current.isStarted(),
      isFinished: processManager.current.isFinished(),
      isPending: processManager.current.isPending(),
      error: processManager.current.getError(),
    });
  }, [processName]);

  const start = useCallback(async (variables: Partial<V>) => {
    if (!processManager.current) return;

    try {
      await processManager.current.start(variables);
      updateState();
    } catch (error) {
      if (options?.suspense) {
        throw error;
      }
    }
  }, [updateState, options?.suspense]);

  const continueProcess = useCallback(async (variables: Partial<V>) => {
    if (!processManager.current) return;

    try {
      await processManager.current.continue(variables);
      updateState();
    } catch (error) {
      if (options?.suspense) {
        throw error;
      }
    }
  }, [updateState, options?.suspense]);

  return {
    ...state,
    start,
    continue: continueProcess,
  };
}