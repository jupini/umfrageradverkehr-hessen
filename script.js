

/* Button zum Starten der Umfrage */
const startButton = document.getElementById("start-survey");

/* Bereich mit Karte und Formular */
const surveySection = document.getElementById("survey");

/* Container, in den später die Formularblöcke eingefügt werden */
const questionsContainer = document.getElementById("questions");

/* Aufforderung einen Punkt auszuwählen*/
const noPointsHint = document.getElementById("no-points-hint");

/* Button zum Absenden der Umfrage */
const submitButton = document.getElementById("submit-survey");

/* Button zur Lesebestätigung vor der Umfrage*/
const consentCheckbox = document.getElementById("consent-checkbox");

const thankYouOverlay = document.getElementById("thank-you-overlay");

/* merkt sich, ob die Karte schon initialisiert wurde */
let mapInitialized = false;

/* Leaflet Karte */
let map;

/* Liste aller gesetzten Punkte */
let points = [];

/* fortlaufende ID für neue Punkte */
let nextId = 1;

/* Hinweis zum Start der Umfrage wenn Lesebestätigung nicht ausgewählt wurde */
const consentWarning = document.getElementById("consent-warning");

/*Klick auf Button "Zur Umfrage"*/
startButton.addEventListener("click", function () {

    if (!consentCheckbox.checked) {
        consentWarning.style.display = "block";
        return;
    }

    consentWarning.style.display = "none";

    surveySection.style.display = "block";
    surveySection.scrollIntoView({ behavior: "smooth" });

    if (!mapInitialized) {
        initMap();
        mapInitialized = true;
    }

});

/* Funktion zur Initialisierung der Leaflet Karte*/

function initMap() {

    map = L.map("map", {
        maxZoom: 20
    }).setView([50.0827, 8.2406], 10);

    /* Hintergrundkarte OSM */
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 20,
        maxNativeZoom: 19
    });

    /* Hintergrundkarte Luftbild*/
    const esriImagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "&copy; Esri",
            maxZoom: 20,
            maxNativeZoom: 19
        }
    );

    osm.addTo(map);

    const baseMaps = {
        "Straßenkarte": osm,
        "Luftbild": esriImagery
    };

    L.control.layers(baseMaps, null, {
        collapsed: false
    }).addTo(map);

    const provider = new GeoSearch.OpenStreetMapProvider({
        params: {
            countrycodes: "de"
        }
    });

    const searchControl = new GeoSearch.GeoSearchControl({
        provider: provider,
        style: "bar",
        autoComplete: true,
        autoCompleteDelay: 250,
        showMarker: false,
        showPopup: false,
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        keepResult: true,
        searchLabel: "Ort, Straße oder Adresse suchen ..."
    });

    map.addControl(searchControl);

    map.on("click", function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        addPoint(lat, lng);
    });

    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}



function addPoint(lat, lng) {

    /* neues Punktobjekt erstellen */
    const point = {
        id: nextId++,
        lat: lat,
        lng: lng,
        marker: null,
        weekday: null,
        month: null,
        year: null
    };

    /* Marker erzeugen */
    point.marker = createMarker(point);

    /* Punkt speichern */
    points.push(point);

    /* Formular neu erzeugen */
    renderAllQuestionBlocks();

    /* Marker neu nummerieren */
    renumberMarkers();

}


function removePoint(id) {

    const index = points.findIndex(point => point.id === id);

    if (index === -1) return;

    /* Marker von Karte entfernen */
    if (points[index].marker) {
        map.removeLayer(points[index].marker);
    }

    /* Punkt aus Liste löschen */
    points.splice(index, 1);

    /* Formular neu zeichnen */
    renderAllQuestionBlocks();

    /* Marker neu nummerieren */
    renumberMarkers();

}


function createMarker(point) {

    const marker = L.marker([point.lat, point.lng], {
        icon: createNumberIcon("?")
    }).addTo(map);

    return marker;

}



function createNumberIcon(number) {

    return L.divIcon({
        className: "number-marker",
        html: `<div class="marker-circle">${number}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });

}


function renumberMarkers() {

    points.forEach((point, index) => {

        const number = index + 1;

        point.marker.setIcon(createNumberIcon(number));

        point.marker.bindPopup(`
        <strong>Punkt ${number}</strong><br>
        Breitengrad: ${point.lat.toFixed(6)}<br>
        Längengrad: ${point.lng.toFixed(6)}<br>
        <em>Löschen über den Button im Formular</em>
    `);

    });

}

function renderAllQuestionBlocks() {

    questionsContainer.innerHTML = "";

    if (points.length === 0) {
        noPointsHint.style.display = "block";
        updateSubmitButtonState();
        return;
    }

    noPointsHint.style.display = "none";

    points.forEach((point, index) => {
        createQuestionBlock(index + 1, point);
    });

    updateSubmitButtonState();
}



function createQuestionBlock(number, point) {

    const lat = point.lat.toFixed(6);
    const lng = point.lng.toFixed(6);

    const block = document.createElement("div");
    block.className = "question-block";

    block.innerHTML = `

    <div class="question-header">
        <h4>Punkt ${number}</h4>

        <!-- roter Löschbutton -->
        <button type="button"
                class="delete-point-btn"
                data-point-id="${point.id}">
            Punkt löschen
        </button>
    </div>

    <p><strong>Koordinaten:</strong> ${lat}, ${lng}</p>

    <div class="input-grid">

        <div class="form-field">
            <label>Datum</label>
            <input type="date"
                id="date-${point.id}"
                name="punkte[${number}][datum]"
                class="styled-input"
                max="${new Date().toISOString().split('T')[0]}">
        </div>

        <div class="form-field">
            <label for="time-${point.id}">Uhrzeit</label>
            <select
                id="time-${point.id}"
                name="punkte[${number}][uhrzeit]"
                class="styled-input">
                <option value="">Bitte auswählen</option>
                <option value="00:00">00:00</option>
                <option value="00:30">00:30</option>
                <option value="01:00">01:00</option>
                <option value="01:30">01:30</option>
                <option value="02:00">02:00</option>
                <option value="02:30">02:30</option>
                <option value="03:00">03:00</option>
                <option value="03:30">03:30</option>
                <option value="04:00">04:00</option>
                <option value="04:30">04:30</option>
                <option value="05:00">05:00</option>
                <option value="05:30">05:30</option>
                <option value="06:00">06:00</option>
                <option value="06:30">06:30</option>
                <option value="07:00">07:00</option>
                <option value="07:30">07:30</option>
                <option value="08:00">08:00</option>
                <option value="08:30">08:30</option>
                <option value="09:00">09:00</option>
                <option value="09:30">09:30</option>
                <option value="10:00">10:00</option>
                <option value="10:30">10:30</option>
                <option value="11:00">11:00</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
                <option value="12:30">12:30</option>
                <option value="13:00">13:00</option>
                <option value="13:30">13:30</option>
                <option value="14:00">14:00</option>
                <option value="14:30">14:30</option>
                <option value="15:00">15:00</option>
                <option value="15:30">15:30</option>
                <option value="16:00">16:00</option>
                <option value="16:30">16:30</option>
                <option value="17:00">17:00</option>
                <option value="17:30">17:30</option>
                <option value="18:00">18:00</option>
                <option value="18:30">18:30</option>
                <option value="19:00">19:00</option>
                <option value="19:30">19:30</option>
                <option value="20:00">20:00</option>
                <option value="20:30">20:30</option>
                <option value="21:00">21:00</option>
                <option value="21:30">21:30</option>
                <option value="22:00">22:00</option>
                <option value="22:30">22:30</option>
                <option value="23:00">23:00</option>
                <option value="23:30">23:30</option>
            </select>
        </div>

        <div class="form-field">
            <label for="surface-${point.id}">Zustand der Fahrbahn</label>
            <select
                id="surface-${point.id}"
                name="punkte[${number}][ustrzustand]"
                class="styled-input">
                <option value="">Bitte auswählen</option>
                <option value="0">trocken</option>
                <option value="1">nass / feucht</option>
                <option value="2">winterglatt</option>
            </select>
        </div>

        <div class="form-field">
            <label for="light-${point.id}">Lichtverhältnisse</label>
            <select
                id="light-${point.id}"
                name="punkte[${number}][Lichtverhaeltnisse]"
                class="styled-input">
                <option value="">Bitte auswählen</option>
                <option value="0">Tageslicht</option>
                <option value="1">Dämmerung</option>
                <option value="2">Dunkelheit</option>
            </select>
        </div>

        <div class="form-field full-width">
            <label for="comment-${point.id}">Zusätzliche Hinweise (optional)</label>
            <textarea
                id="comment-${point.id}"
                name="punkte[${number}][kommentar]"
                class="styled-input"
                rows="3"
                placeholder="z. B. Bordstein, rutschiger Untergrund, Hindernis, etc."></textarea>
        </div>


    </div>
`;
    questionsContainer.appendChild(block);

    /* Klick auf roten Löschbutton */
    const deleteButton = block.querySelector(".delete-point-btn");

    deleteButton.addEventListener("click", function () {

        const pointId = Number(this.dataset.pointId);

        removePoint(pointId);

    });


    const dateInput = document.getElementById(`date-${point.id}`);
    const timeInput = document.getElementById(`time-${point.id}`);
    const surfaceInput = document.getElementById(`surface-${point.id}`);
    const lightInput = document.getElementById(`light-${point.id}`);


    dateInput.addEventListener("change", function () {
        updateDerivedFields(point.id, this.value);
        updateSubmitButtonState();
    });

    timeInput.addEventListener("change", function () {
        updateSubmitButtonState();
    });

    surfaceInput.addEventListener("change", function () {
        updateSubmitButtonState();
    });

    lightInput.addEventListener("change", function(){
        updateSubmitButtonState();
    });

}

function updateDerivedFields(pointId, dateValue) {

    const point = points.find(p => p.id == pointId);

    if (!point){
        return;
    }

    if (!dateValue) {

    point.weekday = null;
    point.month = null;
    point.year = null; 

    return;

    }

    /* Datum erzeugen */
    const date = new Date(dateValue + "T12:00:00");

    point.weekday = date.getDay() + 1;
    point.month = date.getMonth() + 1;
    point.year = date.getFullYear();
}

function updateSubmitButtonState() {

    if (points.length === 0) {
        submitButton.disabled = true;
        return;
    }

    const allPointsComplete = points.every((point) => {

        const dateInput = document.getElementById(`date-${point.id}`);
        const timeInput = document.getElementById(`time-${point.id}`);
        const surfaceInput = document.getElementById(`surface-${point.id}`);
        const lightInput = document.getElementById(`light-${point.id}`);

        const hasDate = dateInput && dateInput.value.trim() !== "";
        const hasTime = timeInput && timeInput.value.trim() !== "";
        const hasSurface = surfaceInput && surfaceInput.value.trim() !== "";
        const hasLight = lightInput && lightInput.value.trim() !== "";

        return hasDate && hasTime && hasSurface && hasLight;
    });

    submitButton.disabled = !allPointsComplete;
}

submitButton.addEventListener("click", async function () {

    if (submitButton.disabled){
        return;
    }

    submitButton.disabled = true; 
    submitButton.textContent = "Wird gesendet...";

    try{
        const surveyData = collectSurveyData(); 
        console.log("Zu speichernde Daten:", surveyData); 

        const response = await fetch("/api/submit-survey", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(surveyData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Fehler beim Speichern");
        }

        surveySection.style.display = "none";
        thankYouOverlay.style.display = "flex";

    }catch (error){
        console.error("Fehler beim Speichern:", error);
        alert("Beim Speichern der Daten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
        updateSubmitButtonState();
    } finally {
        submitButton.textContent = "Umfrage absenden";
    }
});


function collectSurveyData(){
    return points.map((point) => {
        const dateInput = document.getElementById(`date-${point.id}`);
        const timeInput = document.getElementById(`time-${point.id}`);
        const surfaceInput = document.getElementById(`surface-${point.id}`);
        const lightInput = document.getElementById(`light-${point.id}`);
        const commentInput = document.getElementById(`comment-${point.id}`);

        return{
            accident_date: dateInput.value,
            accident_time: timeInput.value,
            weekday: point.weekday,
            month: point.month,
            year: point.year,
            road_surface_condition: Number(surfaceInput.value),
            light_condition: Number(lightInput.value),
            comment: commentInput.value.trim() === "" ? null : commentInput.value.trim(),
            lat: point.lat,
            lon: point.lng
        };
       
    });
}
