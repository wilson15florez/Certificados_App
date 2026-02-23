import { alertErrorBody, alertError } from './constant.js';
import { hasValue } from './ui-handlers.js';


//LOGICA DE INICIALIZACION DE INSTANCIAS DE INTL-TEL-INPUT

//elemento para validacion con parametros
export const telInst = {};

//funcion para inicializar campos de telefono (por defecto deja Colombia)
export function initTelInputs(element, required = false) {
    if (!element) return null;

    const iti = window.intlTelInput(element, {
        initialCountry: 'co',
        separateDialCode: true,
        autoPlaceholder: 'off',
        nationalMode: true,
        formatOnDisplay: false,
        utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js',
    });

    telInst[element.id] = iti;
    return iti;
}

//funcion que da espera a que se inicialice el input e identifique el pais del numero
export async function waitSafeSetPhone(inputId, fullNumber) {
    const iti = telInst[inputId];
    const input = document.getElementById(inputId);

    if (!iti || !input) return;

    const waitForUtils = () => {
        return new Promise((resolve) => {
            const check = () => {
                if (window.intlTelInputUtils) resolve();
                else setTimeout(check, 50);
            };
            check();
        });
    };

    await waitForUtils();

    if (!fullNumber) {
        iti.setNumber('');
        input.value = '';
        return;
    }

    iti.setNumber(fullNumber);
}


//LOGICA PARA EL SUBFORM DE LOS CAMPOS DE DIRECCIONES

let activeInput = null;

const dirEstr = {
    tipoVia: () => document.getElementById('tipoVia'),
    vPrincipal: () => document.getElementById('vPrincipal'),
    sufPrincipal: () => document.getElementById('sufPrincipal'),
    vSecundaria: () => document.getElementById('vSecundaria'),
    sufSecundaria: () => document.getElementById('sufSecundaria'),
    numPlaca: () => document.getElementById('numPlaca'),
    compleDir: () => document.getElementById('compleDir'),
    container: () => document.getElementById('directionStructure')
};

//funcion para inicializar el subform a raiz de los inputs de direcciones
export function initDirection() {
    document.addEventListener('focusin', (e) => {
        const targetIds = ['pnDiResidencia', 'pjDirPrincipal'];

        // detecta si el id concuerda con los id validos o concuerda con sucursales
        if (targetIds.some(id => e.target.id.startsWith(id)) || e.target.id.includes('pjDirSucursal_')) {
            openDirecForm(e.target);
        }
    });

    document.getElementById('cancelDirBtn')?.addEventListener('click', closeForm);
    document.getElementById('saveDirBtn')?.addEventListener('click', saveDirection);
}

//funcion para abrir el subform
function openDirecForm(input) {
    activeInput = input;
    resetDirForm();
    if (input.value) parseDirection(input.value);
    dirEstr.container().style.display = 'flex';
    hasValue();
}

//funcion que limpia los campos antes de llenarlos
function resetDirForm() {
    const fields = dirEstr;
    Object.keys(fields).forEach(key => {
        const el = fields[key]();
        if (!el || key === 'container') return;

        if (el.tagName === 'INPUT') el.value = '';
        if (el.tagName === 'SELECT') el.value = "";
    });
}

//funcion para cerrar el subform
function closeForm() {
    dirEstr.container().style.display = 'none';
    activeInput = null;
}

//funcion para dividir la direccion de la DB y mapearla en su respectivo campo
function parseDirection(dirString) {
    const regex = /^([a-zA-ZñÑ\s]+)\s+([0-9]+)\s*([a-zA-Z])?\s*#\s*([0-9]+)\s*([a-zA-Z])?\s*-\s*([0-9]+)(?:,\s*(.*))?$/i;
    const match = dirString.match(regex);

    if (match) {
        //identifica tipo de via ya este en mayuscula o minuscula
        let tipVia = match[1].trim();

        tipVia = tipVia.charAt(0).toUpperCase() + tipVia.slice(1).toLowerCase();

        const selectVia = dirEstr.tipoVia();

        selectVia.value = tipVia;

        //si no reconoce el tipo de via deja el select en opcion por defecto
        if (selectVia.selectedIndex === -1) {
            selectVia.selectedIndex = 0;
            //pasa la direccion al campo complemento
            dirEstr.compleDir().value = dirString;
            return;
        }

        dirEstr.vPrincipal().value = match[2];
        dirEstr.sufPrincipal().value = match[3] || '';
        dirEstr.vSecundaria().value = match[4];
        dirEstr.sufSecundaria().value = match[5] || '';
        dirEstr.numPlaca().value = match[6];
        dirEstr.compleDir().value = match[7] || '';
    } else {
        //si no la logra mapear la coloca en complemento
        dirEstr.compleDir().value = dirString;
    }
}

//funcion para armar la direccion con la informacion ingresada
function saveDirection() {
    const via = (id) => document.getElementById(id).value.trim();
    if (!via('tipoVia') || !via('vPrincipal') || !via('vSecundaria') || !via('numPlaca')) {
        alertErrorBody.innerText = 'Por favor complete los campos obligatorios de la dirección.';
        alertError.show();
        return
    }

    let fullAddress = `${via('tipoVia')} ${via('vPrincipal')}${via('sufPrincipal')} # ${via('vSecundaria')}${via('sufSecundaria')} - ${via('numPlaca')}`;
    if (via('compleDir')) fullAddress += `, ${via('compleDir')}`;

    if (activeInput) {
        activeInput.value = fullAddress.toUpperCase();
        activeInput.dispatchEvent(new Event('change'));
    }
    closeForm();
}


//LOGICA PARA SUBFORMULARIO DECLARACIONES Y AUTORIZACIONES

const authFields = {
    panel: () => document.getElementById('declAutorPanel'),
    inputs: () => document.querySelectorAll('#declAutorPanel input')
};

//funcion para inicializar el subform de declaraciones y autorizaciones
export function initDeclAut() {
    document.getElementById('declAutTrigger')?.addEventListener('click', openFormDA);

    document.getElementById('cancelAutBtn')?.addEventListener('click', closeFormDA);
    document.getElementById('saveAutBtn')?.addEventListener('click', closeFormDA);
}

function openFormDA() {
    authFields.panel().style.display = 'flex';
}

function closeFormDA() {
    authFields.panel().style.display = 'none';
}

export function resetFormDA() {

    const inputs = authFields.inputs();
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}


//LOGICA PARA SUBFORM DE CARGA DE DOCUMENTOS

let tempFiles = {};
let currentInput = null;
export let existingFiles = {};
let backupTemp = null;
let backupExisting = null;

export function initUploadDocs() {
    const docsForm = document.getElementById('uploadDocsForm');
    const panel = document.getElementById('uploadFilesPanel');
    const fileInput = document.getElementById('filesContainer');
    const listPreview = document.getElementById('fileList');

    //abre el panel cuando se oprime uno de los inputs
    docsForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('doc-trigger')) {
            const label = document.querySelector(`label[for="${e.target}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : e.target;
            openUploadPanel(e.target, labelText);
        }
    });

    //evento de seleccion de archivos
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        addFilesToTemp(files);
        //limpia input para permitir re-subir el mismo
        e.target.value = '';
    });

    //guardar documentos
    document.getElementById('saveDocsBtn').addEventListener('click', () => {
        const dbList = existingFiles[currentInput] || [];
        const newList = tempFiles[currentInput] || [];
        const mainInput = document.getElementById(currentInput);

        const allNames = [...dbList, ...newList.map(f => f.name)];
        mainInput.value = allNames.join(', ');

        if (allNames.length > 0) mainInput.classList.add('file.existing');
        else mainInput.classList.remove('file-existing');
        
        panel.style.display = 'none';
    });

    document.getElementById('cancelDocsBtn').addEventListener('click', () => {
        tempFiles[currentInput] = backupTemp;
        existingFiles[currentInput] = backupExisting;
        panel.style.display = 'none';
    });
}

function openUploadPanel(input, label) {
    currentInput = input.id;

    backupTemp = tempFiles[input.id] ? [...tempFiles[input.id]] : [];
    backupExisting = existingFiles[input.id] ? [...existingFiles[input.id]] : [];

    const panel = document.getElementById('uploadFilesPanel');
    const isMultiple = input.hasAttribute('multiple') || input.id === 'upRefeComerciales' || input.id === 'upCertificacionesVarias';

    //configuracion del input del panel
    const fileInput = document.getElementById('filesContainer');
    if (isMultiple) fileInput.setAttribute('multiple', 'multiple');
    else fileInput.removeAttribute('multiple');

    //titulo y descripcion
    document.getElementById('titleDocName').innerText = label;
    document.getElementById('pDocResume').innerText = isMultiple ?
        "Puede subir varios archivos PDF." : "Solo se permite un archivo PDF.";

    renderFilePreview();
    panel.style.display = 'flex';
}

function addFilesToTemp(files) {
    if (!tempFiles[currentInput]) tempFiles[currentInput] = [];

    const isMultiple = document.getElementById('filesContainer').hasAttribute('multiple');

    if (isMultiple) {
        tempFiles[currentInput] = [...tempFiles[currentInput], ...files];
    } else {
        tempFiles[currentInput] = [files[0]]
    }
    renderFilePreview();
}

function renderFilePreview() {
    const container = document.getElementById('fileList');
    container.innerHTML = '';

    const dbList = existingFiles[currentInput] || [];
    const newList = tempFiles[currentInput] || [];

    dbList.forEach((fileName, index) => {
        createFileItem(container, fileName, index, true)
    });

    newList.forEach((file, index) => {
        createFileItem(container, file.name, index, false);
    });
}

function createFileItem(container, name, index, isExisting) {
    const rect = document.createElement('div');
    rect.className = 'file-rect';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    if (isExisting) nameSpan.style.color = "#28a745";

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.innerHTML = '&times;';
    btnRemove.className = 'btn-remove-file';

    btnRemove.onclick = () => {
        if (isExisting) {
            existingFiles[currentInput].splice(index, 1);
        } else {
            tempFiles[currentInput].splice(index, 1);
        }
        renderFilePreview();
    };

    rect.appendChild(nameSpan);
    rect.appendChild(btnRemove);
    container.appendChild(rect);
}

export function removeTempFile(index) {
    if (tempFiles[currentInput]) {
        tempFiles[currentInput].slice(index, 1);
        renderFilePreview();
    }
};
