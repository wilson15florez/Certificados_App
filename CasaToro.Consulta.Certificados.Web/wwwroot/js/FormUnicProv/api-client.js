import { fillSelect2 } from './helpers-ui.js'; 

//Rutas de archivos JSON estáticos
const colDMJSON = '/data/ubiNacional/ColombiaDepMun.json'
const url_COUNTRIES = '/data/ubiExterior/countries.json';
const url_STATES = '/data/ubiExterior/states.json';
const url_CITIES = '/data/ubiExterior/cities.json';
const ciiuJSON = '/data/Cod_CIIU-ActEconomica/codCIIU_ActEco.json';
const bancosJSON = '/data/entBanca/entidades_bcos.json';

// Guard para evitar recargar la ubicación colombiana más de una vez por sesión
let isUbiLoaded = false;

let ubi_Departamentos = [];
let ubi_CiudadByDep = {};

/**
 * Carga departamentos y municipios de Colombia desde el JSON local.
 * Construye un diccionario ciudadByDep para el chain departamento→ciudad.
 * @returns {Promise<{departamentos: string[], ciudadByDep: Object.<string, string[]>}>}
 */
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

/**
 * Carga la ubicación colombiana una sola vez y la expone en window.ubi_Departamentos
 * y window.ubi_CiudadByDep para que los handlers de sucursales (initSucursalUbic)
 * puedan accederla sin hacer una nueva petición.
 * Guarda internamente si ya fue cargada para no repetir la petición.
 * @returns {Promise<void>}
 */
export async function loadUbiData() {
    if (isUbiLoaded) return;

    const { departamentos, ciudadByDep } = await loadUbiNac();

    window.ubi_Departamentos = departamentos;
    window.ubi_CiudadByDep = ciudadByDep;
    isUbiLoaded = true;
}

/**
 * Carga la lista de países desde el JSON externo, excluyendo Colombia
 * (que se maneja aparte con loadUbiNac).
 * @returns {Promise<Array<{id: string, name: string}>>} Lista de países sin Colombia.
 */
export async function loadUbiExt() {
    const res = await fetch(url_COUNTRIES);
    const data = await res.json();
    const countries = data || [];
    return countries.filter(c => c.name.toLowerCase() !== "colombia");
}

/**
 * Carga los estados/departamentos de un país extranjero.
 * @param {string|number} countryId - ID del país (campo id_country en el JSON).
 * @returns {Promise<Array<{id: string, name: string}>>} Lista de estados del país.
 */
export async function loadStates(countryId) {
    const res = await fetch(url_STATES);
    const data = await res.json();
    return (data || []).filter(s => s.id_country == countryId);
}

/**
 * Carga las ciudades de un estado/departamento extranjero.
 * @param {string|number} stateId - ID del estado (campo id_state en el JSON).
 * @returns {Promise<Array<{id: string, name: string}>>} Lista de ciudades del estado.
 */
export async function loadCities(stateId) {
    const res = await fetch(url_CITIES);
    const data = await res.json();
    return (data || []).filter(c => c.id_state == stateId);
}

/**
 * Carga los códigos CIIU y actividades económicas y llena los selects
 * pvAcEconomica y pvCodCIIU del provForm con los datos obtenidos.
 * @returns {Promise<void>}
 */
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

/**
 * Carga las entidades bancarias y llena el select pvEntidad del provForm.
 * @returns {Promise<void>}
 */
export async function loadBancosData() {
    try {
        const res = await fetch(bancosJSON);
        const data = await res.json();

        fillSelect2(pvEntidad, data, 'Seleccione entidad bancaria', 'Código', 'Nombre');
    } catch (error) {
        console.error("Error al cargar datos de entidades bancarias:", error);
    }
}

/**
 * Obtiene el estado del registro de un proveedor.
 * Si personType es null, llama al endpoint del proveedor autenticado (flujo proveedor).
 * Si personType tiene valor, llama al endpoint del admin con los parámetros de consulta.
 * @param {string|null} idNum - NIT del proveedor (null en flujo proveedor).
 * @param {string|null} [personType=null] - Tipo de persona ('natural'|'juridica'). Null en flujo proveedor.
 * @returns {Promise<Object>} Respuesta JSON con status y data del proveedor.
 */
export async function getProvDataForms(idNum, personType = null) {

    const url = personType ? `/Admin/CheckProvider?idNum=${idNum}&personType=${personType}` : '/Provider/GetProvPersonDetails';

    const response = await fetch(url);

    return await response.json();
}

/**
 * Obtiene los documentos activos de un proveedor.
 * Si idNum es null, usa el endpoint del proveedor autenticado (flujo proveedor).
 * @param {string|null} idNum - NIT del proveedor (null en flujo proveedor).
 * @returns {Promise<{data: Array, isOEA: string|null}>}
 * @throws {Error} Si la respuesta HTTP no es OK.
 */
export async function getProvDocuments(idNum) {
    const url = idNum ? `/Admin/GetProviderFiles?idNum=${idNum}` : `/Provider/GetProviderFiles`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Error al obtener documentos");
    return await response.json();
}

/**
 * Envía datos JSON al backend mediante POST.
 * Lanza un error si la respuesta contiene status 'error' o campo error,
 * para que el llamador (submitForms) pueda detectar el fallo con await.
 * @param {Object} payload - Datos a enviar como JSON.
 * @param {string} url - Endpoint destino.
 * @returns {Promise<Object>} Resultado del servidor.
 * @throws {Error} Si el servidor retorna error o hay fallo de red.
 */
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

/**
 * Envía un FormData con archivos al backend mediante POST multipart.
 * @param {FormData} formData - Datos del formulario incluyendo archivos.
 * @param {string} url - Endpoint destino.
 * @returns {Promise<Object>} Resultado del servidor.
 * @throws {Error} Si la respuesta HTTP no es OK o el servidor retorna status 'error'.
 */
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

/**
 * Obtiene la URL del FUCP generado en PDF para un proveedor jurídico.
 * Si personType es null, usa el endpoint del proveedor autenticado.
 * @param {string|null} idNum - NIT del proveedor (null en flujo proveedor).
 * @param {string|null} [personType=null] - Tipo de persona. Null en flujo proveedor.
 * @returns {Promise<{url: string}>} Objeto con la URL relativa del PDF generado.
 * @throws {Error} Si la respuesta HTTP no es OK.
 */
export async function getFormat(idNum, personType = null) {
    const url = personType ? `/Admin/PrintFormat?nit=${idNum}` : `/Provider/PrintFormat`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Error al obtener formato");
    }

    return await response.json();
}
