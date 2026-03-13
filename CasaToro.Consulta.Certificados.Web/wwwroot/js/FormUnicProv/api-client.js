import { fillSelect2 } from './helpers-ui.js'; 


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
    const countries = data || [];
    return countries.filter(c => c.name.toLowerCase() !== "colombia");
}

//funcion para cargar los estados segun el pais
export async function loadStates(countryId) {
    const res = await fetch(url_STATES);
    const data = await res.json();
    return (data || []).filter(s => s.id_country == countryId);
}

//funcion para cargar ciudades segun el estado
export async function loadCities(stateId) {
    const res = await fetch(url_CITIES);
    const data = await res.json();
    return (data || []).filter(c => c.id_state == stateId);
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

//funcion para traer la informacion de los proveedores
export async function getProvDataForms(idNum, personType = null) {

    const url = personType ? `/Admin/CheckProvider?idNum=${idNum}&personType=${personType}` : '/Provider/GetProvPersonDetails';

    const response = await fetch(url);

    return await response.json();
}

//funcion para traer la informacion de los documentos de uploadDocsForm
export async function getProvDocuments(idNum) {
    const url = idNum ? `/Admin/GetProviderFiles?idNum=${idNum}` : `/Provider/GetProviderFiles`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Error al obtener documentos");
    return await response.json();
}

//funcion para enviar la info de informacion de p. natural/juridica y la informacion financiera a la DB 
export function sendData(payload, url) {
    console.log("Enviando datos");

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
                throw new Error(result.message || result.error);
            }
            return result;
        })
        .catch(error => {
            console.error('Error de Fetch:', error);
            throw error;
        });
}

//funcion para enviar docs del form documentos del proveedor a la DB
export function sendFiles(formData, url) {
    console.log("Enviando datos")

    return fetch(url, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error("Error en el servidor al subir archivos");
            return response.json();
        })
        .then(result => {
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            return result;
        });
}

export async function getFormat(idNum, personType = null) {
    const url = personType ? `/Admin/PrintFormat?nit=${idNum}` : `/Provider/PrintFormat`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Error al obtener formato");
    }

    return await response.json();
}
