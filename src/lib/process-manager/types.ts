export type ProcessVariable = {
  name: string;
  value: any;
};

export type ProcessVariables = ProcessVariable[];

export type ProcessResponse = {
  processId: string;
  processName: string;
  stepName: string;
  variables: ProcessVariables;
  finished: boolean;
};

export type ProcessStartRequest = {
  processName: string;
  variables: ProcessVariables;
};

export type ProcessContinueRequest = {
  variables: ProcessVariables;
};

export type ProcessMethods<V extends Record<string, any>> = {
  start: (request: ProcessStartRequest) => Promise<ProcessResponse>;
  continue: (processId: string, request: ProcessContinueRequest) => Promise<ProcessResponse>;
  get: (processId: string) => Promise<ProcessResponse>;
};

export type ProcessState<V extends Record<string, any>, S extends string> = {
  processId: string | null;
  processName: string | null;
  stepName: S | null;
  variables: Partial<V>;
  isStarted: boolean;
  isFinished: boolean;
  isPending: boolean;
  error: Error | null;
};

export type ProcessManager<V extends Record<string, any>, S extends string> = {
  start: (variables: Partial<V>) => Promise<void>;
  continue: (variables: Partial<V>) => Promise<void>;
  getVariable: <K extends keyof V>(name: K) => V[K] | undefined;
  getVariables: () => Partial<V>;
  getProcessId: () => string | null;
  isStarted: () => boolean;
  isFinished: () => boolean;
  isPending: () => boolean;
  hasError: () => boolean;
  getError: () => Error | null;
  getStepName: () => S | null;
  refresh: () => Promise<void>;
};