import { fillSelect2 } from './ui-handlers.js'; 

//JSON local Colombia
const colDMJSON = '/data/ubiNacional/ColombiaDepMun.json'

//JSON externos de paises
const url_COUNTRIES = '/data/ubiExterior/countries.json';
const url_STATES = '/data/ubiExterior/states.json';
const url_CITIES = '/data/ubiExterior/cities.json';

//JSON de Códigos CIIU y actividades económicas
const ciiuJSON = '/data/Cod_CIIU-ActEconomica/codCIIU_ActEco.json';

//JSON de Entidades bancarias
const bancosJSON = '/data/entBanca/entidades_bcos.json';

let ubi_Departamentos = [];
let ubi_CiudadByDep = {};
let isUbiLoaded = false;


//funcion para cargar departamentos y municipios colombianos
export async function loadUbiNac() {
    const res = await fetch(colDMJSON);
    const data = await res.json();

    const departamentos = [...new Set(data.map(d => (d["Nombre"] || "").trim().toUpperCase()))];
    const ciudadByDep = {};

    data.forEach(item => {
        const depto = (item["Nombre"] || "").trim().toUpperCase();
        const ciud = (item[" Nombre "] || item["Nombre"] || '').trim();

        if (!ciudadByDep[depto]) ciudadByDep[depto] = [];

        if (ciud) ciudadByDep[depto].push(ciud);
    });
    return { departamentos, ciudadByDep };
}

//funcion para cargar datos de ubicacion colombiana una sola vez
export async function loadUbiData() {
    if (isUbiLoaded) return;

    const { departamentos, ciudadByDep } = await loadUbiNac();

    window.ubi_Departamentos = departamentos;
    window.ubi_CiudadByDep = ciudadByDep;
    isUbiLoaded = true;
}

//funcion para cargar paises
export async function loadUbiExt() {
    const res = await fetch(url_COUNTRIES);
    const data = await res.json();
    const countries = data.countries || [];
    return countries.filter(c => c.name.toLowerCase() !== "colombia");
}

//funcion para cargar los estados segun el pais
export async function loadStates(countryId) {
    const res = await fetch(url_STATES);
    const data = await res.json();
    return (data.states || []).filter(s => s.id_country == countryId);
}

//funcion para cargar ciudades segun el estado
export async function loadCities(stateId) {
    const res = await fetch(url_CITIES);
    const data = await res.json();
    return (data.cities || []).filter(c => c.id_state == stateId);
}

//funcion para cargar Codigo CIIU y actividades economicas
export async function loadCIIUData() {
    try {
        const res = await fetch(ciiuJSON);
        const data = await res.json();

        fillSelect2(pvAcEconomica, data, 'Seleccione actividad económica', 'Código CIIU', 'Actividad Economica');

        fillSelect2(pvCodCIIU, data, 'Seleccione código CIIU', 'Código CIIU', 'Código CIIU');

    } catch (error) {
        console.error("Error al cargar datos de CIIU:", error);
    }
}

//funcion para cargar entidades bancarias
export async function loadBancosData() {
    try {
        const res = await fetch(bancosJSON);
        const data = await res.json();

        fillSelect2(pvEntidad, data, 'Seleccione entidad bancaria', 'Código', 'Nombre');
    } catch (error) {
        console.error("Error al cargar datos de entidades bancarias:", error);
    }
}

//logica de conexion al backend
export function sendData(payload, url) {
    console.log("Enviando datos a:", url, payload);

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(result => {
            if (result.error || result.status === 'error') {
                alert("Error: " + (result.message || result.error));
                throw new Error(result.message || result.error);
            }
            alert("¡Exito! " + (result.message || 'Guardado correctamente.'));
            return result;
        })
        .catch(error => {
            console.error('Error de Fetch:', error);
            alert("Error al guardar: " + error.message);
        });
}