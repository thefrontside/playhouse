export interface Server {
  close(callback?: (error?: unknown) => void): void;
}
