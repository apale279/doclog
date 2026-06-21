import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { serializeForExport } from './firestoreCsvExport';
import { formatDayStampItaly } from './pazientiOggiFilter';

function docToViewerRow(doc) {
  const data = doc && typeof doc === 'object' ? doc : {};
  const scheda = data.pmaScheda && typeof data.pmaScheda === 'object' ? data.pmaScheda : {};
  return {
    _docId: data._docId ?? '',
    idPaziente: data.idPaziente ?? '',
    nome: data.nome ?? '',
    cognome: data.cognome ?? '',
    statoPzPma: data.statoPzPma ?? '',
    telefono: data.telefono ?? '',
    email: data.email ?? '',
    codice_fiscale: data.codice_fiscale ?? data.codiceFiscale ?? '',
    pettorale: data.pettorale ?? null,
    codice_colore: scheda.codice_colore ?? '',
    apertura: serializeForExport(data.apertura),
    ingresso_carico_at: serializeForExport(scheda.ingresso_carico_at),
    dimesso_at: serializeForExport(scheda.dimesso_at),
    raw: serializeForExport({ ...data, pmaScheda: scheda }),
  };
}

function buildViewerIndexHtml(meta) {
  const title = `DOCLOG — Pazienti ${meta.dayLabel}`;
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { font-family: system-ui, sans-serif; color: #0f172a; }
    body { margin: 0; background: #f1f5f9; }
    header { background: #0f766e; color: #fff; padding: 1rem 1.25rem; }
    header h1 { margin: 0 0 .35rem; font-size: 1.15rem; }
    header p { margin: 0; font-size: .85rem; opacity: .92; }
    main { display: grid; grid-template-columns: minmax(240px, 340px) 1fr; min-height: calc(100vh - 72px); }
    @media (max-width: 768px) { main { grid-template-columns: 1fr; } #detail { display: none; } #detail.open { display: block; } }
    #list { border-right: 1px solid #cbd5e1; background: #fff; overflow: auto; }
    #list input { width: 100%; box-sizing: border-box; padding: .65rem .75rem; border: 0; border-bottom: 1px solid #e2e8f0; }
    .row { padding: .65rem .75rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .row:hover, .row.sel { background: #ecfeff; }
    .row .id { font-family: ui-monospace, monospace; font-size: .72rem; color: #64748b; }
    .row .name { font-weight: 700; }
    .row .meta { font-size: .75rem; color: #475569; margin-top: .15rem; }
    #detail { padding: 1rem 1.25rem 2rem; overflow: auto; }
    #detail h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
    #detail pre { background: #fff; border: 1px solid #cbd5e1; border-radius: .5rem; padding: .75rem; font-size: .72rem; line-height: 1.45; overflow: auto; white-space: pre-wrap; word-break: break-word; }
    .badge { display: inline-block; border-radius: 999px; padding: .1rem .45rem; font-size: .7rem; font-weight: 700; background: #e2e8f0; }
    .empty { padding: 1rem; color: #64748b; }
    .back { display: none; margin-bottom: .75rem; }
    @media (max-width: 768px) { .back { display: inline-block; } }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>${meta.manifestazioneNome} · ${meta.count} pazienti · esportato ${meta.exportedAt}</p>
  </header>
  <main>
    <div id="list">
      <input type="search" id="q" placeholder="Cerca nome, ID, telefono…" />
      <div id="rows"></div>
    </div>
    <div id="detail"><p class="empty">Seleziona un paziente dall'elenco.</p></div>
  </main>
  <script src="pazienti.js"></script>
  <script>
    const rowsEl = document.getElementById('rows');
    const detailEl = document.getElementById('detail');
    const qEl = document.getElementById('q');
    let selectedId = null;
    function label(p) {
      const n = [p.cognome, p.nome].filter(Boolean).join(' ').trim();
      return n || '(senza nome)';
    }
    function renderList(filter) {
      const f = (filter || '').trim().toLowerCase();
      rowsEl.innerHTML = '';
      const list = (window.PAZIENTI_VIEWER || []).filter(p => {
        if (!f) return true;
        const hay = [p.idPaziente, p.nome, p.cognome, p.telefono, p.codice_fiscale].join(' ').toLowerCase();
        return hay.includes(f);
      });
      if (!list.length) {
        rowsEl.innerHTML = '<p class="empty">Nessun risultato.</p>';
        return;
      }
      for (const p of list) {
        const div = document.createElement('div');
        div.className = 'row' + (p._docId === selectedId ? ' sel' : '');
        div.innerHTML = '<div class="id">' + (p.idPaziente || p._docId) + '</div>'
          + '<div class="name">' + label(p) + '</div>'
          + '<div class="meta"><span class="badge">' + (p.statoPzPma || '—') + '</span>'
          + (p.codice_colore ? ' · ' + p.codice_colore : '') + '</div>';
        div.onclick = () => select(p._docId);
        rowsEl.appendChild(div);
      }
    }
    function select(id) {
      selectedId = id;
      const p = (window.PAZIENTI_VIEWER || []).find(x => x._docId === id);
      if (!p) return;
      renderList(qEl.value);
      detailEl.classList.add('open');
      detailEl.innerHTML = '<button type="button" class="back" onclick="history.back()">← Elenco</button>'
        + '<h2>' + label(p) + '</h2>'
        + '<p><strong>ID:</strong> ' + (p.idPaziente || '—') + ' · <strong>Stato:</strong> ' + (p.statoPzPma || '—') + '</p>'
        + '<pre>' + JSON.stringify(p.raw, null, 2) + '</pre>';
    }
    qEl.oninput = () => renderList(qEl.value);
    renderList('');
  </script>
</body>
</html>`;
}

function buildViewerDataJs(rows) {
  return `window.PAZIENTI_VIEWER = ${JSON.stringify(rows, null, 2)};\n`;
}

function buildReadme(meta) {
  return `DOCLOG — Export pazienti visti oggi
=====================================

Giornata: ${meta.dayLabel}
Manifestazione: ${meta.manifestazioneNome}
Pazienti inclusi: ${meta.count}
Esportato il: ${meta.exportedAt}

Come aprire
-----------
1. Estrai lo ZIP in una cartella
2. Doppio clic su index.html
3. Clicca un paziente per vedere tutti i dati (scheda inclusa)

Nota: funziona offline, senza connessione a Internet.
`;
}

/**
 * Scarica ZIP con viewer HTML offline (stile export CROSS).
 * @param {object[]} pazientiDocs documenti grezzi Firestore (_docId incluso)
 * @param {{ manifestazioneNome?: string, refDate?: Date }} opts
 */
export async function downloadPazientiOggiViewerZip(pazientiDocs, opts = {}) {
  const refDate = opts.refDate ?? new Date();
  const rows = pazientiDocs.map(docToViewerRow);
  const dayLabel = refDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
  const meta = {
    dayLabel,
    manifestazioneNome: opts.manifestazioneNome?.trim() || 'Manifestazione',
    count: rows.length,
    exportedAt: new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
  };

  const zip = new JSZip();
  zip.file('index.html', buildViewerIndexHtml(meta));
  zip.file('pazienti.js', buildViewerDataJs(rows));
  zip.file('LEGGIMI.txt', buildReadme(meta));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const stamp = formatDayStampItaly(refDate);
  saveAs(blob, `DOCLOG_pazienti_oggi_${stamp}.zip`);
  return meta;
}
