import { createClient } from "@supabase/supabase-js";

console.log("DATEI GELADEN");

const hasSupabaseUrl = !!process.env.SUPABASE_URL;
const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("ENV CHECK", {
    hasSupabaseUrl,
    hasServiceRoleKey
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    console.log("HANDLER GESTARTET");

    if (req.method !== "POST") {
        console.log("FALSCHE METHODE:", req.method);
        return res.status(405).json({ error: "Nur POST erlaubt" });
    }

    try {
        const surveyData = req.body;

        console.log("Empfangene Daten:", surveyData);

        if (!Array.isArray(surveyData) || surveyData.length === 0) {
            console.log("UNGÜLTIGE DATEN");
            return res.status(400).json({ error: "Ungültige Daten" });
        }

        console.log("VOR INSERT");

        const { error } = await supabase
            .from("survey_points")
            .insert(surveyData);

        console.log("NACH INSERT", { error });

        if (error) {
            console.error("Supabase-Fehler:", error);
            return res.status(500).json({ error: error.message });
        }

        console.log("INSERT ERFOLGREICH");
        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error("SERVERFEHLER IM CATCH:", error);
        return res.status(500).json({ error: "Serverfehler" });
    }
}