import * as CNS from './constant.js';
import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as VLD from './validators.js';
import * as FHS from './formsHandlers.js';

/**
 * Referencia mutable al estado del registro actual.
 * true = registro nuevo (solo está en Master), false = ya tiene datos completos.
 * @type {{value: boolean}}
 */
const isNewRegister = { value: false };

/**
 * Tipo de persona del proveedor autenticado ('natural' o 'juridica').
 * Se asigna en consultProv y se reutiliza en los callbacks de los botones.
 * @type {string|null}
 */
let typePerson = null;

/**
 * Consulta el tipo de persona del proveedor y lo asigna al módulo.
 * Usa caché — si typePerson ya está asignado, no hace otra llamada a la API.
 * Se llama antes de submitForms y submitDocs para garantizar que typePerson esté actualizado.
 * @returns {Promise<string>} Tipo de persona ('natural' o 'juridica').
 */
async function consultTypePerson() {
    if (typePerson) return typePerson;
    const result = await API.getProvDataForms(null);
    typePerson = (result.typeperson || result.typePerson || '').toLowerCase().trim();
    return typePerson;
}

/**
 * Retorna el tipo de persona actual de forma síncrona.
 * Se usa como callback en submitForms y submitDocs que esperan una función, no un valor.
 * @returns {string} Tipo de persona o cadena vacía si aún no se ha consultado.
 */
function getTypePerson() {
    return typePerson ?? '';
}

/**
 * Inicializa la vista del proveedor: registra los handlers compartidos
 * y consulta el estado del registro del proveedor autenticado.
 */
async function initProveedor() {
    FHS.initSharedHandlers();
    await consultProv();
}

/**
 * Consulta el estado del registro del proveedor autenticado y actualiza la UI.
 * - foundMasterOnly: el proveedor existe en Master pero no tiene formulario completo.
 *   Si TipoPersona está asignado, muestra los botones de navegación.
 *   Si no, solicita que se configure el tipo en "Editar Perfil".
 * - foundDetail: el proveedor tiene registro completo. Valida vigencia del FUCP
 *   y habilita todos los botones de navegación.
 */
async function consultProv() {
    try {
        const result = await API.getProvDataForms(null);
        typePerson = (result.typeperson || result.typePerson || '').toLowerCase().trim();

        //id solo encontrado en proveedores_master (sin registro como persona natural/juridica ni de informacion financiera)
        if (result.status === 'foundMasterOnly') {
            if (typePerson === 'natural' || typePerson === 'juridica') {
                const nit = result.data?.nit ?? result.data?.Nit ?? '';
                CNS.alertSuccesBody.innerText = `Proveedor con ID: ${nit} encontrado sin Formato diligenciado y/o actualizado. Complete la informacion.`;
                CNS.alertSuccess.show();
                FHS.subNavContainer.style.display = 'block';
                FHS.openFormsBtn.disabled = false;
                FHS.printFormatBtn.disabled = true;
                FHS.uploadDocsBtn.disabled = true;
            } else {
                CNS.alertBody.innerText = 'Tipo de persona no ha sido seleccionado. \n Por favor registre que tipo de persona es en la pestaña "Editar Perfil"';
                CNS.alert.show();
            }
            return;
        }

        //id encontrado en proveedores_master, con registro como persona natural/juridica e informacion financiera
        if (result.status === 'foundDetail') {
            //valida si el formato esta vigente o debe actualizar
            if (result.dateValityFUCP) await VLD.validityFUCP(result.dateValityFUCP);
            FHS.subNavContainer.style.display = 'block';
            FHS.openFormsBtn.disabled = false;
            FHS.printFormatBtn.disabled = false;
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

//visualizar formato para impresion (solo disponible para persona juridica)
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
    //pasa null porque el backend obtiene getIdNum del claim de inicio de sesion
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
        //pasa null porque el backend obtiene getTypePerson del claim de inicio de sesion
        await FHS.submitDocs('/Proveedor/UploadDocuments', () => null, false);
    }
    catch (err) {
        console.error('Error al cargar documentos:', err);
        CNS.alertErrorBody.innerText = 'Error al cargar: ' + (err.message || err);
        CNS.alertError.show();
    }
});

initProveedor();
