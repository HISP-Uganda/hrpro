import type { Session } from '../types/auth'

const STORAGE_KEY = 'hrpro.session'

type Listener = () => void

export class AuthStore {
  private listeners = new Set<Listener>()
  private session: Session | null = this.readInitialSession()

  private readInitialSession(): Session | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as Session
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): Session | null {
    return this.session
  }

  isAuthenticated(): boolean {
    return this.session !== null
  }

  setSession(session: Session): void {
    this.session = session
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    this.emit()
  }

  clear(): void {
    this.session = null
    localStorage.removeItem(STORAGE_KEY)
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}

export const authStore = new AuthStore()
