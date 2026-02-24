import { useEffect, useMemo, useState } from 'react'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined'
import LunchDiningOutlinedIcon from '@mui/icons-material/LunchDiningOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { isAdminRole } from '../auth/roles'
import { getCompanyProfileQueryKey, useCompanyProfile } from '../company/useCompanyProfile'
import { AppShell } from '../components/AppShell'
import { defaultAppSettings } from '../lib/settings'
import type { AppSettings, SaveCompanyProfileInput, UpdateSettingsInput } from '../types/settings'

export function SettingsPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const isAdmin = isAdminRole(session?.user.role)

  const [form, setForm] = useState<UpdateSettingsInput>({
    company: {
      name: defaultAppSettings.company.name,
      logoPath: defaultAppSettings.company.logoPath,
      supportEmail: defaultAppSettings.company.supportEmail,
      supportPhone: defaultAppSettings.company.supportPhone,
      supportWebsite: defaultAppSettings.company.supportWebsite,
      copyrightHolder: defaultAppSettings.company.copyrightHolder,
    },
    currency: defaultAppSettings.currency,
    lunchDefaults: defaultAppSettings.lunchDefaults,
    payrollDisplay: defaultAppSettings.payrollDisplay,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoURLInput, setLogoURLInput] = useState('')
  const [logoURLValidationError, setLogoURLValidationError] = useState('')
  const [snackbar, setSnackbar] = useState<{ severity: 'success' | 'error' | 'info'; message: string } | null>(null)

  const companyProfileQuery = useCompanyProfile()
  const logoPreviewURL = companyProfileQuery.data?.logoDataUrl ?? null

  const settingsQuery = useQuery({
    queryKey: ['settings', 'app'],
    queryFn: () => router.options.context.api.getSettings(accessToken),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    if (!settingsQuery.data) {
      return
    }
    const data = settingsQuery.data
    setForm({
      company: {
        name: data.company.name,
        logoPath: data.company.logoPath,
        supportEmail: data.company.supportEmail ?? '',
        supportPhone: data.company.supportPhone ?? '',
        supportWebsite: data.company.supportWebsite ?? '',
        copyrightHolder: data.company.copyrightHolder ?? '',
      },
      currency: data.currency,
      lunchDefaults: data.lunchDefaults,
      payrollDisplay: data.payrollDisplay,
    })
  }, [settingsQuery.data])

  const applyCompanyProfileCache = async (profile: {
    name: string
    logoDataUrl?: string
    supportEmail?: string
    supportPhone?: string
    supportWebsite?: string
    copyrightHolder?: string
  }) => {
    await router.options.context.queryClient.setQueryData(getCompanyProfileQueryKey(accessToken), {
      companyName: profile.name?.trim() ?? '',
      logoDataUrl: profile.logoDataUrl?.trim() || null,
      supportEmail: profile.supportEmail?.trim() ?? '',
      supportPhone: profile.supportPhone?.trim() ?? '',
      supportWebsite: profile.supportWebsite?.trim() ?? '',
      copyrightHolder: profile.copyrightHolder?.trim() ?? '',
    })
    await router.options.context.queryClient.invalidateQueries({ queryKey: ['company-profile'] })
  }

  const saveCompanyProfileMutation = useMutation({
    mutationFn: async () => {
      const payload: SaveCompanyProfileInput = {
        name: form.company.name,
        supportEmail: form.company.supportEmail,
        supportPhone: form.company.supportPhone,
        supportWebsite: form.company.supportWebsite,
        copyrightHolder: form.company.copyrightHolder,
      }
      return router.options.context.api.saveCompanyProfile(accessToken, payload)
    },
    onSuccess: async (profile) => {
      await applyCompanyProfileCache(profile)
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      setSnackbar({ severity: 'success', message: 'Company profile updated' })
    },
    onError: (error: Error) => {
      setSnackbar({ severity: 'error', message: error.message || 'Failed to update company profile' })
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => router.options.context.api.updateSettings(accessToken, form),
    onSuccess: async (updated) => {
      await router.options.context.queryClient.setQueryData(['settings', 'app'], updated)
      await router.options.context.queryClient.setQueryData(getCompanyProfileQueryKey(accessToken), {
        companyName: updated.company.name.trim(),
        logoDataUrl: companyProfileQuery.data?.logoDataUrl ?? null,
        supportEmail: updated.company.supportEmail ?? '',
        supportPhone: updated.company.supportPhone ?? '',
        supportWebsite: updated.company.supportWebsite ?? '',
        copyrightHolder: updated.company.copyrightHolder ?? '',
      })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['company-profile'] })
      setSnackbar({ severity: 'success', message: 'Settings updated' })
    },
    onError: (error: Error) => {
      setSnackbar({ severity: 'error', message: error.message || 'Failed to update settings' })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const data = new Uint8Array(await file.arrayBuffer())
      return router.options.context.api.uploadCompanyLogo(accessToken, file.name, file.type || 'application/octet-stream', Array.from(data))
    },
    onSuccess: async (profile) => {
      await applyCompanyProfileCache(profile)
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      setLogoFile(null)
      setSnackbar({ severity: 'success', message: 'Company logo uploaded' })
    },
    onError: (error: Error) => {
      setSnackbar({ severity: 'error', message: error.message || 'Failed to upload company logo' })
    },
  })

  const importFromURLMutation = useMutation({
    mutationFn: async () => router.options.context.api.importCompanyLogoFromURL(accessToken, logoURLInput.trim()),
    onSuccess: async (profile) => {
      await applyCompanyProfileCache(profile)
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      setLogoURLInput('')
      setLogoURLValidationError('')
      setSnackbar({ severity: 'success', message: 'Company logo imported' })
    },
    onError: (error: Error) => {
      setSnackbar({ severity: 'error', message: error.message || 'Failed to import company logo from URL' })
    },
  })

  const removeLogoMutation = useMutation({
    mutationFn: async () => router.options.context.api.removeCompanyLogo(accessToken),
    onSuccess: async (profile) => {
      await applyCompanyProfileCache(profile)
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      setSnackbar({ severity: 'success', message: 'Company logo removed' })
    },
    onError: (error: Error) => {
      setSnackbar({ severity: 'error', message: error.message || 'Failed to remove company logo' })
    },
  })

  const hasValidationError = useMemo(() => {
    if (!form.company.name.trim()) return true
    if (!form.currency.code.trim()) return true
    if (!form.currency.symbol.trim()) return true
    if (form.currency.decimals < 0 || form.currency.decimals > 6) return true
    if (form.lunchDefaults.plateCostAmount <= 0) return true
    if (form.lunchDefaults.staffContributionAmount < 0) return true
    if (form.payrollDisplay.decimals < 0 || form.payrollDisplay.decimals > 6) return true
    return false
  }, [form])

  if (!isAdmin) {
    return (
      <AppShell title="Settings">
        <Alert severity="error">Settings are restricted to Admin users.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell title="Settings">
      <Stack spacing={2.5}>
        {settingsQuery.isLoading ? (
          <Stack spacing={1.2}>
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={240} />
            <Skeleton variant="rounded" height={240} />
          </Stack>
        ) : null}

        {settingsQuery.isError ? <Alert severity="error">{(settingsQuery.error as Error).message}</Alert> : null}

        {!settingsQuery.isLoading && !settingsQuery.isError ? (
          <>
            <Card elevation={1}>
              <CardHeader title="Company Profile" subheader="Manage organization identity" avatar={<BusinessOutlinedIcon />} />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="Company Name"
                    value={form.company.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, company: { ...prev.company, name: event.target.value } }))}
                    fullWidth
                  />
                  <TextField
                    label="Support Email"
                    value={form.company.supportEmail ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, company: { ...prev.company, supportEmail: event.target.value } }))}
                    fullWidth
                  />
                  <TextField
                    label="Support Phone"
                    value={form.company.supportPhone ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, company: { ...prev.company, supportPhone: event.target.value } }))}
                    fullWidth
                  />
                  <TextField
                    label="Support Website"
                    value={form.company.supportWebsite ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, company: { ...prev.company, supportWebsite: event.target.value } }))}
                    fullWidth
                  />
                  <TextField
                    label="Copyright Holder"
                    value={form.company.copyrightHolder ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, company: { ...prev.company, copyrightHolder: event.target.value } }))}
                    helperText="Defaults to company name when empty"
                    fullWidth
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Button variant="outlined" component="label" startIcon={<UploadFileOutlinedIcon />} disabled={uploadMutation.isPending}>
                      Select Logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          setLogoFile(file ?? null)
                        }}
                      />
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!logoFile || uploadMutation.isPending}
                      onClick={() => {
                        if (logoFile) {
                          uploadMutation.mutate(logoFile)
                        }
                      }}
                    >
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    <Typography variant="body2" color="text.secondary" data-testid="logo-file-hint">
                      {logoFile ? `Selected: ${logoFile.name}` : 'PNG/JPG/WEBP only. Max 2MB.'}
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <TextField
                      label="Import Logo from URL"
                      placeholder="https://example.com/logo.png"
                      value={logoURLInput}
                      onChange={(event) => {
                        setLogoURLInput(event.target.value)
                        if (logoURLValidationError) {
                          setLogoURLValidationError('')
                        }
                      }}
                      error={Boolean(logoURLValidationError)}
                      helperText={logoURLValidationError || 'Only http(s) image URLs are allowed'}
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      disabled={importFromURLMutation.isPending}
                      onClick={() => {
                        const trimmed = logoURLInput.trim()
                        if (!trimmed) {
                          setLogoURLValidationError('Logo URL is required')
                          return
                        }
                        try {
                          const parsed = new URL(trimmed)
                          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                            setLogoURLValidationError('Only http(s) URLs are allowed')
                            return
                          }
                        } catch {
                          setLogoURLValidationError('Enter a valid URL')
                          return
                        }
                        setLogoURLValidationError('')
                        importFromURLMutation.mutate()
                      }}
                    >
                      {importFromURLMutation.isPending ? 'Importing...' : 'Import URL'}
                    </Button>
                    {logoPreviewURL ? (
                      <Button
                        variant="text"
                        color="error"
                        data-testid="remove-logo-button"
                        disabled={removeLogoMutation.isPending}
                        onClick={() => removeLogoMutation.mutate()}
                      >
                        {removeLogoMutation.isPending ? 'Removing...' : 'Remove Logo'}
                      </Button>
                    ) : null}
                  </Stack>

                  <Box
                    sx={{
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      minHeight: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                    }}
                  >
                    {logoPreviewURL ? (
                      <Box component="img" src={logoPreviewURL} alt="Company logo" sx={{ maxHeight: 96, maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No logo uploaded</Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" disabled={saveCompanyProfileMutation.isPending} onClick={() => saveCompanyProfileMutation.mutate()}>
                {saveCompanyProfileMutation.isPending ? 'Saving Company Profile...' : 'Save Company Profile'}
              </Button>
            </Stack>

            <Card elevation={1}>
              <CardHeader title="Currency" subheader="Used for formatting across payroll and reports" avatar={<CurrencyExchangeOutlinedIcon />} />
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Currency Code"
                    value={form.currency.code}
                    onChange={(event) => setForm((prev) => ({ ...prev, currency: { ...prev.currency, code: event.target.value.toUpperCase() } }))}
                    helperText="Example: TZS, USD"
                    sx={{ width: { xs: '100%', md: 220 } }}
                  />
                  <TextField
                    label="Currency Symbol"
                    value={form.currency.symbol}
                    onChange={(event) => setForm((prev) => ({ ...prev, currency: { ...prev.currency, symbol: event.target.value } }))}
                    sx={{ width: { xs: '100%', md: 220 } }}
                  />
                  <TextField
                    label="Currency Decimals"
                    type="number"
                    value={form.currency.decimals}
                    onChange={(event) => setForm((prev) => ({ ...prev, currency: { ...prev.currency, decimals: Number(event.target.value || 0) } }))}
                    inputProps={{ min: 0, max: 6 }}
                    sx={{ width: { xs: '100%', md: 220 } }}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={1}>
              <CardHeader title="Lunch Defaults" subheader="Default values used when daily lunch records are initialized" avatar={<LunchDiningOutlinedIcon />} />
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Plate Cost"
                    type="number"
                    value={form.lunchDefaults.plateCostAmount}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lunchDefaults: { ...prev.lunchDefaults, plateCostAmount: Number(event.target.value || 0) },
                      }))
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: { xs: '100%', md: 240 } }}
                  />
                  <TextField
                    label="Staff Contribution"
                    type="number"
                    value={form.lunchDefaults.staffContributionAmount}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lunchDefaults: { ...prev.lunchDefaults, staffContributionAmount: Number(event.target.value || 0) },
                      }))
                    }
                    inputProps={{ min: 0 }}
                    sx={{ width: { xs: '100%', md: 240 } }}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={1}>
              <CardHeader title="Payroll Display" subheader="Formatting options for payroll views and exports" avatar={<PaidOutlinedIcon />} />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="Payroll Decimals"
                    type="number"
                    value={form.payrollDisplay.decimals}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        payrollDisplay: { ...prev.payrollDisplay, decimals: Number(event.target.value || 0) },
                      }))
                    }
                    inputProps={{ min: 0, max: 6 }}
                    sx={{ width: { xs: '100%', md: 240 } }}
                  />

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Switch
                      checked={form.payrollDisplay.roundingEnabled}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          payrollDisplay: { ...prev.payrollDisplay, roundingEnabled: event.target.checked },
                        }))
                      }
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enable rounding at configured decimal precision
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" disabled={hasValidationError || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </>
        ) : null}
      </Stack>

      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.message}</Alert> : <span />}
      </Snackbar>
    </AppShell>
  )
}
