import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, "10 m"),
    analytics: true
});

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];

    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }

    return "unknown";
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Nur POST erlaubt" });
    }

    try {
        const ip = getClientIp(req);
        const { success } = await ratelimit.limit(`survey:${ip}`);

        if (!success) {
            return res.status(429).json({
                error: "Zu viele Anfragen. Bitte später erneut versuchen."
            });
        }

        const surveyData = req.body;

        if (!Array.isArray(surveyData) || surveyData.length === 0) {
            return res.status(400).json({ error: "Ungültige Daten" });
        }

        const { error } = await supabase
            .from("survey_points")
            .insert(surveyData);

        if (error) {
            console.error("Supabase-Fehler:", error);
            return res.status(500).json({ error: "Fehler beim Speichern in Supabase" });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Serverfehler:", error);
        return res.status(500).json({ error: "Serverfehler" });
    }
}