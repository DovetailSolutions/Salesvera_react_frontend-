/**
 * holidaysApi.js
 *
 * Mock holiday data source structured to mirror a real REST API response.
 * To wire up a real API, replace the `fetchHolidays` function body —
 * keep the same signature and return shape and nothing else needs to change.
 *
 * Expected return shape (array of objects):
 * {
 *   name:       string   — English name
 *   localName:  string   — Local / native language name
 *   date:       string   — "YYYY-MM-DD"
 *   types:      string[] — e.g. ["Public"], ["Optional"], ["Festival"]
 * }
 */

// ─── Static holiday data ────────────────────────────────────────────────────

const HOLIDAYS_DB = {
  IN: {
    2024: [
      { name: "New Year's Day",       localName: "नव वर्ष",               date: "2024-01-01", types: ["Public"] },
      { name: "Republic Day",          localName: "गणतंत्र दिवस",           date: "2024-01-26", types: ["Public"] },
      { name: "Holi",                  localName: "होली",                   date: "2024-03-25", types: ["Festival"] },
      { name: "Good Friday",           localName: "गुड फ्राइडे",             date: "2024-03-29", types: ["Public"] },
      { name: "Eid-ul-Fitr",           localName: "ईद-उल-फ़ितर",             date: "2024-04-11", types: ["Festival"] },
      { name: "Ambedkar Jayanti",      localName: "आंबेडकर जयंती",           date: "2024-04-14", types: ["Public"] },
      { name: "Maharashtra Day",       localName: "महाराष्ट्र दिवस",          date: "2024-05-01", types: ["Public"] },
      { name: "Eid-ul-Adha",           localName: "ईद-उल-अज़हा",             date: "2024-06-17", types: ["Festival"] },
      { name: "Muharram",              localName: "मुहर्रम",                 date: "2024-07-17", types: ["Festival"] },
      { name: "Independence Day",      localName: "स्वतंत्रता दिवस",          date: "2024-08-15", types: ["Public"] },
      { name: "Janmashtami",           localName: "जन्माष्टमी",              date: "2024-08-26", types: ["Festival"] },
      { name: "Milad-un-Nabi",         localName: "मिलाद-उन-नबी",            date: "2024-09-16", types: ["Festival"] },
      { name: "Gandhi Jayanti",        localName: "गांधी जयंती",             date: "2024-10-02", types: ["Public"] },
      { name: "Dussehra",              localName: "दशहरा",                  date: "2024-10-12", types: ["Festival"] },
      { name: "Diwali",                localName: "दीपावली",                 date: "2024-11-01", types: ["Festival"] },
      { name: "Guru Nanak Jayanti",    localName: "गुरु नानक जयंती",          date: "2024-11-15", types: ["Festival"] },
      { name: "Christmas Day",         localName: "क्रिसमस",                 date: "2024-12-25", types: ["Festival"] },
    ],
    2025: [
      { name: "New Year's Day",       localName: "नव वर्ष",               date: "2025-01-01", types: ["Public"] },
      { name: "Republic Day",          localName: "गणतंत्र दिवस",           date: "2025-01-26", types: ["Public"] },
      { name: "Holi",                  localName: "होली",                   date: "2025-03-14", types: ["Festival"] },
      { name: "Eid-ul-Fitr",           localName: "ईद-उल-फ़ितर",             date: "2025-03-31", types: ["Festival"] },
      { name: "Good Friday",           localName: "गुड फ्राइडे",             date: "2025-04-18", types: ["Public"] },
      { name: "Ambedkar Jayanti",      localName: "आंबेडकर जयंती",           date: "2025-04-14", types: ["Public"] },
      { name: "Maharashtra Day",       localName: "महाराष्ट्र दिवस",          date: "2025-05-01", types: ["Public"] },
      { name: "Eid-ul-Adha",           localName: "ईद-उल-अज़हा",             date: "2025-06-07", types: ["Festival"] },
      { name: "Muharram",              localName: "मुहर्रम",                 date: "2025-07-06", types: ["Festival"] },
      { name: "Independence Day",      localName: "स्वतंत्रता दिवस",          date: "2025-08-15", types: ["Public"] },
      { name: "Janmashtami",           localName: "जन्माष्टमी",              date: "2025-08-16", types: ["Festival"] },
      { name: "Milad-un-Nabi",         localName: "मिलाद-उन-नबी",            date: "2025-09-05", types: ["Festival"] },
      { name: "Gandhi Jayanti",        localName: "गांधी जयंती",             date: "2025-10-02", types: ["Public"] },
      { name: "Dussehra",              localName: "दशहरा",                  date: "2025-10-02", types: ["Festival"] },
      { name: "Diwali",                localName: "दीपावली",                 date: "2025-10-20", types: ["Festival"] },
      { name: "Guru Nanak Jayanti",    localName: "गुरु नानक जयंती",          date: "2025-11-05", types: ["Festival"] },
      { name: "Christmas Day",         localName: "क्रिसमस",                 date: "2025-12-25", types: ["Festival"] },
    ],
    2026: [
      { name: "New Year's Day",       localName: "नव वर्ष",               date: "2026-01-01", types: ["Public"] },
      { name: "Republic Day",          localName: "गणतंत्र दिवस",           date: "2026-01-26", types: ["Public"] },
      { name: "Holi",                  localName: "होली",                   date: "2026-03-04", types: ["Festival"] },
      { name: "Eid-ul-Fitr",           localName: "ईद-उल-फ़ितर",             date: "2026-03-20", types: ["Festival"] },
      { name: "Good Friday",           localName: "गुड फ्राइडे",             date: "2026-04-03", types: ["Public"] },
      { name: "Ambedkar Jayanti",      localName: "आंबेडकर जयंती",           date: "2026-04-14", types: ["Public"] },
      { name: "Maharashtra Day",       localName: "महाराष्ट्र दिवस",          date: "2026-05-01", types: ["Public"] },
      { name: "Eid-ul-Adha",           localName: "ईद-उल-अज़हा",             date: "2026-05-27", types: ["Festival"] },
      { name: "Muharram",              localName: "मुहर्रम",                 date: "2026-06-26", types: ["Festival"] },
      { name: "Independence Day",      localName: "स्वतंत्रता दिवस",          date: "2026-08-15", types: ["Public"] },
      { name: "Janmashtami",           localName: "जन्माष्टमी",              date: "2026-08-05", types: ["Festival"] },
      { name: "Milad-un-Nabi",         localName: "मिलाद-उन-नबी",            date: "2026-08-25", types: ["Festival"] },
      { name: "Gandhi Jayanti",        localName: "गांधी जयंती",             date: "2026-10-02", types: ["Public"] },
      { name: "Dussehra",              localName: "दशहरा",                  date: "2026-10-21", types: ["Festival"] },
      { name: "Diwali",                localName: "दीपावली",                 date: "2026-11-08", types: ["Festival"] },
      { name: "Guru Nanak Jayanti",    localName: "गुरु नानक जयंती",          date: "2026-11-24", types: ["Festival"] },
      { name: "Christmas Day",         localName: "क्रिसमस",                 date: "2026-12-25", types: ["Festival"] },
    ],
    2027: [
      { name: "New Year's Day",       localName: "नव वर्ष",               date: "2027-01-01", types: ["Public"] },
      { name: "Republic Day",          localName: "गणतंत्र दिवस",           date: "2027-01-26", types: ["Public"] },
      { name: "Holi",                  localName: "होली",                   date: "2027-03-22", types: ["Festival"] },
      { name: "Eid-ul-Fitr",           localName: "ईद-उल-फ़ितर",             date: "2027-03-10", types: ["Festival"] },
      { name: "Good Friday",           localName: "गुड फ्राइडे",             date: "2027-03-26", types: ["Public"] },
      { name: "Ambedkar Jayanti",      localName: "आंबेडकर जयंती",           date: "2027-04-14", types: ["Public"] },
      { name: "Maharashtra Day",       localName: "महाराष्ट्र दिवस",          date: "2027-05-01", types: ["Public"] },
      { name: "Eid-ul-Adha",           localName: "ईद-उल-अज़हा",             date: "2027-05-17", types: ["Festival"] },
      { name: "Muharram",              localName: "मुहर्रम",                 date: "2027-06-15", types: ["Festival"] },
      { name: "Independence Day",      localName: "स्वतंत्रता दिवस",          date: "2027-08-15", types: ["Public"] },
      { name: "Janmashtami",           localName: "जन्माष्टमी",              date: "2027-08-25", types: ["Festival"] },
      { name: "Gandhi Jayanti",        localName: "गांधी जयंती",             date: "2027-10-02", types: ["Public"] },
      { name: "Dussehra",              localName: "दशहरा",                  date: "2027-10-10", types: ["Festival"] },
      { name: "Diwali",                localName: "दीपावली",                 date: "2027-10-29", types: ["Festival"] },
      { name: "Guru Nanak Jayanti",    localName: "गुरु नानक जयंती",          date: "2027-11-23", types: ["Festival"] },
      { name: "Christmas Day",         localName: "क्रिसमस",                 date: "2027-12-25", types: ["Festival"] },
    ],
  },
};

// ─── API function ────────────────────────────────────────────────────────────

/**
 * fetchHolidays(countryCode, year)
 *
 * Simulates an async API call. Returns a normalized array of holiday objects.
 * Throws an Error if no data is available for the given country/year combo.
 *
 * ─── TO REPLACE WITH A REAL API ─────────────────────────────────────────────
 * Delete everything inside this function and substitute your real fetch, e.g.:
 *
 *   const res = await fetch(`https://your-api.com/holidays?country=${countryCode}&year=${year}`);
 *   if (!res.ok) throw new Error(`API error ${res.status}`);
 *   const raw = await res.json();
 *   // Map raw fields to: { name, localName, date, types }
 *   return raw.map(h => ({ name: h.title, localName: h.title, date: h.date, types: [h.category] }));
 *
 * The caller (Step4) only reads .name, .localName, .date, .types — adjust the
 * mapping above to match your API's actual field names.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * @param {string} countryCode  ISO 3166-1 alpha-2 code, e.g. "IN"
 * @param {number} year         4-digit year, e.g. 2026
 * @returns {Promise<Array>}    Resolves with array of holiday objects
 */
export async function fetchHolidays(countryCode, year) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const countryData = HOLIDAYS_DB[countryCode];
  if (!countryData) {
    throw new Error(
      `No holiday data available for country "${countryCode}". ` +
      `Add it to HOLIDAYS_DB in holidaysApi.js or replace fetchHolidays with a real API call.`
    );
  }

  const yearData = countryData[year];
  if (!yearData) {
    throw new Error(
      `No holiday data available for ${countryCode} in ${year}. ` +
      `Supported years: ${Object.keys(countryData).join(", ")}.`
    );
  }

  return yearData;
}