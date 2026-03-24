/**
 * Mapa de rutas de archivos existentes en DB por categoría de documento.
 * Se llena en loadDocsForm y se usa en collectDocsForm para enviar al backend
 * qué archivos el usuario decidió conservar.
 * @type {Object.<string, string[]>}
 */
export let filePaths = {};

//sistema de alertas Bootstrap 
export const alertSuccesBody = document.getElementById('alertSuccessBody');
export const alertErrorBody = document.getElementById('alertErrorBody');
export const alertBody = document.getElementById('alertBody');

export const alertSuccess = new bootstrap.Modal(document.getElementById('alertSuccess'));
export const alertError = new bootstrap.Modal(document.getElementById('alertError'));
export const alert = new bootstrap.Modal(document.getElementById('alert'));


//Catalogos de tipo de documento

/** Tipos de documento válidos para personas naturales nacionales. */
export const docNacionales = [
    { value: 'CC', text: 'CC' },
    { value: 'NIT', text: 'NIT' }
];
/** Tipos de documento válidos para personas naturales extranjeras. */
export const docExtranjeros = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];
/** Tipos de documento válidos para representante legal nacional. */
export const pjRLDocNaci = [
    { value: 'CC', text: 'CC' }
];
/** Tipos de documento válidos para representante legal extranjero. */
export const pjRLDocExtr = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];

//Expresiones regulares

/** Regex para validar formato de correo electrónico. */
export const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regex para validar y parsear direcciones colombianas.
 * 7 grupos de captura: tipo vía, número vía, letra vía/orientacion, número cruce, letra cruce/orientacion, numero de placa, complemento.
 * ej: CALLE 68B SUR # 81G - 76, Oficina 101
 */
export const regexDir = /^([a-zA-ZñÑ\s]+?)\s+([0-9]+)\s*([a-zA-Z])?\s*((?:BIS\s+)?(?:SUR|NORTE|ESTE|OESTE)|BIS)?\s*#\s*([0-9]+)\s*([a-zA-Z])?\s*-\s*([0-9]+)(?:,\s*(.*))?$/i;

//Estado compartido

/**
 * Instancias de intl-tel-input indexadas por ID de campo.
 * Se llenan en initTelInputs (helpers-ui) y se consultan en collector y validators.
 * @type {Object.<string, import('intl-tel-input').Plugin>}
 */
export const telInst = {};

/**
 * Conjunto de IDs de campos que el usuario ha interactuado (tocado).
 * La validación IRT solo actúa sobre campos en este set para evitar
 * mostrar errores antes de que el usuario haya ingresado algo.
 * Se limpia en clearValidationIRT al iniciar una nueva consulta.
 * @type {Set<string>}
 */
export const dirtyFields = new Set();

/**
 * Recorre todos los .form-control de la página y aplica/quita la clase
 * 'has-value' según si tienen contenido. Esto activa la animación CSS
 * de los labels flotantes (adaptive-label).
 * Debe llamarse después de cargar datos en los formularios y al inicializar la página.
 */
export function hasValue() {
    document.querySelectorAll('.form-control').forEach(input => {
        // Verificar al cargar la página (por si hay valores previos)
        if (input.value.trim() !== "") {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }

        // Escuchar cuando el usuario interactúa
        input.addEventListener('change', () => {
            if (input.value.trim() !== "") {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
}

