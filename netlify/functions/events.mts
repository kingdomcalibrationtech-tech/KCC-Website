import { jsonResponse, selectFromSupabase } from "./_shared/supabase.mts";

type EventRow = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string | null;
  start_at: string;
  end_at: string;
  venue: string | null;
  time_label: string | null;
  focus: string | null;
  details: string | null;
  poster_url: string | null;
  poster_alt: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sort_order: number | null;
};

function cleanText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function compareEvents(a: EventRow, b: EventRow) {
  const sortDifference = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (sortDifference !== 0) {
    return sortDifference;
  }

  return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
}

export default async (req: Request) => {
  if (req.method !== "GET") {
    return jsonResponse(405, {
      ok: false,
      message: "Only GET requests are allowed."
    });
  }

  try {
    const rows = await selectFromSupabase<EventRow>("events", {
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

    return jsonResponse(200, {
      ok: true,
      events
    });
  } catch (error) {
    console.error("Upcoming events load failed:", error);
    return jsonResponse(500, {
      ok: false,
      message: "Upcoming events could not be loaded right now."
    });
  }
};

export const config = {
  path: "/api/events",
  preferStatic: true
};
