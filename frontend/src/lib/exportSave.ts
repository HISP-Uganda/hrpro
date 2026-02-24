import type { AppGateway } from '../types/api'

type ExportPayload = {
  filename: string
  data: string
  mimeType: string
}

export async function saveExportWithDialog(api: AppGateway, payload: ExportPayload): Promise<{ savedPath: string; cancelled: boolean }> {
  const bytes = Array.from(new TextEncoder().encode(payload.data))
  return api.saveFileWithDialog(payload.filename, bytes, payload.mimeType)
}
