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
import { taSpamReport } from '../../js/mzta-spamreport.js';

let taLog = null;
let spamReport = null;
let currentReportData = null;
let currentSortState = { key: 'message_date', direction: 'desc' };

document.addEventListener('DOMContentLoaded', async () => {
    let prefs = await browser.storage.sync.get({ do_debug: false });
    taLog = new taLogger("mzta-spamlog-page", prefs.do_debug);
    spamReport = new taSpamReport(prefs.do_debug);

    i18n.updateDocument();

    initializeReportTableSorting();
    loadSpamReport();

    document.getElementById('btnRefreshSpamLog').addEventListener('click', loadSpamReport);
    document.getElementById('btnClearSpamLog').addEventListener('click', clearSpamLog);
});

function initializeReportTableSorting() {
    document.querySelectorAll('#report_data thead th[data-sort-key]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            if (currentSortState.key === sortKey) {
                currentSortState.direction = currentSortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortState.key = sortKey;
                currentSortState.direction = 'asc';
            }

            updateReportTableSortIndicators();
            if (currentReportData) {
                populateTable(currentReportData, currentSortState.key, currentSortState.direction);
            }
        });

        header.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                header.click();
            }
        });
    });
}

function updateReportTableSortIndicators() {
    document.querySelectorAll('#report_data thead th[data-sort-key]').forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.remove();
        }

        const isActive = header.dataset.sortKey === currentSortState.key;
        header.classList.toggle('sorted', isActive);
        header.setAttribute('aria-sort', isActive ? (currentSortState.direction === 'asc' ? 'ascending' : 'descending') : 'none');

        if (isActive) {
            const indicatorNode = document.createElement('span');
            indicatorNode.className = 'sort-indicator';
            indicatorNode.textContent = currentSortState.direction === 'asc' ? ' ↑' : ' ↓';
            header.appendChild(indicatorNode);
        }
    });
}

function getReportSortValue(report, key) {
    switch (key) {
        case 'message_date':
            return report[key] ? new Date(report[key]).getTime() : Number.NEGATIVE_INFINITY;
        case 'from':
        case 'to':
        case 'subject':
        case 'explanation':
            return String(Array.isArray(report[key]) ? report[key].join(', ') : (report[key] ?? '')).toLowerCase();

        case 'spamValue':
            return Number(report.spamValue) || 0;
        case 'moved':
            return report.moved ? 1 : 0;
        default:
            return '';
    }
}

function sortReportRows(rows, sortKey, sortDirection) {
    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    return [...rows].sort((rowA, rowB) => {
        const valueA = getReportSortValue(rowA.report, sortKey);
        const valueB = getReportSortValue(rowB.report, sortKey);

        if (typeof valueA === 'number' && typeof valueB === 'number') {
            if (valueA === valueB) {
                return rowA.email.localeCompare(rowB.email);
            }
            return (valueA - valueB) * directionMultiplier;
        }

        if (valueA === valueB) {
            return rowA.email.localeCompare(rowB.email);
        }

        return valueA.localeCompare(valueB) * directionMultiplier;
    });
}

async function loadSpamReport() {
    let report_data = await spamReport.getAllReportData();
    currentReportData = report_data;
    //console.log(">>>>>>>>>>>> loadSpamReport: " + JSON.stringify(report_data));
    //document.getElementById("report_data").textContent = JSON.stringify(report_data, null, 2);
    if (report_data == undefined) {
        document.getElementById("report_data").innerText = browser.i18n.getMessage("spamfilter_no_reports");
    } else {
        populateTable(report_data, currentSortState.key, currentSortState.direction);
        updateReportTableSortIndicators();
    }
}

// Function to populate the table
function populateTable(data, sortKey = currentSortState.key, sortDirection = currentSortState.direction) {
    const tableBody = document.getElementById("report_data_body");
    tableBody.innerHTML = ""; // Clear table before inserting new data

    const reportRows = sortReportRows(Object.keys(data).map(email => ({ email, report: data[email] })), sortKey, sortDirection);

    reportRows.forEach(({ email, report }) => {
        // Create a new row
        const row = document.createElement("tr");
        if (report.moved) {
            row.classList.add('spam-report-moved');
        }

        // Create and append each cell as a DOM element
        const tdMessageDate = document.createElement("td");
        tdMessageDate.textContent = report.message_date ? new Date(report.message_date).toLocaleString() : '';
        row.appendChild(tdMessageDate);

        const tdFrom = document.createElement("td");
        tdFrom.textContent = Array.isArray(report.from) ? report.from.join(", ") : report.from;
        row.appendChild(tdFrom);

        const tdTo = document.createElement("td");
        tdTo.textContent = Array.isArray(report.to) ? report.to.join(", ") : report.to;
        row.appendChild(tdTo);

        const tdSubject = document.createElement("td");
        tdSubject.textContent = Array.isArray(report.subject) ? report.subject.join(", ") : report.subject;
        row.appendChild(tdSubject);

        const tdSpamValue = document.createElement("td");
        tdSpamValue.textContent = report.spamValue;
        row.appendChild(tdSpamValue);

        const tdMoved = document.createElement("td");
        tdMoved.textContent = (report.moved ? browser.i18n.getMessage("yes_string") : browser.i18n.getMessage("no_string"));
        row.appendChild(tdMoved);

        const tdExplanation = document.createElement("td");
        tdExplanation.textContent = report.explanation;
        row.appendChild(tdExplanation);

        // Append the row to the table
        tableBody.appendChild(row);
    });
}

async function clearSpamLog() {
    await spamReport.clearReportData();
    loadSpamReport();
}
