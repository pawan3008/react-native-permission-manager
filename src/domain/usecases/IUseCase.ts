/**
 * Generic use case contract (Command pattern / Interface Segregation).
 *
 * Every use case in `src/domain/usecases` implements this single-method
 * interface, keeping each class focused on exactly one responsibility
 * (Single Responsibility Principle) and easily mockable in tests.
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Variant for use cases that take no input (e.g. OpenAppSettingsUseCase).
 */
export interface INoInputUseCase<TOutput> {
  execute(): Promise<TOutput>;
}
