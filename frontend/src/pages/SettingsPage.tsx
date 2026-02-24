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
import { getCompanyProfileQueryKey } from '../company/useCompanyProfile'
import { AppShell } from '../components/AppShell'
import { defaultAppSettings } from '../lib/settings'
import type { AppSettings, UpdateSettingsInput } from '../types/settings'

export function SettingsPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const isAdmin = isAdminRole(session?.user.role)

  const [form, setForm] = useState<UpdateSettingsInput>({
    company: { name: defaultAppSettings.company.name, logoPath: defaultAppSettings.company.logoPath },
    currency: defaultAppSettings.currency,
    lunchDefaults: defaultAppSettings.lunchDefaults,
    payrollDisplay: defaultAppSettings.payrollDisplay,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewURL, setLogoPreviewURL] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ severity: 'success' | 'error' | 'info'; message: string } | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['settings', 'app'],
    queryFn: () => router.options.context.api.getSettings(accessToken),
    enabled: Boolean(accessToken),
  })

  const logoQuery = useQuery({
    queryKey: ['settings', 'company-logo', settingsQuery.data?.company.logoPath],
    queryFn: () => router.options.context.api.getCompanyLogo(accessToken),
    enabled: Boolean(accessToken) && Boolean(settingsQuery.data?.company.logoPath),
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
      },
      currency: data.currency,
      lunchDefaults: data.lunchDefaults,
      payrollDisplay: data.payrollDisplay,
    })
  }, [settingsQuery.data])

  useEffect(() => {
    if (!logoQuery.data) {
      setLogoPreviewURL(null)
      return
    }
    const bytes = new Uint8Array(logoQuery.data.data)
    const blob = new Blob([bytes], { type: logoQuery.data.mimeType || 'application/octet-stream' })
    const objectURL = URL.createObjectURL(blob)
    setLogoPreviewURL(objectURL)
    return () => {
      URL.revokeObjectURL(objectURL)
    }
  }, [logoQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => router.options.context.api.updateSettings(accessToken, form),
    onSuccess: async (updated) => {
      await router.options.context.queryClient.setQueryData(['settings', 'app'], updated)
      const existingCompanyProfile = router.options.context.queryClient.getQueryData<{
        companyName: string
        logoDataUrl: string | null
      }>(getCompanyProfileQueryKey(accessToken))
      await router.options.context.queryClient.setQueryData(getCompanyProfileQueryKey(accessToken), {
        companyName: updated.company.name.trim(),
        logoDataUrl: existingCompanyProfile?.logoDataUrl ?? null,
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
      return router.options.context.api.uploadCompanyLogo(accessToken, file.name, Array.from(data))
    },
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'app'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['settings', 'company-logo'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['company-profile'] })
      setLogoFile(null)
      setSnackbar({ severity: 'success', message: 'Company logo uploaded' })
    },
    onError: (error: Error) => {
      setSnackbar({ severity: 'error', message: error.message || 'Failed to upload company logo' })
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

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Button variant="outlined" component="label" startIcon={<UploadFileOutlinedIcon />} disabled={uploadMutation.isPending}>
                      Select Logo
                      <input
                        type="file"
                        accept="image/*"
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
                    <Typography variant="body2" color="text.secondary">
                      {logoFile ? `Selected: ${logoFile.name}` : 'PNG/JPG recommended. Max 5MB.'}
                    </Typography>
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
