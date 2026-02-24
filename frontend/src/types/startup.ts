export type StartupHealth = {
  dbOk: boolean
  runtimeOk: boolean
  dbError?: string
  runtimeError?: string
}

export type DatabaseConfigInput = {
  host: string
  port: number
  database: string
  user: string
  password: string
  sslmode: string
}
