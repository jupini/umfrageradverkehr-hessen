export default async function handler(req, res){
    if (req.method !== "POST"){
        return res.status(405).json({error: "Nur POST erlaubt"});
    }

    try{
        const surveyData = req.body; 

        console.log("Empfangene Daten:", surveyData);

        return res.status(200).json({ok: true}); 
    }catch (error){
        return res.status(500).json()
    }
}