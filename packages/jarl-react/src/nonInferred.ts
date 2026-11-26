// `NoInfer<T>` without needing TypeScript 5.4: the deferred conditional keeps a param out of T's inference.
export type NonInferred<T> = [T][T extends unknown ? 0 : never];
