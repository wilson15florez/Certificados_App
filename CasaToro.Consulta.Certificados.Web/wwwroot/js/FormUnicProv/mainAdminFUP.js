import * as CNS from './constant.js';
import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as VLD from './validators.js';
import * as FHS from './formsHandlers.js';

//Referencias DOM
const personTypeSel = document.getElementById('personType');
const idNumInp = document.getElementById('idNum');
const consultBtn = document.getElementById('consultBtn');


//estado del registro actual
const isNewRegister = { value: false };

//obtener tipo persona y id desde bloque de consulta
function getTypePerson(result = null) {
    if (result?.typePerson) return result.typePerson.toLowerCase().trim();
    return personTypeSel.value;
}
function getIdNum() {
    return idNumInp.value.trim();
}

//funcion que inicializa los handlers
function initAdmin() {
    FHS.initSharedHandlers();

    //atajo de teclado para consultar al oprimir enter
    idNumInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            consultBtn.click();
        }
    });

    //oculta forms al cambiar tipo de persona o editar id
    personTypeSel.addEventListener('change', function () {
        FHS.hideForms();
        FHS.subNavContainer.style.display = 'none';
        idNumInp.value = '';
        CNS.hasValue();
    });
    idNumInp.addEventListener('input', function () {
        FHS.hideForms();
        FHS.subNavContainer.style.display = 'none';
    });
}

//consulta de informacion
consultBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const personType = getTypePerson();
    const idNum = getIdNum();

    UI.clearValidationIRT();
    FHS.docPanels.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            delete el.dataset.panelVisited;
            delete el.dataset.panelOpen;
        }
    });

    FHS.hideForms();

    if (!personType || !idNum) {
        CNS.alertErrorBody.innerText = 'Por favor, ingrese el Tipo de persona e ingrese el Numero de Identificación.';
        CNS.alertError.show();
        return;
    }

    FHS.subNavContainer.style.display = 'block';

    try {
        const result = await API.getProvDataForms(idNum, personType);

        //id no encontrado (proveedor no registrado)
        if (result.status === 'notFound') {
            CNS.alertErrorBody.innerText = `Proveedor con ID: ${idNum} no encontrado. Verifique el ID o registre el nuevo proveedor.`;
            CNS.alertError.show();
            FHS.openFormsBtn.disabled = true;
            FHS.printFormatBtn.disabled = true;
            FHS.uploadDocsBtn.disabled = true;
            return;
        }

        //id ya registrado con un tipo de persona diferente
        if (result.status === 'misMatch') {
            const typeText = result.registeredType === 'natural' ? 'Persona Natural' : 'Persona Juridica';
            CNS.alertBody.innerHTML = `¡Advertencia! El proveedor con ID: ${idNum} ya esta registrado como ${typeText}.`;
            CNS.alert.show();
            FHS.openFormsBtn.disabled = true;
            FHS.printFormatBtn.disabled = true;
            FHS.uploadDocsBtn.disabled = true;
            return;
        }

        //id solo encontrado en proveedores_master (sin registro como persona natural/juridica ni de informacion financiera)
        if (result.status === 'foundMasterOnly') {
            CNS.alertSuccesBody.innerText = `Proveedor con ID: ${idNum} encontrado sin Formato diligenciado y/o actualizado. Complete la informacion.`;
            CNS.alertSuccess.show();
            FHS.openFormsBtn.disabled = false;
            FHS.printFormatBtn.disabled = true;
            FHS.uploadDocsBtn.disabled = true
            return;
        }

        //id encontrado en proveedores_master, con registro como persona natural/juridica e informacion financiera
        if (result.status === 'foundDetail') {
            //valida si el formato esta vigente o debe actualizar
            if (result.dataValityFUCP) await VLD.validityFUCP(result.dataValityFUCP);
            FHS.openFormsBtn.disabled = false;
            FHS.printFormatBtn.disabled = false;
            FHS.uploadDocsBtn.disabled = false;
            return;
        }

        CNS.alertErrorBody.innerText = 'No se pudo determinar el estado del proveedor.';
        CNS.alertError.show();
    }
    catch (error) {
        CNS.alertErrorBody.innerText = 'Error al consultar: ' + error.message;
        CNS.alertError.show();
        console.error('Error de Fetch: ', error);
    }
});

//abrir formularios
FHS.openFormsBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const idNum = getIdNum();
    FHS.printFormatForm.style.display = 'none';
    FHS.uploadDocsForm.style.display = 'none';

    try {
        const result = await API.getProvDataForms(idNum, getTypePerson());
        await FHS.openForms(result, getTypePerson, idNum, isNewRegister);
    }
    catch (error) {
        CNS.alertErrorBody.innerText = 'Error al cargar el formulario: ' + error.message;
        CNS.alertError.show();
        console.error(error);
    }
});

//visualizar formato para impresion
FHS.printFormatBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    FHS.hideForms();

    if (getTypePerson() !== 'juridica') {
        CNS.alertErrorBody.innerText = 'La impresión de formato solo está disponible para Personas Jurídicas.';
        CNS.alertError.show();
        return;
    }

    try {
        const result = await API.getFormat(getIdNum(), getTypePerson());
        if (result?.url) UI.printFormatHandler(result.url);
    }
    catch (err) {
        console.error('Error al obtener el formato: ' + err);
        CNS.alertErrorBody.innerText = err.message;
        CNS.alertError.show();
        UI.printFormatHandler(null);
    }
});

//cargue de documentos
FHS.uploadDocsBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    await FHS.uploadDocsPanel(getIdNum, getTypePerson);
});

//guardar informacion: persona y financiero
FHS.submitPrvBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await FHS.submitForms('/Admin', getTypePerson, isNewRegister);
    }
    catch (err) {
        console.error('Error al guardar proveedor: ', err);
        CNS.alertErrorBody.innerText = 'Error al guardar: ' + (err.message || err);
        CNS.alertError.show();
    }
});

//guardar documentos
FHS.submitDocsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await FHS.submitDocs('/Admin/UploadDocuments', getTypePerson, true);
    }
    catch (err) {
        console.error('Error al cargar documentos: ', err);
        CNS.alertErrorBody.innerText = 'Error al cargar: ' + (err.message || err);
        CNS.alertError.show();
    }
});

initAdmin();
