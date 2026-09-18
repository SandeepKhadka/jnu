'use client'

import { ImageField } from '@/components/admin/MediaPicker'
import { useSetting } from '@/components/admin/useSetting'
import { Button, Card, Loading, PageHeader, Row, StatusLine } from '@/components/admin/ui'

type Previews = { logoId: string | null; crestId: string | null; ogImageId: string | null }

/** Logo, crest/favicon and the image used when the site is shared. */
export default function BrandingPage() {
  const { value, set, extra, loading, busy, status, save } = useSetting('branding')
  const previews = (extra.previews ?? {}) as Previews
  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Logo & branding"
        description="Replacing an image here updates it everywhere on the website at once — header, footer, favicon and social previews."
        actions={
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />
      <StatusLine status={status} />

      <Card title="Images">
        <Row cols={1}>
          <ImageField
            label="Logo"
            hint="The full lockup with the university name. Shown in the header and footer. A wide PNG with a transparent background works best; it is served at several sizes automatically."
            url={previews.logoId ?? null}
            height={72}
            onPick={(m) => set('logoId', m.id)}
            onClear={() => set('logoId', null)}
          />
          <ImageField
            label="Crest (favicon)"
            hint="The round emblem on its own. Used for the browser tab icon, the phone home-screen icon and the printed marksheet. Square, ideally 512×512 or larger."
            url={previews.crestId ?? null}
            height={72}
            onPick={(m) => set('crestId', m.id)}
            onClear={() => set('crestId', null)}
          />
          <ImageField
            label="Share image"
            hint="Shown when a link to the site is posted on WhatsApp, Facebook or LinkedIn. 1200×630 works best, and keep it under about 300 KB or WhatsApp will not show it."
            url={previews.ogImageId ?? null}
            height={96}
            onPick={(m) => set('ogImageId', m.id)}
            onClear={() => set('ogImageId', null)}
          />
        </Row>
        <p className="m-0 mt-4 text-[12px] text-muted">
          Leave any of these empty to use the files shipped with the site.
        </p>
      </Card>

      <Button onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
