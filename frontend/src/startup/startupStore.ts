import type { StartupHealth } from '../types/startup'

type Listener = () => void

export class StartupStore {
  private listeners = new Set<Listener>()
  private health: StartupHealth = {
    dbOk: false,
    runtimeOk: false,
    dbError: 'Database status not loaded yet.',
    runtimeError: 'Runtime status not loaded yet.',
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): StartupHealth {
    return this.health
  }

  setHealth(health: StartupHealth): void {
    this.health = health
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}
