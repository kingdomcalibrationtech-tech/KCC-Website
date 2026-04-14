const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8"
};

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
