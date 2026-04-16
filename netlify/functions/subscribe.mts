import { insertIntoSupabase, isValidEmail, jsonResponse, readJsonBody, validatePublicFormRequest } from "./_shared/supabase.mts";

export default async (req: Request) => {
  const requestGuard = validatePublicFormRequest(req, { maxBodyBytes: 8_000 });
  if (requestGuard) return requestGuard;

  const body = await readJsonBody(req);
  if (!body || typeof body !== "object") {
    return jsonResponse(400, {
      ok: false,
      message: "Please send the subscription form as JSON."
    });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";

  if (company) {
    return jsonResponse(200, {
      ok: true,
      message: "You are now subscribed."
    });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(400, {
      ok: false,
      message: "Please enter a valid email address."
    });
  }

  try {
    await insertIntoSupabase("newsletter_subscribers", {
      email,
      source: "website"
    }, {
      onConflict: "email"
    });

    return jsonResponse(200, {
      ok: true,
      message: "Welcome to the Kingdom family! You are now subscribed."
    });
  } catch (error) {
    console.error("Newsletter signup save failed:", error);
    return jsonResponse(500, {
      ok: false,
      message: "The email could not be saved right now. Please try again in a moment."
    });
  }
};

export const config = {
  path: "/api/subscribe"
};
