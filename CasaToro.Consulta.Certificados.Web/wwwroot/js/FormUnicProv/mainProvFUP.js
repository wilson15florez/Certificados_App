import * as CNS from './constant.js';
import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as VLD from './validators.js';
import * as FHS from './formsHandlers.js';

//estado del registro actual
const isNewRegister = { value: false };

//agarra el typePerson
let typePerson = null;

//consulta una sola vez el tipo de persona del proveedor y lo asigna
async function consultTypePerson() {
    if (typePerson) return typePerson;
    const result = await API.getProvDataForms(null);
    typePerson = (result.typeperson || result.typePerson || '').toLowerCase().trim();
    return typePerson;
}

//funcion sincrona para usar como callback en submitForms y submitDocs
function getTypePerson() {
    return typePerson ?? '';
}

//funcion que inicializa los handlers
async function initProveedor() {
    FHS.initSharedHandlers();
    await consultProv();
}

async function consultProv() {
    try {
        const result = await API.getProvDataForms(null);
        typePerson = (result.typeperson || result.typePerson || '').toLowerCase().trim();

        //id solo encontrado en proveedores_master (sin registro como persona natural/juridica ni de informacion financiera)
        if (result.status === 'foundMasterOnly') {
            const nit = result.data?.nit ?? result.data?.Nit ?? '';
            CNS.alertSuccesBody.innerText = `Proveedor con ID: ${nit} encontrado sin Formato diligenciado y/o actualizado. Complete la informacion.`;
            CNS.alertSuccess.show();
            FHS.subNavContainer.style.display = 'block';
            FHS.openFormsBtn.disabled = false;
            FHS.printFormatBtn.disabled = true;
            FHS.uploadDocsBtn.disabled = true;
            return;
        }

        //id encontrado en proveedores_master, con registro como persona natural/juridica e informacion financiera
        if (result.status === 'foundDetail') {
            //valida si el formato esta vigente o debe actualizar
            if (result.dateValityFUCP) await VLD.validityFUCP(result.dateValityFUCP);
            FHS.subNavContainer.style.display = 'block';
            FHS.openFormsBtn.disabled = false;
            FHS.printFormatBtn.disabled = (typePerson === 'natural');
            FHS.uploadDocsBtn.disabled = false;
            return;
        }

        CNS.alertErrorBody.innerText = 'No se pudo determinar el estado del proveedor.';
        CNS.alertError.show();
    }
    catch (error) {
        CNS.alertErrorBody.innerText = `Error al verificar el proveedor: ${error.message}`;
        CNS.alertError.show();
        console.error('Error al verificar el proveedor:', error);
    }
}

//abrir formularios
FHS.openFormsBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    FHS.printFormatForm.style.display = 'none';
    FHS.uploadDocsForm.style.display = 'none';

    try {
        const result = await API.getProvDataForms(null);
        typePerson = (result.typeperson || result.typePerson || '').toLowerCase().trim();
        const idNum = result.data?.nit ?? result.data?.Nit ?? null;

        await FHS.openForms(result, () => typePerson, idNum, isNewRegister);
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

    if (typePerson !== 'juridica') {
        CNS.alertErrorBody.innerText = 'La impresión de formato solo está disponible para Personas Jurídicas.';
        CNS.alertError.show();
        return;
    }

    try {
        const result = await API.getFormat(null);
        if (result?.url) UI.printFormatHandler(result?.url);
    }
    catch (err) {
        console.error('Error al obtener formato:', err);
        CNS.alertErrorBody.innerText = err.message;
        CNS.alertError.show();
        UI.printFormatHandler(null);
    }
});

//cargue de documentos
FHS.uploadDocsBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    await FHS.uploadDocsPanel(() => null, getTypePerson);
});

//guardar informacion: persona y financiero
FHS.submitPrvBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    //asegura que typePerson este actualizado antes de enviar
    await consultTypePerson();

    try {
        await FHS.submitForms('/Proveedor', getTypePerson, isNewRegister);
    }
    catch (err) {
        console.error('Error al guardar proveedor:', err);
        CNS.alertErrorBody.innerText = 'Error al guardar: ' + (err.message || err);
        CNS.alertError.show();
    }
});

//guardar documentos
FHS.submitDocsBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    //asegura que typePerson este actualizado antes de enviar
    await consultTypePerson();

    try {
        await FHS.submitDocs('/Proveedor/UploadDocuments', () => null, false);
    }
    catch (err) {
        console.error('Error al cargar documentos:', err);
        CNS.alertErrorBody.innerText = 'Error al cargar: ' + (err.message || err);
        CNS.alertError.show();
    }
});

initProveedor();
