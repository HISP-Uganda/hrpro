import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

type CompanyProfile = {
  companyName: string
  logoDataUrl: string | null
  supportEmail: string
  supportPhone: string
  supportWebsite: string
  copyrightHolder: string
}

function normalizeCompanyName(name?: string): string {
  return (name ?? '').trim()
}

export function getCompanyProfileQueryKey(accessToken: string) {
  return ['company-profile', accessToken] as const
}

export async function fetchCompanyProfile(
  accessToken: string,
  api: {
    getCompanyProfile: (token: string) => Promise<{
      name: string
      logoDataUrl?: string
      supportEmail?: string
      supportPhone?: string
      supportWebsite?: string
      copyrightHolder?: string
    }>
  },
): Promise<CompanyProfile> {
  const profile = await api.getCompanyProfile(accessToken)
  return {
    companyName: normalizeCompanyName(profile.name),
    logoDataUrl: profile.logoDataUrl?.trim() || null,
    supportEmail: (profile.supportEmail ?? '').trim(),
    supportPhone: (profile.supportPhone ?? '').trim(),
    supportWebsite: (profile.supportWebsite ?? '').trim(),
    copyrightHolder: (profile.copyrightHolder ?? '').trim(),
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
