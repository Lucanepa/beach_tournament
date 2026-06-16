// Admin score editor for the ZuZu Beach board.
//
// Reuses the public TournamentManager (script.js) to load + parse the live
// sheets, then lets the organizer enter set-by-set scores per match. Saving
// POSTs to the PIN-gated /.netlify/functions/update-score, which forwards the
// edit to the Apps Script web app that writes the "Resultate" set cells. The
// sheet's formulas then recompute the result, bracket and standings, and the
// public board picks the change up on its next auto-refresh.
//
// Activated by the 'admin:unlocked' event (with the session token) dispatched
// by admin.html after a successful PIN unlock; torn down on 'admin:locked'.

(function () {
    let loaded = false;
    let rendering = false;

    const els = () => ({
        panel: document.getElementById('scoresPanel'),
        select: document.getElementById('scoresTournament'),
        selectWrap: document.getElementById('scoresTournamentWrap'),
        list: document.getElementById('scoresList'),
        status: document.getElementById('scoresStatus'),
    });

    function getToken() {
        try { return localStorage.getItem('zuzu-admin-token') || ''; } catch (e) { return ''; }
    }

    function matchesFor(key) {
        const data = key === 'women' ? tournament.womenData : tournament.menData;
        const list = (data && data.matches) ? data.matches.slice() : [];
        return list.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
    }

    // Tournaments that actually loaded matches (so we don't offer an empty one).
    function availableTournaments() {
        return Object.keys(DATA_SOURCES).filter(k => matchesFor(k).length > 0);
    }

    async function onUnlocked() {
        const e = els();
        if (!e.panel) return;
        e.status.textContent = '';
        e.list.innerHTML = `<div class="scores-loading">${t('admin.loadingScores')}</div>`;

        try {
            // loadExcelData loads SheetJS on demand and parses both tournaments,
            // without starting the public auto-refresh / "last updated" overlay.
            await tournament.loadExcelData(true);
            loaded = true;
        } catch (err) {
            e.list.innerHTML = `<div class="scores-loading">${escapeHtml(t('admin.saveError'))}</div>`;
            return;
        }

        const avail = availableTournaments();
        if (avail.length === 0) {
            e.list.innerHTML = `<div class="scores-loading">${t('admin.noScores')}</div>`;
            if (e.selectWrap) e.selectWrap.style.display = 'none';
            return;
        }

        // Build the tournament selector; hide it when only one tournament has data.
        e.select.innerHTML = avail.map(k =>
            `<option value="${escapeHtml(k)}">${escapeHtml(tournamentLabel(k))}</option>`).join('');
        if (e.selectWrap) e.selectWrap.style.display = avail.length > 1 ? '' : 'none';
        if (!avail.includes(e.select.value)) e.select.value = avail[0];

        renderList(e.select.value);
    }

    function renderList(key) {
        const e = els();
        const matches = matchesFor(key);
        if (matches.length === 0) {
            e.list.innerHTML = `<div class="scores-loading">${t('admin.noScores')}</div>`;
            return;
        }
        e.list.innerHTML = matches.map(m => rowHtml(m)).join('');
    }

    function rowHtml(m) {
        const num = m.matchNumber || '?';
        const a = escapeHtml(m.team1 && m.team1.teamName ? m.team1.teamName : 'TBD');
        const b = escapeHtml(m.team2 && m.team2.teamName ? m.team2.teamName : 'TBD');
        const round = escapeHtml(m.round && m.round !== 'TBD' ? String(m.round) : '');
        const courtRaw = (m.courtRaw !== undefined && m.courtRaw !== null) ? m.courtRaw : '';
        const sets = Array.isArray(m.sets) ? m.sets : [['', ''], ['', ''], ['', '']];
        const cell = (team, i) => {
            const v = (sets[i] && sets[i][team - 1] !== undefined && sets[i][team - 1] !== null) ? sets[i][team - 1] : '';
            return `<input type="number" inputmode="numeric" min="0" max="99" class="set-input score-input" data-team="${team}" data-set="${i}" value="${escapeHtml(v)}" aria-label="Set ${i + 1}">`;
        };
        return `
            <div class="score-row" data-match="${escapeHtml(num)}">
                <div class="score-row-head">
                    <span class="score-row-num">#${escapeHtml(num)}</span>
                    ${round ? `<span class="score-row-round">${round}</span>` : ''}
                    <label class="score-court">
                        <span class="score-court-label">${escapeHtml(t('admin.courtLabel'))}</span>
                        <input type="number" inputmode="numeric" min="0" max="50" class="set-input score-court-input" value="${escapeHtml(courtRaw)}" aria-label="Court">
                    </label>
                </div>
                <div class="score-grid">
                    <span class="sg-h"></span>
                    <span class="sg-h">1</span>
                    <span class="sg-h">2</span>
                    <span class="sg-h">3</span>
                    <span class="sg-team">${a}</span>
                    ${cell(1, 0)}${cell(1, 1)}${cell(1, 2)}
                    <span class="sg-team">${b}</span>
                    ${cell(2, 0)}${cell(2, 1)}${cell(2, 2)}
                </div>
                <div class="score-row-actions">
                    <span class="score-row-status" role="status"></span>
                    <button type="button" class="btn btn-primary score-save">${t('settings.save')}</button>
                </div>
            </div>`;
    }

    function collectSets(row) {
        // Returns { sets } or { error: 'partial' } when a set has only one score.
        const sets = [];
        for (let i = 0; i < 3; i++) {
            const ai = row.querySelector(`.score-input[data-team="1"][data-set="${i}"]`);
            const bi = row.querySelector(`.score-input[data-team="2"][data-set="${i}"]`);
            const a = ai ? ai.value.trim() : '';
            const b = bi ? bi.value.trim() : '';
            if (a === '' && b === '') { sets.push(null); continue; }
            if (a === '' || b === '') return { error: 'partial' };
            sets.push([parseInt(a, 10), parseInt(b, 10)]);
        }
        // Drop trailing empty sets.
        while (sets.length && sets[sets.length - 1] === null) sets.pop();
        return { sets };
    }

    async function saveRow(row) {
        const e = els();
        const matchNumber = parseInt(row.getAttribute('data-match'), 10);
        const statusEl = row.querySelector('.score-row-status');
        const btn = row.querySelector('.score-save');

        const collected = collectSets(row);
        if (collected.error === 'partial') {
            statusEl.textContent = t('admin.partialSet');
            statusEl.className = 'score-row-status is-error';
            return;
        }

        const courtInput = row.querySelector('.score-court-input');
        const courtVal = courtInput ? courtInput.value.trim() : '';
        const court = courtVal === '' ? '' : parseInt(courtVal, 10);

        const token = getToken();
        if (!token) { sessionExpired(); return; }

        btn.disabled = true;
        statusEl.textContent = t('refresh.loading');
        statusEl.className = 'score-row-status';

        try {
            const res = await fetch('/.netlify/functions/update-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, tournament: e.select.value, matchNumber, sets: collected.sets, court }),
            });
            if (res.status === 401) { sessionExpired(); return; }
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                statusEl.textContent = t('settings.saved');
                statusEl.className = 'score-row-status is-ok';
                // Reflect the saved values in the in-memory data so re-render is correct.
                const m = matchesFor(e.select.value).find(x => x.matchNumber === matchNumber);
                if (m) {
                    m.sets = padSets(collected.sets);
                    m.courtRaw = courtVal === '' ? '' : court;
                    m.court = (court && court !== 0) ? ('Court ' + court) : 'TBD';
                }
            } else {
                statusEl.textContent = t('admin.saveError');
                statusEl.className = 'score-row-status is-error';
            }
        } catch (err) {
            statusEl.textContent = t('admin.saveError');
            statusEl.className = 'score-row-status is-error';
        } finally {
            btn.disabled = false;
            setTimeout(() => { if (statusEl.classList.contains('is-ok')) statusEl.textContent = ''; }, 2500);
        }
    }

    function padSets(sets) {
        const out = [['', ''], ['', ''], ['', '']];
        for (let i = 0; i < 3; i++) {
            if (sets[i]) out[i] = [sets[i][0], sets[i][1]];
        }
        return out;
    }

    function sessionExpired() {
        const e = els();
        if (e.status) {
            e.status.textContent = t('admin.sessionExpired');
            e.status.className = 'scores-status is-error';
        }
        try { localStorage.removeItem('zuzu-admin-token'); } catch (e2) { /* ignore */ }
        document.dispatchEvent(new CustomEvent('admin:sessionExpired'));
    }

    // ── Wiring ──────────────────────────────────────────────────────────
    document.addEventListener('admin:unlocked', onUnlocked);

    document.addEventListener('admin:locked', () => {
        const e = els();
        if (e.list) e.list.innerHTML = '';
        if (e.status) e.status.textContent = '';
    });

    document.addEventListener('appLanguageChanged', () => {
        const e = els();
        if (e.panel && !e.panel.classList.contains('admin-hidden') && loaded) {
            renderList(e.select.value);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const e = els();
        if (!e.panel) return;
        if (e.select) e.select.addEventListener('change', () => renderList(e.select.value));
        if (e.list) e.list.addEventListener('click', (ev) => {
            const btn = ev.target.closest('.score-save');
            if (btn) saveRow(btn.closest('.score-row'));
        });
    });
})();
