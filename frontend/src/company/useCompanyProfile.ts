import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

type CompanyProfile = {
  companyName: string
  logoDataUrl: string | null
}

function normalizeCompanyName(name?: string): string {
  return (name ?? '').trim()
}

function bytesToBase64(bytes: number[]): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function toDataURL(mimeType: string | undefined, bytes: number[]): string {
  const type = mimeType?.trim() || 'application/octet-stream'
  return `data:${type};base64,${bytesToBase64(bytes)}`
}

export function getCompanyProfileQueryKey(accessToken: string) {
  return ['company-profile', accessToken] as const
}

export async function fetchCompanyProfile(
  accessToken: string,
  api: {
    getSettings: (token: string) => Promise<{ company: { name: string; logoPath?: string } }>
    getCompanyLogo: (token: string) => Promise<{ mimeType: string; data: number[] }>
  },
): Promise<CompanyProfile> {
  const settings = await api.getSettings(accessToken)
  const companyName = normalizeCompanyName(settings.company.name)

  if (!settings.company.logoPath) {
    return {
      companyName,
      logoDataUrl: null,
    }
  }

  try {
    const logo = await api.getCompanyLogo(accessToken)
    return {
      companyName,
      logoDataUrl: toDataURL(logo.mimeType, logo.data),
    }
  } catch {
    return {
      companyName,
      logoDataUrl: null,
    }
  }
}

export function useCompanyProfile() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''

  return useQuery({
    queryKey: getCompanyProfileQueryKey(accessToken),
    queryFn: () => fetchCompanyProfile(accessToken, router.options.context.api),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  })
}

