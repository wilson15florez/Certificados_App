
export let filePaths = {};

//sistema de alertas
export const alertSuccesBody = document.getElementById('alertSuccessBody');
export const alertErrorBody = document.getElementById('alertErrorBody');
export const alertBody = document.getElementById('alertBody');

export const alertSuccess = new bootstrap.Modal(document.getElementById('alertSuccess'));
export const alertError = new bootstrap.Modal(document.getElementById('alertError'));
export const alert = new bootstrap.Modal(document.getElementById('alert'));

//tipo de documentos para personas nacionales
export const docNacionales = [
    { value: 'CC', text: 'CC' },
    { value: 'NIT', text: 'NIT' }
];
//tipo de documentos para personas extranjeras
export const docExtranjeros = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];
//tipo de documentos para representante legal nacional
export const pjRLDocNaci = [
    { value: 'CC', text: 'CC' }
];
//tipo de documentos para representante legal extranjero
export const pjRLDocExtr = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];

//elemento para validacion con parametros del email
export const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//elemento para validacion con parametros de la direccion
export const regexDir = /^([a-zA-ZñÑ\s]+?)\s+([0-9]+)\s*([a-zA-Z])?\s*((?:BIS\s+)?(?:SUR|NORTE|ESTE|OESTE)|BIS)?\s*#\s*([0-9]+)\s*([a-zA-Z])?\s*-\s*([0-9]+)(?:,\s*(.*))?$/i;

export const telInst = {};

export const dirtyFields = new Set();

//logica para animacion visual de labels
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

//logica para campos excluyentes de uploadDocsForm (upContingMeMagnetico y upContingFirmada)
export function checkExclusiones() {
    const magnetic = document.getElementById('upContingMeMagnetico');
    const firmada = document.getElementById('upContingFirmada');

    if (!magnetic || !firmada) return;

    blockExcl('upContingFirmada', magnetic.value.trim() !== "");
    blockExcl('upContingMeMagnetico', firmada.value.trim() !== "");
}
export function blockExcl(targetId, bloquear) {
    const targInput = document.getElementById(targetId);
    if (!targInput) return;

    const container = targInput.closest('.custom-file-container');
    const label = container?.querySelector('label');

    if (bloquear) {
        targInput.classList.add('no-edit');
        targInput.required = false;
        targInput.style.pointerEvents = 'none';
        if (label) label.classList.add('disabled-label')
        toggleValidInput(targInput, true);
    } else {
        targInput.classList.remove('no-edit');
        targInput.required = true;
        targInput.style.pointerEvents = 'auto';
        if (label) label.classList.remove('disabled-label');
    }
}
