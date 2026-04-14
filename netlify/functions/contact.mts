import { insertIntoSupabase, isValidEmail, jsonResponse, readJsonBody } from "./_shared/supabase.mts";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse(405, {
      ok: false,
      message: "Only POST requests are allowed."
    });
  }

  const body = await readJsonBody(req);
  if (!body || typeof body !== "object") {
    return jsonResponse(400, {
      ok: false,
      message: "Please send the contact form as JSON."
    });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";

  if (company) {
    return jsonResponse(200, {
      ok: true,
      message: "Your message has been received."
    });
  }

  if (!fullName || fullName.length < 2) {
    return jsonResponse(400, {
      ok: false,
      message: "Please enter your full name."
    });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(400, {
      ok: false,
      message: "Please enter a valid email address."
    });
  }

  if (!message || message.length < 10) {
    return jsonResponse(400, {
      ok: false,
      message: "Please enter a longer message so the team can help you well."
    });
  }

  try {
    await insertIntoSupabase("contact_messages", {
      full_name: fullName,
      email,
      message,
      source: "website"
    });

    return jsonResponse(200, {
      ok: true,
      message: "Success! Message sent. We will be in touch soon."
    });
  } catch (error) {
    console.error("Contact form save failed:", error);
    return jsonResponse(500, {
      ok: false,
      message: "The message could not be saved right now. Please try again in a moment."
    });
  }
};

export const config = {
  path: "/api/contact",
  preferStatic: true
};

