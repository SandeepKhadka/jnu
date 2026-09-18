'use client'

import { useCallback, useEffect, useState } from 'react'

import { getJson, putJson } from '@/lib/admin-client'
import { SETTING_DEFAULTS, type SettingKey, type SettingValue } from '@/lib/content-types'
import { useStatus } from './ui'

/**
 * Load / edit / save one settings document.
 *
 * Every settings screen works the same way: a local draft, a Save button, and
 * the server's own message on failure. The value the server returns after a
 * save replaces the draft, so what is on screen is always what was stored —
 * including anything the server normalised or dropped.
 */
export function useSetting<K extends SettingKey>(key: K) {
  const [value, setValue] = useState<SettingValue[K]>(SETTING_DEFAULTS[key])
  const [extra, setExtra] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const { status, show, saved } = useStatus()

  const load = useCallback(async () => {
    const res = await getJson<{ value: SettingValue[K] } & Record<string, unknown>>(
      `/api/admin/settings/${key}`
    )
    if (res.ok) {
      const { value: v, ...rest } = res.data
      setValue(v)
      setExtra(rest)
    } else {
      show({ tone: 'error', text: res.error })
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(async () => {
    setBusy(true)
    const res = await putJson<{ value: SettingValue[K] } & Record<string, unknown>>(
      `/api/admin/settings/${key}`,
      { value }
    )
    setBusy(false)
    if (!res.ok) {
      show({ tone: 'error', text: res.error })
      return false
    }
    const { value: v, ...rest } = res.data
    setValue(v)
    setExtra(rest)
    saved()
    return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  /** Updates one field of the draft. */
  const set = useCallback(
    <F extends keyof SettingValue[K]>(field: F, v: SettingValue[K][F]) =>
      setValue((prev) => ({ ...prev, [field]: v })),
    []
  )

  return { value, setValue, set, extra, loading, busy, status, save, show }
}
