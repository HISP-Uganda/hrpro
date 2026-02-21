export type User = {
  id: number
  username: string
  role: string
}

export type Session = {
  accessToken: string
  refreshToken: string
  user: User
}

export type LoginInput = {
  username: string
  password: string
}

export type LoginResult = Session

export type AuthGateway = {
  login: (input: LoginInput) => Promise<LoginResult>
  logout: (refreshToken: string) => Promise<void>
  getMe: (accessToken: string) => Promise<User>
}
