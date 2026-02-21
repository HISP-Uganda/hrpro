import type { AuthGateway, LoginInput, LoginResult, User } from '../types/auth'

type WailsAppBinding = {
  Login: (input: LoginInput) => Promise<LoginResult>
  Logout: (input: { refreshToken: string }) => Promise<void>
  GetMe: (accessToken: string) => Promise<{ user: User }>
}

declare global {
  interface Window {
    go?: {
      main?: {
        App?: WailsAppBinding
      }
    }
  }
}

function getAppBinding(): WailsAppBinding {
  const binding = window.go?.main?.App
  if (!binding) {
    throw new Error('Wails bindings are unavailable')
  }

  return binding
}

export class WailsAuthGateway implements AuthGateway {
  async login(input: LoginInput): Promise<LoginResult> {
    const app = getAppBinding()
    return app.Login(input)
  }

  async logout(refreshToken: string): Promise<void> {
    const app = getAppBinding()
    await app.Logout({ refreshToken })
  }

  async getMe(accessToken: string): Promise<User> {
    const app = getAppBinding()
    const response = await app.GetMe(accessToken)
    return response.user
  }
}
