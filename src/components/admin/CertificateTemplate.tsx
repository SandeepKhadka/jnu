'use client'

import { site } from '@/content/site'
import type { CertificateRecord } from '@/lib/store'

/**
 * Printable degree certificate.
 *
 * The SPECIMEN watermark is not decoration and must not be removed. This is an
 * academic project, and an unmarked replica of a real university's degree is a
 * forgery whatever the intent behind producing it — particularly for this
 * institution, whose degrees were invalidated at scale after certificates were
 * sold. The watermark is rendered in the document flow (not a CSS background)
 * and carries `print-color-adjust: exact`, so it survives printing and PDF
 * export rather than being dropped as a background graphic.
 *
 * When the client supplies the real certificate sample, restyle the border,
 * type and seal here — the layout is intentionally isolated in this one file.
 * Keep the watermark.
 */
export function CertificateTemplate({ cert }: { cert: CertificateRecord }) {
  const issued = new Date(`${cert.issued_on}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="cert-sheet" role="document" aria-label="Specimen degree certificate">
      {/* Ornamental double border, era- and document-appropriate. */}
      <div className="cert-frame">
        <div className="cert-inner">
          {/* ---- watermark: in flow, prints, non-negotiable ---- */}
          <div className="cert-watermark" aria-hidden="true">
            <span>SPECIMEN</span>
            <span className="cert-watermark-sub">ACADEMIC PROJECT · NOT A VALID DEGREE</span>
          </div>

          <header className="cert-head">
            <div className="cert-seal" aria-hidden="true">
              JNU
            </div>
            <h1 className="cert-name">{site.name}</h1>
            <p className="cert-sub">
              {site.campus.lines[0]} · Jodhpur · Rajasthan · India
            </p>
            <div className="cert-rule" aria-hidden="true" />
          </header>

          <section className="cert-body">
            <p className="cert-lead">This is to certify that</p>

            <p className="cert-student">{cert.student_name}</p>

            <p className="cert-lead">
              having been examined and found qualified, has this day been admitted to the
              degree of
            </p>

            <p className="cert-degree">{cert.programme}</p>

            <p className="cert-lead">
              in the year <strong>{cert.award_year}</strong>, and placed in the
            </p>

            <p className="cert-division">{cert.division}</p>
          </section>

          <footer className="cert-foot">
            <dl className="cert-meta">
              <div>
                <dt>Certificate No.</dt>
                <dd className="tnum">{cert.certificate_no}</dd>
              </div>
              <div>
                <dt>Enrollment No.</dt>
                <dd className="tnum">{cert.enrollment_no}</dd>
              </div>
              <div>
                <dt>Date of Issue</dt>
                <dd className="tnum">{issued}</dd>
              </div>
            </dl>

            <div className="cert-signs">
              <div className="cert-sign">
                <span className="cert-sign-line" aria-hidden="true" />
                <span className="cert-sign-role">Registrar</span>
              </div>
              <div className="cert-sign">
                <span className="cert-sign-line" aria-hidden="true" />
                <span className="cert-sign-role">Vice-Chancellor</span>
              </div>
            </div>

            <p className="cert-verify">
              Verify this certificate at {site.url.replace(/^https?:\/\//, '')}/verify/ using
              the certificate number above.
            </p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .cert-sheet {
          background: #fff;
          padding: 10px;
          /* A4 landscape proportions, so print output matches the screen. */
          max-width: 1040px;
          margin: 0 auto;
          color: #1a1a1a;
        }
        .cert-frame {
          border: 6px double #1f4480;
          padding: 6px;
        }
        .cert-inner {
          position: relative;
          overflow: hidden;
          border: 1px solid #c8a24a;
          padding: 34px 40px 26px;
          background:
            radial-gradient(circle at 12% 10%, rgba(200, 162, 74, 0.07), transparent 42%),
            radial-gradient(circle at 88% 90%, rgba(31, 68, 128, 0.06), transparent 42%),
            #fffdf7;
        }

        /* ---- watermark ---- */
        .cert-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: rotate(-24deg);
          pointer-events: none;
          z-index: 2;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cert-watermark span {
          font-family: 'Trebuchet MS', Arial, sans-serif;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: rgba(168, 50, 43, 0.17);
          font-size: clamp(38px, 9vw, 104px);
          line-height: 1;
          white-space: nowrap;
        }
        .cert-watermark-sub {
          font-size: clamp(9px, 1.6vw, 16px) !important;
          letter-spacing: 0.22em !important;
          color: rgba(168, 50, 43, 0.28) !important;
          margin-top: 10px;
        }

        /* ---- header ---- */
        .cert-head {
          position: relative;
          z-index: 3;
          text-align: center;
        }
        .cert-seal {
          width: 62px;
          height: 62px;
          margin: 0 auto 12px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(to bottom, #3d87c8, #185484);
          color: #fff;
          font-family: 'Trebuchet MS', Arial, sans-serif;
          font-weight: 700;
          font-size: 19px;
          letter-spacing: 0.05em;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cert-name {
          margin: 0;
          font-family: 'Trebuchet MS', Georgia, serif;
          font-size: clamp(20px, 3.4vw, 31px);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #123f63;
          line-height: 1.2;
        }
        .cert-sub {
          margin: 6px 0 0;
          font-size: 11.5px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .cert-rule {
          width: 130px;
          height: 2px;
          margin: 16px auto 0;
          background: #c8a24a;
        }

        /* ---- body ---- */
        .cert-body {
          position: relative;
          z-index: 3;
          text-align: center;
          padding: 22px 0 8px;
        }
        .cert-lead {
          margin: 12px 0 0;
          font-size: 13.5px;
          color: #333;
        }
        .cert-student {
          margin: 10px 0 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(24px, 4.4vw, 40px);
          font-style: italic;
          color: #123f63;
          line-height: 1.15;
        }
        .cert-degree {
          margin: 10px 0 0;
          font-family: 'Trebuchet MS', Arial, sans-serif;
          font-size: clamp(16px, 2.6vw, 23px);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #1a1a1a;
          line-height: 1.25;
        }
        .cert-division {
          margin: 8px 0 0;
          font-size: 15px;
          font-weight: 600;
          color: #a86d2b;
        }

        /* ---- footer ---- */
        .cert-foot {
          position: relative;
          z-index: 3;
          margin-top: 26px;
          border-top: 1px solid #e0d8c4;
          padding-top: 16px;
        }
        .cert-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px 18px;
          margin: 0 0 26px;
          text-align: center;
        }
        .cert-meta dt {
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8a8a8a;
        }
        .cert-meta dd {
          margin: 3px 0 0;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1a1a;
          word-break: break-word;
        }
        .cert-signs {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          padding: 0 4%;
        }
        .cert-sign {
          text-align: center;
          min-width: 150px;
        }
        .cert-sign-line {
          display: block;
          height: 1px;
          background: #555;
          margin-bottom: 6px;
        }
        .cert-sign-role {
          font-size: 10.5px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: #444;
        }
        .cert-verify {
          margin: 20px 0 0;
          text-align: center;
          font-size: 10px;
          color: #8a8a8a;
        }

        .tnum {
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 640px) {
          .cert-inner {
            padding: 22px 18px 18px;
          }
          .cert-meta {
            grid-template-columns: 1fr;
          }
          .cert-signs {
            flex-direction: column;
            gap: 26px;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
