import jsPDF from 'jspdf'

const LABELS = {
  problems:          'PROBLEMI',
  alternatives:      'ALTERNATIVE ESISTENTI',
  solutions:         'SOLUZIONI',
  uvp:               'UNIQUE VALUE PROPOSITION',
  unfair_advantage:  'UNFAIR ADVANTAGE',
  customer_segments: 'CUSTOMER SEGMENTS',
  early_adopters:    'EARLY ADOPTERS',
  channels:          'CHANNELS',
  key_metrics:       'METRICHE CHIAVE',
  cost_structure:    'COST STRUCTURE',
  revenue_streams:   'REVENUE STREAMS',
}

const HEADER_COLORS = {
  problems:          [220, 53,  53],
  alternatives:      [220, 53,  53],
  solutions:         [52,  168, 83],
  uvp:               [66,  133, 244],
  unfair_advantage:  [251, 188, 4],
  customer_segments: [66,  133, 244],
  early_adopters:    [66,  133, 244],
  channels:          [52,  168, 83],
  key_metrics:       [251, 188, 4],
  cost_structure:    [100, 100, 100],
  revenue_streams:   [100, 100, 100],
}

export function generateLeanCanvasPDF(canvas, blocks) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })

  const PW = 420
  const PH = 297
  const M  = 10

  // Sfondo bianco
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, PW, PH, 'F')

  // Titolo
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(30, 30, 30)
  pdf.text(`LEAN CANVAS — ${canvas.name.toUpperCase()}`, PW / 2, M + 5, { align: 'center' })

  // Layout dimensioni
  const TOP_Y  = M + 12
  const BW     = PW - M * 2          // body width
  const COL    = BW / 5              // larghezza colonna base
  const R1H    = 80                  // riga 1
  const R2H    = 55                  // riga 2
  const R3H    = 45                  // riga 3 cost/revenue
  const UVP_H  = R1H + R2H + 1      // UVP occupa entrambe le righe

  // Helper: disegna blocco
  const drawBlock = (type, x, y, w, h) => {
    const [r, g, b] = HEADER_COLORS[type]
    const label     = LABELS[type]
    const content   = blocks[type] || ''

    // Bordo esterno grigio
    pdf.setDrawColor(180, 180, 180)
    pdf.setLineWidth(0.3)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(x, y, w, h, 'FD')

    // Header colorato
    pdf.setFillColor(r, g, b)
    pdf.rect(x, y, w, 8, 'F')

    // Label header bianca
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    pdf.setTextColor(255, 255, 255)
    pdf.text(label, x + w / 2, y + 5.2, { align: 'center' })

    // Testo contenuto nero
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.2)
    pdf.setTextColor(30, 30, 30)

    if (content) {
      const lines   = pdf.splitTextToSize(content, w - 5)
      const maxH    = h - 11
      const lineH   = 3.4
      const maxLines = Math.floor(maxH / lineH)
      pdf.text(lines.slice(0, maxLines), x + 2.5, y + 12)
    }
  }

  // ── Riga 1: Problemi | Soluzioni | UVP (tall) | Unfair | Customer ───
  const r1y = TOP_Y
  drawBlock('problems',          M,              r1y, COL,     R1H)
  drawBlock('solutions',         M + COL,        r1y, COL,     R1H)
  drawBlock('uvp',               M + COL * 2,    r1y, COL,     UVP_H)   // UVP alta
  drawBlock('unfair_advantage',  M + COL * 3,    r1y, COL,     R1H)
  drawBlock('customer_segments', M + COL * 4,    r1y, COL,     R1H)

  // ── Riga 2: Alternative | Channels | (UVP continua) | Key Metrics | Early ──
  const r2y = TOP_Y + R1H + 1
  drawBlock('alternatives',  M,              r2y, COL,  R2H)
  drawBlock('channels',      M + COL,        r2y, COL,  R2H)
  // colonna 3 = UVP già disegnata sopra
  drawBlock('key_metrics',   M + COL * 3,    r2y, COL,  R2H)
  drawBlock('early_adopters', M + COL * 4,   r2y, COL,  R2H)

  // ── Riga 3: Cost Structure | Revenue Streams ─────────────────────────
  const r3y = r2y + R2H + 1
  drawBlock('cost_structure',  M,             r3y, BW / 2, R3H)
  drawBlock('revenue_streams', M + BW / 2,    r3y, BW / 2, R3H)

  // ── Linea separatrice verticale centrale (colonna UVP) ───────────────
  // già gestita dai bordi dei blocchi

  // ── Footer ───────────────────────────────────────────────────────────
  pdf.setFontSize(5)
  pdf.setTextColor(150, 150, 150)
  pdf.text(
    `© 2013 Lean Startup Machine — SG Calendar — ${new Date().toLocaleDateString('it-IT')}`,
    PW / 2, PH - 4, { align: 'center' }
  )

  pdf.save(`lean-canvas-${canvas.name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}