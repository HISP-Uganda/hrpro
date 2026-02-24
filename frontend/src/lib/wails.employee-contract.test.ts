import { describe, expect, it, vi } from 'vitest'

import { WailsGateway } from './wails'

describe('WailsGateway employee contract methods', () => {
  it('calls UploadEmployeeContract binding', async () => {
    const UploadEmployeeContract = vi.fn(async () => ({ id: 1 }))
    const RemoveEmployeeContract = vi.fn(async () => ({ id: 1 }))
    ;(window as any).go = {
      main: {
        App: {
          UploadEmployeeContract,
          RemoveEmployeeContract,
        },
      },
    }

    const gateway = new WailsGateway()
    await gateway.uploadEmployeeContract('token', 7, 'contract.pdf', 'application/pdf', [1, 2, 3])

    expect(UploadEmployeeContract).toHaveBeenCalledWith({
      accessToken: 'token',
      employeeId: 7,
      filename: 'contract.pdf',
      mimeType: 'application/pdf',
      data: [1, 2, 3],
    })
  })

  it('calls RemoveEmployeeContract binding', async () => {
    const UploadEmployeeContract = vi.fn(async () => ({ id: 1 }))
    const RemoveEmployeeContract = vi.fn(async () => ({ id: 1 }))
    ;(window as any).go = {
      main: {
        App: {
          UploadEmployeeContract,
          RemoveEmployeeContract,
        },
      },
    }

    const gateway = new WailsGateway()
    await gateway.removeEmployeeContract('token', 7)

    expect(RemoveEmployeeContract).toHaveBeenCalledWith({
      accessToken: 'token',
      employeeId: 7,
    })
  })
})
