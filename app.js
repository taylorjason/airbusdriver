const statusEl = document.getElementById("status");
const cardsEl = document.getElementById("cards");

// New UI Elements
const sortOrderEl = document.getElementById("sortOrder"); // Compact select
const toggleDatePanelBtn = document.getElementById("toggleDatePanel");
const datePanelEl = document.getElementById("datePanel");

// Custom Picker Inputs (Hidden)
const startMonthInput = document.getElementById("startMonthValue");
const endMonthInput = document.getElementById("endMonthValue");

const applyDateFilterBtn = document.getElementById("applyDateFilter");
const resetDateFilterBtn = document.getElementById("resetDateFilter");
const dateBadgeEl = document.getElementById("dateBadge");

const toggleSearchPanelBtn = document.getElementById("toggleSearchPanel");
const searchPanelEl = document.getElementById("searchPanel");
const searchInputEl = document.getElementById("searchInput");
const applySearchBtn = document.getElementById("applySearch");
const clearSearchBtn = document.getElementById("clearSearch");
const searchBadgeEl = document.getElementById("searchBadge");
const searchScopeEls = document.getElementsByName("searchScope");

const fetchUrlBtn = document.getElementById("fetchUrl");
const sourceUrlEl = document.getElementById("sourceUrl");
const parseHtmlBtn = document.getElementById("parseHtml");
const manualHtmlEl = document.getElementById("manualHtml");

// --- Custom Date Picker Logic ---

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Store view state for each picker
const pickerState = {
  start: { viewYear: new Date().getFullYear() },
  end: { viewYear: new Date().getFullYear() }
};

const renderMonthPicker = (pickerId, inputId, stateKey) => {
  const pickerEl = document.getElementById(pickerId);
  if (!pickerEl) return;

  const yearDisplay = pickerEl.querySelector(".current-year");
  const grid = pickerEl.querySelector(".months-grid");
  const input = document.getElementById(inputId);

  if (!yearDisplay || !grid || !input) return;

  const currentViewYear = pickerState[stateKey].viewYear;
  yearDisplay.textContent = currentViewYear;

  // Clear grid
  grid.innerHTML = "";

  // Get currently selected value
  const selectedValue = input.value; // YYYY-MM
  let selectedYear = null;
  let selectedMonth = null;

  if (selectedValue) {
    const [y, m] = selectedValue.split("-").map(Number);
    selectedYear = y;
    selectedMonth = m - 1; // 0-index
  }

  // Render 12 months
  MONTH_NAMES.forEach((name, index) => {
    const btn = document.createElement("button");
    btn.className = "month-btn";
    btn.textContent = name;
    btn.type = "button";

    // Check if selected
    if (selectedYear === currentViewYear && selectedMonth === index) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      // Set value
      const monthStr = String(index + 1).padStart(2, "0");
      input.value = `${currentViewYear}-${monthStr}`;
      // Re-render to show selection
      renderMonthPicker(pickerId, inputId, stateKey);
    });

    grid.appendChild(btn);
  });
};

const setupPickerNavigation = (pickerId, stateKey, inputId) => {
  const pickerEl = document.getElementById(pickerId);
  if (!pickerEl) return;

  const prevBtn = pickerEl.querySelector(".prev-year");
  const nextBtn = pickerEl.querySelector(".next-year");

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState[stateKey].viewYear--;
    renderMonthPicker(pickerId, inputId, stateKey);
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pickerState[stateKey].viewYear++;
    renderMonthPicker(pickerId, inputId, stateKey);
  });
};

// Initialize Pickers
const initializePickers = () => {
  // Setup Start Picker
  setupPickerNavigation("startPicker", "start", "startMonthValue");
  // Setup End Picker
  setupPickerNavigation("endPicker", "end", "endMonthValue");
};

// Quick Chips Logic
const handleQuickChip = (range) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  let startYear, startMonth;

  // End always equals current month for these presets
  const endVal = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  endMonthInput.value = endVal;
  pickerState.end.viewYear = currentYear;

  if (range === '3m') {
    // Last 3 months (inclusive of current)
    const startDate = new Date(currentYear, currentMonth - 2, 1);
    startYear = startDate.getFullYear();
    startMonth = startDate.getMonth() + 1;
  } else if (range === '6m') {
    // Last 6 months
    const startDate = new Date(currentYear, currentMonth - 5, 1);
    startYear = startDate.getFullYear();
    startMonth = startDate.getMonth() + 1;
  } else if (range === 'ytd') {
    // Current Year (Dec 1st prev year -> Today)
    startYear = currentYear - 1;
    startMonth = 12;
  }

  const startVal = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  startMonthInput.value = startVal;
  pickerState.start.viewYear = startYear;

  // Re-render pickers to update UI
  renderMonthPicker("startPicker", "startMonthValue", "start");
  renderMonthPicker("endPicker", "endMonthValue", "end");

  // Auto-apply or just update UI? Plan says Stick to Apply button.
  // But chips usually imply immediate action. Let's auto-apply for chips.
  renderEntries();
  updateBadges();
  // Don't close panel to allow tuning? Or close? Chips usually close.
  // closeAllPanels(); // Optional, let's keep it open or close it. User preference. 
  // Let's close it for snappiness.
  closeAllPanels();
};

document.querySelectorAll('.quick-chips .chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    handleQuickChip(chip.dataset.range);
  });
});

// Initialize Default Date (Current Year logic default)
const initializeDateInputs = () => {
  // Default: Current Year logic (Dec 1st prev year -> Today)
  handleQuickChip('ytd');

  // Setup listeners after init
  initializePickers();
  renderMonthPicker("startPicker", "startMonthValue", "start");
  renderMonthPicker("endPicker", "endMonthValue", "end");
};

// Call initialization at the end of the file to ensure all functions are defined
// Prevent double-execution of renderEntries by removing the explicit call here since handleQuickChip calls it
// But handleQuickChip closes panel, which is fine for init (panel hidden anyway)

// Sort preference persistence
const SORT_PREFERENCE_KEY = "airbusdriver_sort_preference";

const loadSortPreference = () => {
  try {
    const savedSort = localStorage.getItem(SORT_PREFERENCE_KEY);
    if (savedSort && sortOrderEl) {
      sortOrderEl.value = savedSort;
    }
  } catch (e) {
    console.error('[Sort] Failed to load sort preference:', e);
  }
};

const saveSortPreference = (value) => {
  try {
    localStorage.setItem(SORT_PREFERENCE_KEY, value);
  } catch (e) {
    console.error('[Sort] Failed to save sort preference:', e);
  }
};

// Load saved sort preference
loadSortPreference();

const PROXY_URL = "https://snowy-king-2ff2.phantomworx.workers.dev/";
const entryModalEl = document.getElementById("entryModal");
const closeModalBtn = document.getElementById("closeModal");
const modalTitleEl = document.getElementById("modalTitle");
const modalMetaEl = document.getElementById("modalMeta");
const modalBodyEl = document.getElementById("modalBody");

let allEntries = [];
let lastCachedTimestamp = null;
let searchTerms = [];
let searchScope = 'filtered';

// Memoization cache for compiled search regex
let searchRegexCache = null;
let searchRegexCacheKey = '';

const markerText = "Your CQ Line Pilot Comments will be placed here ...";

// Cache configuration
const CACHE_KEY = "airbusdriver_cache";
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const DOUBLE_REFRESH_THRESHOLD_MS = 15 * 1000; // 15 seconds

// localStorage cache functions
const saveToCache = (html, entries, sourceUrl) => {
  try {
    const cacheData = {
      html,
      entries,
      timestamp: Date.now(),
      sourceUrl
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    lastCachedTimestamp = cacheData.timestamp;
    updateCacheStatus();
    console.log('[Cache] Data saved to localStorage');
  } catch (e) {
    console.error('[Cache] Failed to save to localStorage:', e);
  }
};

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log('[Cache] No cached data found');
      return null;
    }

    const cacheData = JSON.parse(cached);

    // Validate cache structure
    if (!cacheData.timestamp || !cacheData.html || !cacheData.entries) {
      console.log('[Cache] Invalid cache structure');
      return null;
    }

    // Check if cache is expired
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_EXPIRATION_MS) {
      console.log('[Cache] Cache expired (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
      return null;
    }

    // Rehydrate Date objects (JSON.stringify converts them to strings)
    cacheData.entries = cacheData.entries.map(entry => ({
      ...entry,
      date: entry.date ? new Date(entry.date) : null
    }));

    console.log('[Cache] Using cached data (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
    lastCachedTimestamp = cacheData.timestamp;
    return cacheData;
  } catch (e) {
    console.error('[Cache] Failed to load from localStorage:', e);
    return null;
  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    lastCachedTimestamp = null;
    console.log('[Cache] Cache cleared');
  } catch (e) {
    console.error('[Cache] Failed to clear cache:', e);
  }
};

// sessionStorage double-refresh detection
const checkDoubleRefresh = () => {
  try {
    const lastFetchTime = sessionStorage.getItem('lastFetchTime');
    const now = Date.now();

    if (lastFetchTime) {
      const timeSinceLastFetch = now - parseInt(lastFetchTime, 10);
      if (timeSinceLastFetch < DOUBLE_REFRESH_THRESHOLD_MS) {
        console.log('[Cache] Double-refresh detected! Forcing cache bypass.');
        return true;
      }
    }

    sessionStorage.setItem('lastFetchTime', now.toString());
    return false;
  } catch (e) {
    console.error('[Cache] Failed to check double-refresh:', e);
    return false;
  }
};

// Update cache status UI
const updateCacheStatus = () => {
  const cacheStatusEl = document.getElementById('cacheStatus');
  const refreshBtn = document.getElementById('refreshDataBtn');

  if (!cacheStatusEl) return;

  if (lastCachedTimestamp) {
    const age = Date.now() - lastCachedTimestamp;
    const hours = Math.floor(age / 1000 / 60 / 60);
    const minutes = Math.floor((age / 1000 / 60) % 60);

    let ageText;
    if (hours > 0) {
      ageText = `${hours} hour${hours !== 1 ? 's' : ''}`;
      if (minutes > 0) {
        ageText += ` ${minutes} min`;
      }
    } else if (minutes > 0) {
      ageText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      ageText = 'just now';
    }

    cacheStatusEl.textContent = `Last updated: ${ageText} ago`;
    if (refreshBtn) {
      refreshBtn.style.display = 'inline-block';
    }
  } else {
    cacheStatusEl.textContent = '';
    if (refreshBtn) {
      refreshBtn.style.display = 'none';
    }
  }
};

const normalizeWhitespace = (value) =>
  value.replace(/\s+/g, " ").trim();

/**
 * Parse search query into terms
 * Handles quoted phrases as exact matches and space-separated keywords as OR logic
 * @param {string} query - The search query string
 * @returns {Array<{term: string, isExact: boolean}>} Array of search terms
 */
const parseSearchQuery = (query) => {
  if (!query || !query.trim()) {
    return [];
  }

  const terms = [];
  const normalized = query.trim();

  // Extract quoted phrases first
  const quoteRegex = /"([^"]+)"/g;
  let match;
  let processedQuery = normalized;

  while ((match = quoteRegex.exec(normalized)) !== null) {
    const phrase = match[1].trim();
    if (phrase) {
      terms.push({ term: phrase, isExact: true });
    }
  }

  // Remove quoted phrases from the query
  processedQuery = processedQuery.replace(quoteRegex, ' ').trim();

  // Extract individual keywords (space-separated)
  if (processedQuery) {
    const keywords = processedQuery.split(/\s+/).filter(k => k.length > 0);
    keywords.forEach(keyword => {
      terms.push({ term: keyword, isExact: false });
    });
  }

  return terms;
};

/**
 * Filter entries by search terms (searches both content and date)
 * Uses OR logic - matches if ANY term is found
 * @param {Array} entries - Array of entry objects
 * @param {Array<{term: string, isExact: boolean}>} searchTerms - Parsed search terms
 * @returns {Array} Filtered entries
 */
const filterBySearch = (entries, searchTerms) => {
  if (!searchTerms || searchTerms.length === 0) {
    return entries;
  }

  return entries.filter(entry => {
    const searchableText = `${entry.content} ${entry.dateText}`.toLowerCase();

    // Match if ANY term is found (OR logic)
    return searchTerms.some(({ term, isExact }) => {
      const lowerTerm = term.toLowerCase();

      if (isExact) {
        // Exact phrase match (case-insensitive)
        return searchableText.includes(lowerTerm);
      } else {
        // Keyword match (case-insensitive)
        return searchableText.includes(lowerTerm);
      }
    });
  });
};

/**
 * Highlight search keywords in text by wrapping them in <mark> tags
 * Uses memoization to avoid recompiling regex on every call
 * @param {string} text - The text to highlight
 * @param {Array<{term: string, isExact: boolean}>} searchTerms - Parsed search terms
 * @returns {string} Text with <mark> tags around matched terms
 */
const highlightKeywords = (text, searchTerms) => {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return text;
  }

  // Create collision-free cache key using JSON serialization
  // This prevents collisions like "a b" vs "a|b"
  const cacheKey = JSON.stringify(searchTerms);

  // Check if regex is already compiled for these terms
  if (searchRegexCacheKey !== cacheKey) {
    // Cache miss - compile new regex
    const escapedTerms = searchTerms.map(({ term }) => escapeRegex(term));
    const combinedPattern = escapedTerms.join('|');
    searchRegexCache = new RegExp(`(${combinedPattern})`, 'gi');
    searchRegexCacheKey = cacheKey;
  }

  // Replace all matches in a single pass using cached regex
  return text.replace(searchRegexCache, '<mark>$1</mark>');
};

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Get context excerpt around the first occurrence of search terms
 * @param {string} content - The full content
 * @param {Array<{term: string, isExact: boolean}>} searchTerms - Parsed search terms
 * @param {number} wordsAround - Number of words to show before/after the match
 * @returns {string|null} Context excerpt with ellipsis if truncated, or null if no match found
 */
const getSearchContext = (content, searchTerms, wordsAround = 15) => {
  if (!content || !searchTerms || searchTerms.length === 0) {
    return null;
  }

  const lowerContent = content.toLowerCase();
  let firstMatchIndex = -1;
  let matchLength = 0;

  // Find the first occurrence of any search term
  searchTerms.forEach(({ term }) => {
    const lowerTerm = term.toLowerCase();
    const index = lowerContent.indexOf(lowerTerm);

    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
      matchLength = term.length;
    }
  });

  // If no match found in content, return null (match may be in dateText only)
  if (firstMatchIndex === -1) {
    return null;
  }

  // Split content into words while preserving positions
  const words = content.split(/(\s+)/); // Include whitespace in the split
  let charCount = 0;
  let matchWordIndex = -1;

  // Find which word index contains the match
  for (let i = 0; i < words.length; i++) {
    const wordLen = words[i].length;
    if (charCount <= firstMatchIndex && firstMatchIndex < charCount + wordLen) {
      matchWordIndex = i;
      break;
    }
    charCount += wordLen;
  }

  if (matchWordIndex === -1) {
    return null; // No match found
  }

  // Count actual words (not whitespace)
  const isWord = (w) => w.trim().length > 0;

  // Find start position (wordsAround words before match)
  let startIndex = matchWordIndex;
  let wordsBefore = 0;
  for (let i = matchWordIndex - 1; i >= 0 && wordsBefore < wordsAround; i--) {
    if (isWord(words[i])) {
      wordsBefore++;
      startIndex = i;
    }
  }

  // Find end position (wordsAround words after match)
  let endIndex = matchWordIndex;
  let wordsAfter = 0;
  for (let i = matchWordIndex + 1; i < words.length && wordsAfter < wordsAround; i++) {
    if (isWord(words[i])) {
      wordsAfter++;
      endIndex = i;
    }
  }

  // Extract the excerpt
  const excerpt = words.slice(startIndex, endIndex + 1).join('');

  // Add ellipsis if truncated
  const prefix = startIndex > 0 ? '...' : '';
  const suffix = endIndex < words.length - 1 ? '...' : '';

  return prefix + excerpt.trim() + suffix;
};

const cleanDateText = (text) =>
  text
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

const parseDate = (text) => {
  if (!text) {
    return null;
  }

  const cleanedText = cleanDateText(text);
  let parsed = new Date(cleanedText);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const numericOnly = cleanedText.replace(/[^0-9/.-]/g, "").trim();
  if (!numericOnly) {
    return null;
  }

  parsed = new Date(numericOnly);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const match = numericOnly.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) {
      year += 2000;
    }
    parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const monthYear = numericOnly.match(/(\d{1,2})[\/.-](\d{4})/);
  if (monthYear) {
    const month = Number(monthYear[1]);
    const year = Number(monthYear[2]);
    parsed = new Date(year, month - 1, 1);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const formatDate = (date, fallback) => {
  if (!date) {
    return fallback || "Unknown date";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getEntriesFromDocument = (doc) => {
  const rows = Array.from(doc.querySelectorAll("tr"));
  const markerIndex = rows.findIndex((row) =>
    normalizeWhitespace(row.textContent).includes(markerText)
  );

  if (markerIndex === -1) {
    return [];
  }

  const entries = [];
  const dataRows = rows.slice(markerIndex + 1);

  dataRows.forEach((row) => {
    const strong = row.querySelector("strong");
    if (!strong) {
      return;
    }

    const dateText = normalizeWhitespace(strong.textContent);
    const date = parseDate(dateText);

    if (!date) {
      return;
    }

    // Extract content preserving <br> as newlines
    let content = row.innerHTML;
    // Remove the strong element from the content
    const strongHtml = strong.outerHTML;
    content = content.replace(strongHtml, "").trim();

    // Use a placeholder for <br> tags to preserve them
    const BR_PLACEHOLDER = "|||BREAK|||";
    content = content.replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);

    // Remove all remaining HTML tags
    content = content.replace(/<[^>]*>/g, "");

    // Split by the break placeholder to handle each segment
    const segments = content.split(BR_PLACEHOLDER);

    // Clean each segment but keep empty ones (for double breaks)
    const cleanedSegments = segments
      .map((segment) => normalizeWhitespace(segment));

    // Rejoin with newlines, preserving empty segments for double breaks
    content = cleanedSegments.join("\n").trim();

    if (!content) {
      return;
    }

    entries.push({
      dateText,
      date,
      content,
    });
  });

  return entries;
};

const parseEntriesFromHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return getEntriesFromDocument(doc);
};

const fetchHtmlFromUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch (${response.status} ${response.statusText})`);
  }
  return response.text();
};

const describeFetchError = (error, url) => {
  const reason = error instanceof Error ? error.message : String(error);
  return `Unable to fetch ${url}. ${reason}. This is often caused by CORS or a blocked origin.`;
};

// Fallback removed — proxy will be used for all fetches

const buildProxyUrl = (proxyBase, targetUrl) => {
  const trimmed = proxyBase.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes("?")) {
    return `${trimmed}${encodeURIComponent(targetUrl)}`;
  }
  return `${trimmed}?url=${encodeURIComponent(targetUrl)}`;
};

const fetchWithProxy = async (targetUrl, forceRefresh = false) => {
  const proxyUrl = buildProxyUrl(PROXY_URL, targetUrl);
  if (!proxyUrl) {
    throw new Error("No proxy URL configured.");
  }

  // Add Cache-Control header for force refresh
  const headers = forceRefresh ? { 'Cache-Control': 'no-cache' } : {};

  const response = await fetch(proxyUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch (${response.status} ${response.statusText})`);
  }
  return response.text();
};

const isWithinRange = (entry) => {
  if (!entry.date) {
    return true;
  }

  const startString = startMonthInput.value; // YYYY-MM
  const endString = endMonthInput.value; // YYYY-MM

  if (startString) {
    const [y, m] = startString.split('-').map(Number);
    // Start of month: 1st day at 00:00:00
    const startDate = new Date(y, m - 1, 1);
    if (entry.date < startDate) {
      return false;
    }
  }

  if (endString) {
    const [y, m] = endString.split('-').map(Number);
    // Easier: Start of NEXT month. If entry < NextMonth, it's good.
    const nextMonthDate = new Date(y, m, 1);
    if (entry.date >= nextMonthDate) {
      return false;
    }
  }

  return true;
};

const createCard = (entry) => {
  const card = document.createElement("article");
  card.className = "card";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = entry.dateText || "Unknown date";

  const textWrap = document.createElement("div");
  textWrap.className = "expandable";

  const paragraph = document.createElement("p");
  const fullText = entry.content;
  const maxLength = 260;

  // Show search context excerpt if searching, otherwise show normal preview
  const updateText = () => {
    let text;

    if (searchTerms.length > 0) {
      // Get context excerpt around search term
      const contextExcerpt = getSearchContext(fullText, searchTerms, 15);

      if (contextExcerpt !== null) {
        // Match found in content - show context with highlighting
        const highlightedText = highlightKeywords(contextExcerpt, searchTerms);
        paragraph.innerHTML = highlightedText;
      } else {
        // No match in content (match was in dateText only) - show normal preview
        const lines = fullText.split("\n");
        const preview = lines.slice(0, 3).join("\n");
        text = preview;
        if (text.length > maxLength) {
          text = `${text.slice(0, maxLength).trim()}…`;
        }
        paragraph.textContent = text;
      }
    } else {
      // Normal preview: first few lines (up to 3)
      const lines = fullText.split("\n");
      const preview = lines.slice(0, 3).join("\n");
      text = preview;
      if (text.length > maxLength) {
        text = `${text.slice(0, maxLength).trim()}…`;
      }
      paragraph.textContent = text;
    }

    paragraph.style.whiteSpace = "pre-wrap";
  };

  updateText();

  textWrap.appendChild(paragraph);

  const expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.textContent = "View full report";
  expandBtn.addEventListener("click", () => openModal(entry));
  textWrap.appendChild(expandBtn);
  // Make entire card clickable to open modal
  card.addEventListener("click", (e) => {
    // Don't trigger if clicking the button (it has its own handler)
    if (e.target !== expandBtn) {
      openModal(entry);
    }
  });
  card.style.cursor = "pointer";

  card.appendChild(tag);
  card.appendChild(textWrap);

  return card;
};

const openModal = (entry) => {
  modalTitleEl.textContent = entry.dateText || "Full entry";
  modalMetaEl.textContent = formatDate(entry.date, entry.dateText);
  // Clear previous content
  modalBodyEl.innerHTML = "";

  if (searchTerms.length > 0) {
    // Highlight keywords in full content
    const lines = entry.content.split("\n");
    lines.forEach((line, index) => {
      if (index > 0) {
        modalBodyEl.appendChild(document.createElement("br"));
      }
      // Highlight keywords in each line
      if (line.length > 0) {
        const highlightedLine = highlightKeywords(line, searchTerms);
        const span = document.createElement("span");
        span.innerHTML = highlightedLine;
        modalBodyEl.appendChild(span);
      }
    });
  } else {
    // No search - show normal content
    const lines = entry.content.split("\n");
    lines.forEach((line, index) => {
      if (index > 0) {
        modalBodyEl.appendChild(document.createElement("br"));
      }
      // Add text node even if line is empty (for double <br> support)
      if (line.length > 0) {
        modalBodyEl.appendChild(document.createTextNode(line));
      }
    });
  }

  entryModalEl.classList.add("is-open");
  entryModalEl.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  entryModalEl.classList.remove("is-open");
  entryModalEl.setAttribute("aria-hidden", "true");
};

const renderEntries = () => {
  const noResultsEl = document.getElementById('noResultsMessage');
  const noResultsTextEl = document.getElementById('noResultsText');

  // Step 1: Get base entries based on search scope
  let baseEntries;
  if (searchTerms.length > 0 && searchScope === 'all') {
    // Search all comments (ignore date filter)
    baseEntries = allEntries;
  } else {
    // Apply date filter
    baseEntries = allEntries.filter(isWithinRange);
  }

  // Step 2: Apply search filtering
  let visibleEntries = filterBySearch(baseEntries, searchTerms);

  // Step 3: Apply sorting
  const sortOrder = sortOrderEl ? sortOrderEl.value : 'newest';
  visibleEntries.sort((a, b) => {
    // Handle entries without dates (should be rare, but just in case)
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1; // Put entries without dates at the end
    if (!b.date) return -1;

    // Sort by date
    if (sortOrder === 'oldest') {
      return a.date - b.date; // Ascending (oldest first)
    } else {
      return b.date - a.date; // Descending (newest first)
    }
  });

  // Step 4: Update status
  if (searchTerms.length > 0) {
    const totalCount = searchScope === 'all' ? allEntries.length : baseEntries.length;
    statusEl.textContent = `${visibleEntries.length} of ${totalCount} comments match your search.`;
  } else {
    statusEl.textContent = `${visibleEntries.length} entries loaded.`;
  }

  // Step 5: Handle no results
  if (visibleEntries.length === 0) {
    cardsEl.innerHTML = "";

    if (searchTerms.length > 0) {
      // Show search-specific no results message
      noResultsEl.style.display = 'block';

      if (searchScope === 'filtered') {
        noResultsTextEl.textContent =
          'No comments match your search within the selected date range. Try searching "All comments" to expand your search.';
      } else {
        noResultsTextEl.textContent =
          'No comments match your search terms.';
      }
    } else {
      // Show date filter no results message
      noResultsEl.style.display = 'none';
      cardsEl.innerHTML = `
            <div class="empty">
              No entries match the selected date range.
            </div>
          `;
    }
    return;
  }

  // Step 6: Hide no results message and render cards
  noResultsEl.style.display = 'none';
  cardsEl.innerHTML = "";
  visibleEntries.forEach((entry) => {
    cardsEl.appendChild(createCard(entry));
  });
};

// --- UI Logic: Panels & Toggles ---

const closeAllPanels = () => {
  [datePanelEl, searchPanelEl].forEach(panel => panel.hidden = true);
  [toggleDatePanelBtn, toggleSearchPanelBtn].forEach(btn => btn.setAttribute('aria-expanded', 'false'));
};

const togglePanel = (btn, panel) => {
  const isExpanded = btn.getAttribute('aria-expanded') === 'true';

  // Close all first (accordion style, optional)
  closeAllPanels();

  if (!isExpanded) {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    // Auto-focus first input
    const input = panel.querySelector('input');
    if (input) input.focus();
  }
};

const updateBadges = () => {
  // Date Badge
  const hasDateFilter = startMonthInput.value || endMonthInput.value;
  if (dateBadgeEl) dateBadgeEl.style.display = hasDateFilter ? 'inline' : 'none';

  // Search Badge
  const hasSearch = searchInputEl.value.trim().length > 0;
  if (searchBadgeEl) searchBadgeEl.style.display = hasSearch ? 'inline' : 'none';
};

// Toggle Listeners
if (toggleDatePanelBtn) {
  toggleDatePanelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel(toggleDatePanelBtn, datePanelEl);

    // Ensure pickers are rendered correctly when opening panel
    if (!datePanelEl.hidden) {
      renderMonthPicker("startPicker", "startMonthValue", "start");
      renderMonthPicker("endPicker", "endMonthValue", "end");
    }
  });
}

if (toggleSearchPanelBtn) {
  toggleSearchPanelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel(toggleSearchPanelBtn, searchPanelEl);
  });
}

// Close on click outside
document.addEventListener('click', (e) => {
  if (datePanelEl && !datePanelEl.hidden && !datePanelEl.contains(e.target) && e.target !== toggleDatePanelBtn) {
    closeAllPanels();
  }
  if (searchPanelEl && !searchPanelEl.hidden && !searchPanelEl.contains(e.target) && e.target !== toggleSearchPanelBtn) {
    closeAllPanels();
  }
});

// Prevent panel clicks from closing
[datePanelEl, searchPanelEl].forEach(panel => {
  if (panel) panel.addEventListener('click', (e) => e.stopPropagation());
});

// --- Action Listeners ---

// Date Actions
if (applyDateFilterBtn) {
  applyDateFilterBtn.addEventListener("click", () => {
    renderEntries();
    updateBadges();
    closeAllPanels();
  });
}

if (resetDateFilterBtn) {
  resetDateFilterBtn.addEventListener("click", () => {
    // Clear inputs
    startMonthInput.value = "";
    endMonthInput.value = "";

    // Reset picker views to current year
    const year = new Date().getFullYear();
    pickerState.start.viewYear = year;
    pickerState.end.viewYear = year;
    renderMonthPicker("startPicker", "startMonthValue", "start");
    renderMonthPicker("endPicker", "endMonthValue", "end");

    renderEntries();
    updateBadges();
    closeAllPanels();
  });
}

// Search Actions
if (searchInputEl) {
  searchInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission if any
      handleSearchInput();
      updateBadges();
      closeAllPanels();
    }
  });
}

if (applySearchBtn) {
  applySearchBtn.addEventListener("click", () => {
    // Trigger search if not already triggered by debounce
    handleSearchInput();
    updateBadges();
    closeAllPanels();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInputEl.value = "";
    searchTerms = [];
    searchRegexCache = null;
    searchRegexCacheKey = '';

    renderEntries();
    updateBadges();
    closeAllPanels();
  });
}

// Update badges on load
updateBadges();

// Handle sort order changes
if (sortOrderEl) {
  sortOrderEl.addEventListener("change", () => {
    saveSortPreference(sortOrderEl.value);
    renderEntries();
  });
}

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Handle search input with debounce (300ms is standard best practice)
const handleSearchInput = () => {
  const query = searchInputEl.value;
  searchTerms = parseSearchQuery(query);
  renderEntries();
  updateBadges();
};

const debouncedSearch = debounce(handleSearchInput, 300);

if (searchInputEl) {
  searchInputEl.addEventListener("input", debouncedSearch);
}

// Handle search scope changes
const handleSearchScopeChange = (e) => {
  searchScope = e.target.value;
  renderEntries();
};

if (searchScopeEls) {
  searchScopeEls.forEach(radio => {
    radio.addEventListener("change", handleSearchScopeChange);
  });
}

const fetchAndLoad = async (url, forceRefresh = false) => {
  const trimmed = url ? url.trim() : "";
  if (!trimmed) {
    statusEl.textContent = "Enter a URL to fetch.";
    return;
  }

  // Check for double-refresh (unless already forcing refresh)
  if (!forceRefresh) {
    forceRefresh = checkDoubleRefresh();
  }

  // Try to load from cache if not forcing refresh
  if (!forceRefresh) {
    const cached = loadFromCache();
    if (cached && cached.sourceUrl === trimmed) {
      console.log('[Cache] Loading from cache');
      manualHtmlEl.value = cached.html;
      allEntries = cached.entries;
      renderEntries();
      updateCacheStatus();
      return;
    }
  }

  // Cache miss or force refresh - fetch from network
  console.log('[Cache] Fetching from network' + (forceRefresh ? ' (forced)' : ''));
  statusEl.textContent = "Fetching HTML…";

  try {
    const html = await fetchHtmlFromUrl(trimmed);
    manualHtmlEl.value = html;
    allEntries = parseEntriesFromHtml(html);
    saveToCache(html, allEntries, trimmed);
    renderEntries();
    return;
  } catch (error) {
    statusEl.textContent = `${describeFetchError(error, trimmed)} Attempting proxy fetch…`;
    console.error(error);
    try {
      const html = await fetchWithProxy(trimmed, forceRefresh);
      manualHtmlEl.value = html;
      allEntries = parseEntriesFromHtml(html);
      saveToCache(html, allEntries, trimmed);
      renderEntries();
      return;
    } catch (proxyError) {
      statusEl.textContent = `${describeFetchError(proxyError, buildProxyUrl(PROXY_URL, trimmed) || "proxy URL")} Paste the HTML source instead.`;
      console.error(proxyError);
    }
  }
};

fetchUrlBtn.addEventListener("click", async () => {
  await fetchAndLoad(sourceUrlEl.value);
});

// Auto-fetch on page load using the configured source URL
window.addEventListener("load", () => {
  try {
    const url = sourceUrlEl && sourceUrlEl.value ? sourceUrlEl.value.trim() : "";
    if (url) {
      fetchAndLoad(url);
    }
  } catch (e) {
    console.error("Auto-fetch failed:", e);
  }
});
parseHtmlBtn.addEventListener("click", () => {
  const html = manualHtmlEl.value.trim();
  if (!html) {
    statusEl.textContent = "Paste the HTML source to parse it.";
    return;
  }
  allEntries = parseEntriesFromHtml(html);
  renderEntries();
});
closeModalBtn.addEventListener("click", closeModal);
entryModalEl.addEventListener("click", (event) => {
  if (event.target === entryModalEl) {
    closeModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && entryModalEl.classList.contains("is-open")) {
    closeModal();
  }
});

// Refresh button handler
const refreshDataBtn = document.getElementById('refreshDataBtn');
if (refreshDataBtn) {
  refreshDataBtn.addEventListener('click', async () => {
    const url = sourceUrlEl && sourceUrlEl.value ? sourceUrlEl.value.trim() : "";
    if (url) {
      clearCache();
      await fetchAndLoad(url, true); // Force refresh
    }
  });
}

// Update cache status every minute
setInterval(updateCacheStatus, 60000);

// Disclaimer modal handling
const DISCLAIMER_KEY = "airbusdriver_disclaimer_accepted";
const disclaimerModalEl = document.getElementById("disclaimerModal");
const disclaimerAcceptBtn = document.getElementById("disclaimerAccept");

const checkAndShowDisclaimer = () => {
  try {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) {
      // Show the modal
      disclaimerModalEl.classList.add("is-open");
      disclaimerModalEl.setAttribute("aria-hidden", "false");
    } else {
      // Hide the modal
      disclaimerModalEl.classList.remove("is-open");
      disclaimerModalEl.setAttribute("aria-hidden", "true");
    }
  } catch (e) {
    console.error('[Disclaimer] Failed to check disclaimer status:', e);
  }
};

const closeDisclaimer = () => {
  try {
    localStorage.setItem(DISCLAIMER_KEY, "true");
  } catch (e) {
    console.error('[Disclaimer] Failed to save disclaimer acceptance:', e);
  } finally {
    // Always close the modal, even if localStorage fails
    disclaimerModalEl.classList.remove("is-open");
    disclaimerModalEl.setAttribute("aria-hidden", "true");
  }
};

// Check on page load
checkAndShowDisclaimer();

// Handle accept button
if (disclaimerAcceptBtn) {
  disclaimerAcceptBtn.addEventListener("click", closeDisclaimer);
}

// Theme management
const THEME_KEY = "airbusdriver_theme_preference";
const themeAutoBtn = document.getElementById("themeAuto");
const themeLightBtn = document.getElementById("themeLight");
const themeDarkBtn = document.getElementById("themeDark");

const getSystemPreference = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === 'auto') {
    const systemTheme = getSystemPreference();
    root.setAttribute('data-theme', systemTheme);
  } else {
    root.setAttribute('data-theme', theme);
  }

  // Update active button state
  [themeAutoBtn, themeLightBtn, themeDarkBtn].forEach(btn => {
    btn.classList.remove('active');
  });

  if (theme === 'auto') {
    themeAutoBtn.classList.add('active');
  } else if (theme === 'light') {
    themeLightBtn.classList.add('active');
  } else if (theme === 'dark') {
    themeDarkBtn.classList.add('active');
  }
};

const loadThemePreference = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme || 'auto'; // Default to auto
  } catch (e) {
    console.error('[Theme] Failed to load theme preference:', e);
    return 'auto';
  }
};

const saveThemePreference = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('[Theme] Failed to save theme preference:', e);
  }
};

// Apply saved theme on load
const initialTheme = loadThemePreference();
applyTheme(initialTheme);

// Handle theme button clicks
if (themeAutoBtn) {
  themeAutoBtn.addEventListener('click', () => {
    saveThemePreference('auto');
    applyTheme('auto');
  });
}

if (themeLightBtn) {
  themeLightBtn.addEventListener('click', () => {
    saveThemePreference('light');
    applyTheme('light');
  });
}

if (themeDarkBtn) {
  themeDarkBtn.addEventListener('click', () => {
    saveThemePreference('dark');
    applyTheme('dark');
  });
}

// Listen for system theme changes when in auto mode
if (window.matchMedia) {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeQuery.addEventListener('change', () => {
    const currentTheme = loadThemePreference();
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

// Initialize date inputs after all functions are defined
initializeDateInputs();
