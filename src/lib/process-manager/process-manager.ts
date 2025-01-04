import {
  ProcessManager,
  ProcessMethods,
  ProcessState,
  ProcessVariable,
  ProcessVariables,
} from './types';

export class ProcessManagerImpl<V extends Record<string, any>, S extends string> implements ProcessManager<V, S> {
  private state: ProcessState<V, S>;
  private readonly processName: string;
  private readonly methods: ProcessMethods<V>;

  constructor(processName: string, methods: ProcessMethods<V>) {
    this.processName = processName;
    this.methods = methods;
    this.state = {
      processId: null,
      processName: null,
      stepName: null,
      variables: {},
      isStarted: false,
      isFinished: false,
      isPending: false,
      error: null,
    };
  }

  private transformVariablesToArray(variables: Partial<V>): ProcessVariables {
    return Object.entries(variables).map(([name, value]) => ({
      name,
      value,
    }));
  }

  private transformVariablesToObject(variables: ProcessVariables): Partial<V> {
    return variables.reduce((acc, { name, value }) => ({
      ...acc,
      [name]: value,
    }), {});
  }

  private updateState(variables: ProcessVariables, processId: string, stepName: S, finished: boolean) {
    this.state = {
      ...this.state,
      processId,
      processName: this.processName,
      stepName,
      variables: {
        ...this.state.variables,
        ...this.transformVariablesToObject(variables),
      },
      isStarted: true,
      isFinished: finished,
      isPending: false,
      error: null,
    };
  }

  async start(variables: Partial<V>): Promise<void> {
    try {
      this.state.isPending = true;
      const response = await this.methods.start({
        processName: this.processName,
        variables: this.transformVariablesToArray(variables),
      });
      this.updateState(response.variables, response.processId, response.stepName as S, response.finished);
    } catch (error) {
      this.state.error = error as Error;
      this.state.isPending = false;
      throw error;
    }
  }

  async continue(variables: Partial<V>): Promise<void> {
    if (!this.state.processId) {
      throw new Error('Process not started');
    }
    if (this.state.isFinished) {
      throw new Error('Process already finished');
    }

    try {
      this.state.isPending = true;
      const response = await this.methods.continue(this.state.processId, {
        variables: this.transformVariablesToArray(variables),
      });
      this.updateState(response.variables, response.processId, response.stepName as S, response.finished);
    } catch (error) {
      this.state.error = error as Error;
      this.state.isPending = false;
      throw error;
    }
  }

  async refresh(): Promise<void> {
    if (!this.state.processId) {
      throw new Error('Process not started');
    }

    try {
      this.state.isPending = true;
      const response = await this.methods.get(this.state.processId);
      this.updateState(response.variables, response.processId, response.stepName as S, response.finished);
    } catch (error) {
      this.state.error = error as Error;
      this.state.isPending = false;
      throw error;
    }
  }

  getVariable<K extends keyof V>(name: K): V[K] | undefined {
    return this.state.variables[name];
  }

  getVariables(): Partial<V> {
    return this.state.variables;
  }

  getProcessId(): string | null {
    return this.state.processId;
  }

  isStarted(): boolean {
    return this.state.isStarted;
  }

  isFinished(): boolean {
    return this.state.isFinished;
  }

  isPending(): boolean {
    return this.state.isPending;
  }

  hasError(): boolean {
    return this.state.error !== null;
  }

  getError(): Error | null {
    return this.state.error;
  }

  getStepName(): S | null {
    return this.state.stepName;
  }
}

export function createProcessManager<V extends Record<string, any>, S extends string>(
  processName: string,
  methods: ProcessMethods<V>
): ProcessManager<V, S> {
  return new ProcessManagerImpl<V, S>(processName, methods);
}