/*
 *  ThunderAI [https://micz.it/thunderbird-addon-thunderai/]
 *  Copyright (C) 2024 - 2026  Mic (m@micz.it)
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { taLogger } from '../../js/mzta-logger.js';
import { taSummaryStore } from '../../js/mzta-summarystore.js';

let taLog = null;
let summaryStore = null;

document.addEventListener('DOMContentLoaded', async () => {
    let prefs = await browser.storage.sync.get({ do_debug: false });
    taLog = new taLogger("mzta-summarylog-page", prefs.do_debug);
    summaryStore = new taSummaryStore(prefs.do_debug);

    i18n.updateDocument();

    loadSummaryLog();
    initializeStorageListener();

    document.getElementById('btnRefreshSummaryLog').addEventListener('click', loadSummaryLog);
    document.getElementById('btnClearSummaryLog').addEventListener('click', clearSummaryLog);
});

function initializeStorageListener() {
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;

        for (const key of Object.keys(changes)) {
            // Summary records are stored with the prefix "msg:"
            if (key.startsWith('msg:')) {
                const change = changes[key];
                // Refresh when a new record is added (oldValue undefined) or updated
                if (change.oldValue === undefined || change.newValue !== undefined) {
                    loadSummaryLog();
                    return;
                }
            }
        }
    });
}

async function loadSummaryLog() {
    taLog.log("[loadSummaryLog] loading all summaries");
    let summaries = await summaryStore.getAllSummaries();
    if (!summaries) {
        summaries = {};
    }

    // Sort newest summary_date first (RSS-feed style, newest on top).
    const keys = Object.keys(summaries).sort((a, b) => {
        const dateA = summaries[a].summary_date ? new Date(summaries[a].summary_date).getTime() : 0;
        const dateB = summaries[b].summary_date ? new Date(summaries[b].summary_date).getTime() : 0;
        return dateB - dateA;
    });

    const feed = document.getElementById('summarylog_feed');
    feed.textContent = '';

    if (keys.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = browser.i18n.getMessage("summarylog_no_summaries");
        feed.appendChild(empty);
        return;
    }

    for (const messageId of keys) {
        feed.appendChild(buildFeedItem(summaries[messageId]));
    }
}

function buildFeedItem(summary) {
    const item = document.createElement('article');
    item.className = 'feed-item' + (summary.error ? ' error' : '');

    // ── Header: date | from | subject ──
    const header = document.createElement('div');
    header.className = 'feed-item-header';

    const date = document.createElement('span');
    date.className = 'feed-item-date';
    const dateTarget = summary.message_date || summary.summary_date;
    date.textContent = dateTarget ? new Date(dateTarget).toLocaleString() : '';
    header.appendChild(date);

    const from = document.createElement('span');
    from.className = 'feed-item-from';
    const fromText = Array.isArray(summary.from) ? summary.from.join(", ") : summary.from;
    if (fromText) {
        const fromLabel = document.createElement('span');
        fromLabel.className = 'feed-item-label';
        fromLabel.textContent = browser.i18n.getMessage("From");
        from.appendChild(fromLabel);
        from.appendChild(document.createTextNode(fromText));
    }
    header.appendChild(from);

    const subject = document.createElement('span');
    subject.className = 'feed-item-subject';
    const subjectText = Array.isArray(summary.subject) ? summary.subject.join(", ") : summary.subject;
    subject.textContent = subjectText || '';
    header.appendChild(subject);

    item.appendChild(header);

    // ── Body: summary (markdown or HTML, retaining formatting) ──
    const body = document.createElement('div');
    body.className = 'feed-item-body';
    renderSummaryBody(body, summary);
    item.appendChild(body);

    return item;
}

/**
 * Render the summary body into the given container safely, retaining
 * Markdown/HTML formatting (e.g. bullet lists). Uses DOMParser + node
 * appending (never innerHTML) with the same approach as the inline summary.
 */
function renderSummaryBody(container, summary) {
    if (summary.error) {
        container.textContent = summary.message || browser.i18n.getMessage("summarize_error");
        return;
    }

    const htmlContent = (summary.summary_html || '').trim();
    // Detect whether the stored content is actual HTML markup (has tags).
    const isHtml = /<\/?[a-z][a-z0-9-]*(\s[^>]*)?>/i.test(htmlContent);

    if (isHtml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        while (doc.body.firstChild) {
            container.appendChild(doc.body.firstChild);
        }
        return;
    }

    // Plain text (no HTML). If markdown-it is available and the text looks
    // like markdown, render it so bullet lists and formatting are preserved.
    const text = summary.summary || htmlContent || '';
    if (text && typeof window.markdownit === 'function' && looksLikeMarkdown(text)) {
        const md = window.markdownit({ html: false, linkify: true });
        const parser = new DOMParser();
        const doc = parser.parseFromString(md.render(text), 'text/html');
        while (doc.body.firstChild) {
            container.appendChild(doc.body.firstChild);
        }
        return;
    }

    container.textContent = text;
}

function looksLikeMarkdown(text) {
    return /(\n\s*[-*+]\s)|(\n\s*\d+\.\s)|(^|\n)\s*#{1,6}\s|[**`>]/.test(text);
}

async function clearSummaryLog() {
    await summaryStore.clearSummaries();
    loadSummaryLog();
}