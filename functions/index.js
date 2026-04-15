const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { defineSecret, defineString } = require("firebase-functions/params");

const REGION = "europe-west1";
const SUPABASE_URL = defineString("SUPABASE_URL", {
  description: "Public URL for the church Supabase project"
});
const SUPABASE_SERVICE_ROLE_KEY = defineSecret("SUPABASE_SERVICE_ROLE_KEY");

function sendJson(res, status, body) {
  res.status(status).type("application/json; charset=utf-8").send(JSON.stringify(body));
}

function handleOptions(req, res, allowedMethods) {
  if (req.method !== "OPTIONS") {
    return false;
  }

  res.set("Allow", allowedMethods.join(", "));
  res.status(204).send("");
  return true;
}

function parseJsonBody(req) {
  if (!req.body) {
    return null;
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return null;
    }
  }

  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSupabaseConfig() {
  const supabaseUrl = SUPABASE_URL.value();
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY.value();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey
  };
}

function createSupabaseHeaders(serviceRoleKey) {
  return {
    "Content-Type": "application/json",
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`
  };
}

function formatSupabaseValue(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

async function insertIntoSupabase(table, row, options = {}) {
  const config = getSupabaseConfig();
  const url = new URL(`${config.supabaseUrl}/rest/v1/${table}`);
  const prefer = ["return=minimal"];

  if (options.onConflict) {
    url.searchParams.set("on_conflict", options.onConflict);
    prefer.unshift("resolution=merge-duplicates");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...createSupabaseHeaders(config.serviceRoleKey),
      Prefer: prefer.join(",")
    },
    body: JSON.stringify([row])
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Supabase request failed.");
  }
}

async function selectFromSupabase(table, options = {}) {
  const config = getSupabaseConfig();
  const url = new URL(`${config.supabaseUrl}/rest/v1/${table}`);

  if (options.select) {
    url.searchParams.set("select", options.select);
  }

  if (options.filters) {
    options.filters.forEach((filter) => {
      url.searchParams.set(filter.column, `${filter.operator}.${formatSupabaseValue(filter.value)}`);
    });
  }

  if (options.orderBy) {
    url.searchParams.set("order", `${options.orderBy}.${options.ascending === false ? "desc" : "asc"}`);
  }

  if (typeof options.limit === "number") {
    url.searchParams.set("limit", String(options.limit));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: createSupabaseHeaders(config.serviceRoleKey)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Supabase request failed.");
  }

  return response.json();
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function compareEvents(a, b) {
  const sortDifference = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (sortDifference !== 0) {
    return sortDifference;
  }

  return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
}

exports.subscribe = onRequest(
  { region: REGION, secrets: [SUPABASE_SERVICE_ROLE_KEY] },
  async (req, res) => {
    if (handleOptions(req, res, ["POST", "OPTIONS"])) {
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, {
        ok: false,
        message: "Only POST requests are allowed."
      });
      return;
    }

    const body = parseJsonBody(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, {
        ok: false,
        message: "Please send the subscription form as JSON."
      });
      return;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";

    if (company) {
      sendJson(res, 200, {
        ok: true,
        message: "You are now subscribed."
      });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(res, 400, {
        ok: false,
        message: "Please enter a valid email address."
      });
      return;
    }

    try {
      await insertIntoSupabase("newsletter_subscribers", {
        email,
        source: "website"
      }, {
        onConflict: "email"
      });

      sendJson(res, 200, {
        ok: true,
        message: "Welcome to the Kingdom family! You are now subscribed."
      });
    } catch (error) {
      logger.error("Newsletter signup save failed", error);
      sendJson(res, 500, {
        ok: false,
        message: "The email could not be saved right now. Please try again in a moment."
      });
    }
  }
);

exports.contact = onRequest(
  { region: REGION, secrets: [SUPABASE_SERVICE_ROLE_KEY] },
  async (req, res) => {
    if (handleOptions(req, res, ["POST", "OPTIONS"])) {
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, {
        ok: false,
        message: "Only POST requests are allowed."
      });
      return;
    }

    const body = parseJsonBody(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, {
        ok: false,
        message: "Please send the contact form as JSON."
      });
      return;
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";

    if (company) {
      sendJson(res, 200, {
        ok: true,
        message: "Your message has been received."
      });
      return;
    }

    if (!fullName || fullName.length < 2) {
      sendJson(res, 400, {
        ok: false,
        message: "Please enter your full name."
      });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(res, 400, {
        ok: false,
        message: "Please enter a valid email address."
      });
      return;
    }

    if (!message || message.length < 10) {
      sendJson(res, 400, {
        ok: false,
        message: "Please enter a longer message so the team can help you well."
      });
      return;
    }

    try {
      await insertIntoSupabase("contact_messages", {
        full_name: fullName,
        email,
        message,
        source: "website"
      });

      sendJson(res, 200, {
        ok: true,
        message: "Success! Message sent. We will be in touch soon."
      });
    } catch (error) {
      logger.error("Contact form save failed", error);
      sendJson(res, 500, {
        ok: false,
        message: "The message could not be saved right now. Please try again in a moment."
      });
    }
  }
);

exports.events = onRequest(
  { region: REGION, secrets: [SUPABASE_SERVICE_ROLE_KEY] },
  async (req, res) => {
    if (handleOptions(req, res, ["GET", "OPTIONS"])) {
      return;
    }

    if (req.method !== "GET") {
      sendJson(res, 405, {
        ok: false,
        message: "Only GET requests are allowed."
      });
      return;
    }

    try {
      const rows = await selectFromSupabase("events", {
        select: "id,slug,title,summary,category,start_at,end_at,venue,time_label,focus,details,poster_url,poster_alt,cta_label,cta_url,sort_order",
        filters: [
          { column: "is_published", operator: "eq", value: true },
          { column: "end_at", operator: "gte", value: new Date().toISOString() }
        ],
        orderBy: "start_at"
      });

      const events = rows
        .sort(compareEvents)
        .map((row) => {
          const title = cleanText(row.title);
          return {
            id: row.id,
            slug: cleanText(row.slug),
            title,
            summary: cleanText(row.summary),
            category: cleanText(row.category) || "Special Event",
            startAt: row.start_at,
            endAt: row.end_at,
            venue: cleanText(row.venue),
            timeLabel: cleanText(row.time_label),
            focus: cleanText(row.focus),
            details: cleanText(row.details),
            posterUrl: cleanText(row.poster_url),
            posterAlt: cleanText(row.poster_alt) || `${title} poster`,
            ctaLabel: cleanText(row.cta_label),
            ctaUrl: cleanText(row.cta_url)
          };
        });

      sendJson(res, 200, {
        ok: true,
        events
      });
    } catch (error) {
      logger.error("Upcoming events load failed", error);
      sendJson(res, 500, {
        ok: false,
        message: "Upcoming events could not be loaded right now."
      });
    }
  }
);
