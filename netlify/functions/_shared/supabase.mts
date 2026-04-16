const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8"
};

const TRUSTED_FORM_HOSTS = new Set([
  "kingdomcalibrationchurch.org",
  "www.kingdomcalibrationchurch.org",
  "kcc-websit.netlify.app",
  "localhost",
  "localhost:8888",
  "127.0.0.1",
  "127.0.0.1:8888"
]);

type SupabaseValue = string | number | boolean;
type SupabaseFilter = {
  column: string;
  operator: string;
  value: SupabaseValue;
};

export function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase();
}

function getAllowedHosts(req: Request) {
  const allowedHosts = new Set(TRUSTED_FORM_HOSTS);

  try {
    allowedHosts.add(normalizeHost(new URL(req.url).host));
  } catch (error) {
    // Ignore malformed request URLs here and let other validation handle them.
  }

  return allowedHosts;
}

export function validatePublicFormRequest(req: Request, options: { maxBodyBytes?: number } = {}) {
  const maxBodyBytes = options.maxBodyBytes ?? 10_000;

  if (req.method !== "POST") {
    return jsonResponse(405, {
      ok: false,
      message: "Only POST requests are allowed."
    });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(415, {
      ok: false,
      message: "Please send the form as JSON."
    });
  }

  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
      return jsonResponse(413, {
        ok: false,
        message: "The form submission is too large."
      });
    }
  }

  const fetchSite = (req.headers.get("sec-fetch-site") || "").toLowerCase();
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return jsonResponse(403, {
      ok: false,
      message: "This request origin is not allowed."
    });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const originHost = normalizeHost(new URL(origin).host);
      if (!getAllowedHosts(req).has(originHost)) {
        return jsonResponse(403, {
          ok: false,
          message: "This request origin is not allowed."
        });
      }
    } catch (error) {
      return jsonResponse(400, {
        ok: false,
        message: "The request origin could not be verified."
      });
    }
  }

  return null;
}

export async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch (error) {
    return null;
  }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSupabaseConfig() {
  const supabaseUrl = Netlify.env.get("SUPABASE_URL");
  const serviceRoleKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey
  };
}

function createSupabaseHeaders(serviceRoleKey: string) {
  return {
    "Content-Type": "application/json",
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`
  };
}

function formatSupabaseValue(value: SupabaseValue) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

export async function insertIntoSupabase(
  table: string,
  row: Record<string, unknown>,
  options: { onConflict?: string } = {}
) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

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
      "Prefer": prefer.join(",")
    },
    body: JSON.stringify([row])
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Supabase request failed.");
  }
}

export async function selectFromSupabase<T = Record<string, unknown>>(
  table: string,
  options: {
    select?: string;
    filters?: SupabaseFilter[];
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  } = {}
) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

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

  return response.json() as Promise<T[]>;
}
