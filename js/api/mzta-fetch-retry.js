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

const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests / Rate Limit
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable / High Demand
  504, // Gateway Timeout
  529  // Site Overloaded
]);

const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryOnNetworkError: true,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryAfterDelayMs(response, defaultDelayMs) {
  try {
    const retryAfterHeader = response.headers ? response.headers.get('retry-after') : null;
    if (!retryAfterHeader) return defaultDelayMs;

    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 30000);
    }

    const dateMs = Date.parse(retryAfterHeader);
    if (!Number.isNaN(dateMs)) {
      const delta = dateMs - Date.now();
      if (delta > 0) return Math.min(delta, 30000);
    }
  } catch (_) {}

  return defaultDelayMs;
}

export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...retryConfig };
  let currentDelay = config.initialDelayMs;
  let lastError = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is OK or status is not retryable, return immediately
      if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
        return response;
      }

      // If we reached max retries, return the final failed response
      if (attempt === config.maxRetries) {
        console.warn(`[ThunderAI] API request to ${url} failed with status ${response.status} after ${config.maxRetries} retries.`);
        return response;
      }

      const delayMs = getRetryAfterDelayMs(response, currentDelay);
      console.warn(`[ThunderAI] API request returned status ${response.status}. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${config.maxRetries})...`);

      await sleep(delayMs);
      currentDelay = Math.min(currentDelay * config.backoffFactor, config.maxDelayMs);
    } catch (err) {
      lastError = err;
      if (!config.retryOnNetworkError || attempt === config.maxRetries) {
        throw err;
      }

      console.warn(`[ThunderAI] API request network error: ${err.message}. Retrying in ${currentDelay}ms (attempt ${attempt + 1}/${config.maxRetries})...`);
      await sleep(currentDelay);
      currentDelay = Math.min(currentDelay * config.backoffFactor, config.maxDelayMs);
    }
  }

  if (lastError) throw lastError;
}
