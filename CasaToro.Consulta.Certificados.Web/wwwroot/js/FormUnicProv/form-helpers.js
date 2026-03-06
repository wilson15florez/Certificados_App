import { alertErrorBody, alertBody, alertError, alert, regexDir, telInst } from './constant.js';
import { hasValue, checkExclusiones, filePaths } from './ui-handlers.js';
import { toggleValidInput } from './validators.js';


//LOGICA DE INICIALIZACION DE INSTANCIAS DE INTL-TEL-INPUT

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

    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
        element.parentNode.insertBefore(label, element.nextSibling);
    }

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
    preview: () => document.getElementById('dirPreview'),
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

    const subForm = dirEstr.container();
    subForm.addEventListener('input', updatePreview);
    subForm.addEventListener('change', updatePreview);

    document.getElementById('cancelDirBtn')?.addEventListener('click', closeForm);
    document.getElementById('saveDirBtn')?.addEventListener('click', saveDirection);
}

function updatePreview() {
    const via = (id) => document.getElementById(id).value.trim();

    if (!via('tipoVia') && !via('vPrincipal')) {
        dirEstr.preview().value = '';
        return;
    }

    let previewText = `${via('tipoVia')} ${via('vPrincipal')}${via('sufPrincipal')}`;

    if (via('vSecundaria')) {
        previewText += ` # ${via('vSecundaria')}${via('sufSecundaria')}`;
    }

    if (via('numPlaca')) {
        previewText += ` - ${via('numPlaca')}`;
    }

    if (via('compleDir')) {
        previewText += `, ${via('compleDir')}`;
    }

    dirEstr.preview().value = previewText.toUpperCase();
    hasValue();
}

//funcion para abrir el subform
function openDirecForm(input) {
    activeInput = input;
    resetDirForm();
    if (input.value) {
        parseDirection(input);
        updatePreview();
    }
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

    if (dirEstr.preview()) dirEstr.preview().value = '';
}

//funcion para cerrar el subform
function closeForm() {
    dirEstr.container().style.display = 'none';
    activeInput = null;
}

//funcion para dividir la direccion de la DB y mapearla en su respectivo campo
export function parseDirection(input) {
    const dirString = input.value;
    const match = dirString.match(regexDir);

    let isValid = false

    if (match) {
        //identifica tipo de via ya este en mayuscula o minuscula
        let tipVia = match[1].trim();

        tipVia = tipVia.charAt(0).toUpperCase() + tipVia.slice(1).toLowerCase();

        const selectVia = dirEstr.tipoVia();

        selectVia.value = tipVia;

        //si no reconoce el tipo de via deja el select en opcion por defecto
        if (selectVia.selectedIndex === -1) {
            selectVia.selectedIndex = 0;
            toggleValidInput(input, isValid, 'Dirección invalida.');
            return false;
        }

        dirEstr.vPrincipal().value = match[2];
        dirEstr.sufPrincipal().value = match[3] || '';
        dirEstr.vSecundaria().value = match[4];
        dirEstr.sufSecundaria().value = match[5] || '';
        dirEstr.numPlaca().value = match[6];
        dirEstr.compleDir().value = match[7] || '';
        isValid = true
        toggleValidInput(input, isValid);
        return true;
    } else {
        isValid = false;
        toggleValidInput(input, isValid, 'Dirección invalida.');
        return false;
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

        const isValid = via('tipoVia') && via('vPrincipal') && via('vSecundaria');

        toggleValidInput(activeInput, isValid, 'La dirección debe seguir el formato estándar.');

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

export function openFormDA() {
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

export let tempFiles = {};
let currentInput = null;
export let existingFiles = {};
let backupTemp = null;
let backupExisting = null;

export function initUploadDocs() {
    const docsForm = document.getElementById('uploadDocsForm');
    const panel = document.getElementById('uploadFilesPanel');
    const fileInput = document.getElementById('filesContainer');
    const listPreview = document.getElementById('fileList');
    const dropZone = document.getElementById('uploadContainer');

    //abre el panel cuando se oprime uno de los inputs
    docsForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('doc-trigger')) {
            const label = document.querySelector(`label[for="${e.target.id}"]`);
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

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        if (pdfFiles.length > 0) {
            addFilesToTemp(pdfFiles);
        } else {
            alert("Solo se permiten archivos PDF.")
        }
    });

    //guardar documentos
    document.getElementById('saveDocsBtn').addEventListener('click', () => {
        const dbList = existingFiles[currentInput] || [];
        const newList = tempFiles[currentInput] || [];
        const mainInput = document.getElementById(currentInput);

        const allNames = [...dbList, ...newList.map(f => f.name)];
        mainInput.value = allNames.join(', ');

        if (allNames.length > 0) mainInput.classList.add('file-existing');
        else mainInput.classList.remove('file-existing');

        checkExclusiones();
        panel.style.display = 'none';

        //quita flag de panel abierto y dispara la validacion
        delete mainInput.dataset.panelOpen;
        docInputValidation(mainInput);
    });

    document.getElementById('cancelDocsBtn').addEventListener('click', () => {
        tempFiles[currentInput] = backupTemp;
        existingFiles[currentInput] = backupExisting;
        const mainInput = document.getElementById(currentInput);
        const restoredNames = [
            ...(existingFiles[currentInput] || []),
            ...(tempFiles[currentInput] || []).map(f => f.name)
        ];

        mainInput.value = restoredNames.join(', ');
        if (restoredNames.length > 0) mainInput.classList.add('file-existing');
        else mainInput.classList.remove('file-existing');

        panel.style.display = 'none';

        //quita flag de panel abierto y dispara la validacion
        delete mainInput.dataset.panelOpen;
        docInputValidation(mainInput);
    });
}

//dispara una validacion visual en el input tras cerrar el panel
function docInputValidation(input) {
    if (!input) return;

    //valida si el panel ya fue visitado
    if (!input.dataset.panelVisited) return;
    const isEmpty = input.value.trim() === '';
    if (window.Validator && window.Validator.toggleValidInput) {
        window.Validator.toggleValidInput(input, !isEmpty, 'Este campo es obligatorio.');
    } else {
        //fallback: dispara blur para que initValidationIRT lo recoja
        input.dispatchEvent(new Event('blur', { bubbles: true }));
    }
}

function openUploadPanel(input, label) {
    currentInput = input.id;

    //marca que este input ya abrio el panel (para activar la validacion IRT)
    input.dataset.panelVisited = 'true';
    //suprime la validacion 'blur' mientras esta abierto el panel
    input.dataset.panelOpen = 'true';

    backupTemp = tempFiles[input.id] ? [...tempFiles[input.id]] : [];
    backupExisting = existingFiles[input.id] ? [...existingFiles[input.id]] : [];

    const panel = document.getElementById('uploadFilesPanel');
    const isMultiple = input.hasAttribute('multiple') || input.id === 'upRefeComerciales' || input.id === 'upCertificacionesVarias' || input.id === 'upEstadoFinanciero';

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

    const dbList = existingFiles[currentInput] || [];
    const currentTemp = tempFiles[currentInput];
    const totalFiles = dbList.length + currentTemp.length;
    let slotsLeft = 0;

    //certificaciones varias (limite 10)
    if (currentInput === 'upCertificacionesVarias') {
        const maxAllowed = 10;
        slotsLeft = maxAllowed - totalFiles;

        if (slotsLeft <= 0) {
            alertErrorBody.innerText = `Ya ha alcanzado el límite de ${maxAllowed} archivos para este campo. Elimine una para cargar una nueva.`;
            alertError.show();
            return;
        }

        const filesToAdd = files.slice(0, slotsLeft);
        if (files.length > slotsLeft) {
            alertBody.innerText = `Solo se agregaron ${slotsLeft} archivo(s). El limite es de ${maxAllowed} archivos.`;
            alert.show();
        }
        tempFiles[currentInput] = [...currentTemp, ...filesToAdd];

    }
    else if (currentInput === 'upRefeComerciales') {
        const maxAllowed = 2;
        slotsLeft = maxAllowed - totalFiles;

        if (slotsLeft <= 0) {
            alertErrorBody.innerHTML = `Ya ha alcanzado el límite de ${maxAllowed} archivos para este campo. Elimine uno para cargar uno nueva.`;
            alertError.show();
            return;
        }

        const filesToAdd = files.slice(0, slotsLeft);
        if (files.length > slotsLeft) {
            alertBody.innerText = `Solo se agregaron ${slotsLeft} archivo(s). El limite es de ${maxAllowed} archivos.`;
            alert.show();
        }
        tempFiles[currentInput] = [...currentTemp, ...filesToAdd];

    }
    else if (currentInput === 'upEstadoFinanciero') {
        const maxAllowed = 2;
        slotsLeft = maxAllowed - totalFiles;

        if (slotsLeft <= 0) {
            alertErrorBody.innerHTML = `Ya ha alcanzado el límite de ${maxAllowed} archivos para este campo. Elimine uno para cargar uno nueva.`;
            alertError.show();
            return;
        }

        const filesToAdd = files.slice(0, slotsLeft);
        if (files.length > slotsLeft) {
            alertBody.innerText = `Solo se agregaron ${slotsLeft} archivo(s). El limite es de ${maxAllowed} archivos.`;
            alert.show();
        }
        tempFiles[currentInput] = [...currentTemp, ...filesToAdd];

    }
    else {
        if (totalFiles >= 1) {
            alertBody.innerText = `Ya hay un archivo cargado para este campo. Elimine el archivo existente para cargar uno nuevo.`;
            alert.show();
            return;
        }
        tempFiles[currentInput] = [...currentTemp, files[0]];
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
    nameSpan.style.cursor = 'pointer';
    nameSpan.title = "Haga click para visualizar el documento";

    if (isExisting) nameSpan.style.color = "#28a745";

    //evento para visualizar el documento al hacer click en su nombre
    nameSpan.onclick = () => {
        if (isExisting) {
            //si viene de la DB se pasa los parametros para armar la URL del documento
            previewExistPDF(currentInput, name);
        } else {
            //si viene de los archivos temporales se crea un URL temporal para visualizarlo
            const fileObj = tempFiles[currentInput][index];
            if (fileObj) {
                const blobURL = URL.createObjectURL(fileObj);
                window.open(blobURL, '_blank');
                //libera memoria luego de un tiempo
                setTimeout(() => URL.revokeObjectURL(blobURL), 10000);
            }
            
        }
    };

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.innerHTML = '&times;';
    btnRemove.className = 'btn-remove-file';

    btnRemove.onclick = (e) => {
        e.stopPropagation();
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

function previewExistPDF(categoria, fileName) {
    //buscamos la ruta en el mapa de rutas cargadas desde la DB
    if (filePaths[categoria] && filePaths[categoria][fileName]) {
        const relativePath = filePaths[categoria][fileName];

        const url = relativePath.startsWith('/') ? relativePath : '/' + relativePath;

        //abrir doc en pestaña nueva
        window.open(url, '_blank');
    } else {
        console.log("No se encontró la ruta para el archivo:", fileName);
    }
}

export function removeTempFile(index) {
    if (tempFiles[currentInput]) {
        tempFiles[currentInput].splice(index, 1);
        renderFilePreview();
    }
};
