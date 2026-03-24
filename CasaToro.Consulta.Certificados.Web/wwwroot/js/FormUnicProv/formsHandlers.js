import * as CNS from './constant.js';
import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as CLT from './collector.js';
import * as VLD from './validators.js';
import * as HUI from './helpers-ui.js';
import * as LD from './loader.js';

//Referencias del DOM compartidas
export const subNavContainer = document.getElementById('subNavContainer');
export const openFormsBtn = document.getElementById('openFormsBtn');
export const printFormatBtn = document.getElementById('printFormatBtn');
export const uploadDocsBtn = document.getElementById('uploadDocsBtn');

export const persNatuForm = document.getElementById('persNatuForm');
export const persJuriForm = document.getElementById('persJuriForm');
export const provForm = document.getElementById('provForm');
export const certSection = document.getElementById('certSection');
export const printFormatForm = document.getElementById('printFormatForm');
export const uploadDocsForm = document.getElementById('uploadDocsForm');

export const submitPrvBtn = document.getElementById('submitPrvBtn');
export const submitDocsBtn = document.getElementById('submitDocsBtn');

/**
 * IDs de todos los paneles de documentos del uploadDocsForm.
 * Se usan para marcar panelVisited al enviar y para limpiar el estado entre consultas.
 * @type {string[]}
 */
export const docPanels = [
    'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado',
    'upComposicionAccionaria', 'upFotocopiaCC', 'upRefeComerciales',
    'upEstadoFinanciero', 'upCertificacionesVarias', 'upFUCPfirmado',
    'upOEAsi', 'upContingMeMagnetico', 'upContingFirmada',
    'upManifestacionSeguridad', 'upCertifiOEA', 'upAcuerdoSeguridad'
];

/**
 * Oculta todos los formularios del FUCP.
 * Se llama al iniciar una nueva consulta o al navegar entre secciones.
 */
export function hideForms() {
    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    uploadDocsForm.style.display = 'none';
    printFormatForm.style.display = 'none';
}

/**
 * Muestra los formularios correspondientes al tipo de persona.
 * Para 'natural' muestra persNatuForm + provForm y oculta certSection.
 * Para 'juridica' muestra persJuriForm + provForm + certSection.
 * @param {'natural'|'juridica'} typePerson - Tipo de persona del proveedor.
 */
export function showForms(typePerson) {
    if (typePerson === 'natural') {
        persNatuForm.style.display = 'block';
        persJuriForm.style.display = 'none';
        provForm.style.display = 'block';
        certSection.style.display = 'none';
    } else if (typePerson === 'juridica') {
        persNatuForm.style.display = 'none';
        persJuriForm.style.display = 'block';
        provForm.style.display = 'block';
        certSection.style.display = 'block';
    }
}

/**
 * Inicializa todos los handlers compartidos entre la vista de admin y la de proveedor.
 * Debe llamarse una sola vez al cargar la página (desde initAdmin o initProveedor).
 * Registra: validación IRT, ubicaciones, sucursales, accionistas, radios dependientes,
 * sincronización CIIU, campos monetarios, teléfonos, dirección, declaraciones, PEP y OEA.
 */
export function initSharedHandlers() {
    HUI.scrollButton();
    UI.firstBlock();
    HUI.initUploadDocs();
    VLD.dateLimits();
    UI.ubicPJuHandler();
    UI.initValidationIRT();

    //nacionalidad y tipo de documento (para persona natural y juridica)
    $(pnTipoNacionalidad).off("change.pnTipoNac").on("change.pnTipoNac", async function () {
        UI.tipDocument();
        await UI.ubicPNaHandler(false);
    });
    $(pjRLTipNacionalidad).off("change.pjRLTipoDoc").on("change.pjRLTipoDoc", async function () {
        UI.pjTipDocument();
        await UI.ubicPJuReLeHandler();
    });

    //sucursales (pesona juridica)
    const addSucursalBtn = document.getElementById('addSucursalBtn');
    const sucursalesContainer = document.getElementById('sucursales-container');

    if (addSucursalBtn) addSucursalBtn.addEventListener('click', function () { UI.addSucursalInternal(); })
    sucursalesContainer.addEventListener('click', function (e) {
        if (!e.target.classList.contains('remove-sucursal-btn')) return;
        const sucursalItem = e.target.closest('.sucursal-item');
        if (!sucursalItem) return;
        sucursalItem.remove();

        sucursalesContainer.querySelectorAll('.sucursal-item').forEach((sucursal, index) => {
            const newIndex = index + 1;
            sucursal.id = `sucursal_${newIndex}`;
            sucursal.querySelector('h4').textContent = `Dirección sucursal ${newIndex}`;

            sucursal.querySelectorAll('label, input, select').forEach(el => {
                if (el.id) el.id = el.id.replace(/\d+/, newIndex);
                const oldFor = el.getAttribute('for');
                if (oldFor) el.setAttribute('for', oldFor.replace(/\d+/, newIndex));
            });
        });
    });

    //accionistas (persona juridica)
    const addControlRowBtn = document.getElementById('addControlRowBtn');
    const controlTableBody = document.querySelector('#control-table tbody');

    addControlRowBtn.addEventListener('click', () => UI.addControlRow());
    controlTableBody.addEventListener('click', function (e) {
        if (!e.target.classList.contains('remove-control-row')) return;
        if (controlTableBody.querySelectorAll('.control-row').length > 1) {
            e.target.closest('.control-row').remove();
        } else {
            CNS.alertBody.innerText = 'Debe haber al menos una fila de control en la tabla de accionistas.';
            CNS.alert.show();
        }
    });

    //provForm: Radios de campos dependientes
    document.getElementById('pvPorNacional').addEventListener('input', UI.togglePvPais);
    document.getElementById('pvPorExtranjero').addEventListener('input', UI.togglePvPais);
    [
        ['pvGrCon', UI.togglePvGC],
        ['pvDeclIndCom', UI.togglePvDIC],
        ['pvAutRet', UI.togglePvAR],
        ['pvPosCuBan', UI.togglePvCB],
        ['pvOpeCExt', UI.togglePvCoEx],
    ].forEach(([name, handler]) => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.addEventListener('change', handler));
    });

    //CIIU - Actividad Economica (sincronizacion bidireccional)
    API.loadCIIUData();
    $(pvAcEconomica).on('change', function () {
        const selectVal = $(this).val();
        if (selectVal && $(pvCodCIIU).val() !== selectVal) $(pvCodCIIU).val(selectVal).trigger('change.select2');
    });
    $(pvCodCIIU).on('change', function () {
        const selectVal = $(this).val();
        if (selectVal && $(pvAcEconomica).val() !== selectVal) $(pvAcEconomica).val(selectVal).trigger('change.select2');
    });

    //campos monetarios
    ['pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos', 'pvPatrimonio', 'pvOtrIngr', 'pvCapSocReg'
    ].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            const oldLength = e.target.value.length;

            e.target.value = HUI.formatCurrency(e.target.value);

            const delta = e.target.value.length - oldLength;
            e.target.setSelectionRange(cursorPos + delta, cursorPos + delta);
        });
    });

    //telefonos
    HUI.initTelInputs(document.getElementById('pnTelefono'), false);
    HUI.initTelInputs(document.getElementById('pnCelular'), true);
    HUI.initTelInputs(document.getElementById('pjTelDirPrincipal'), true);

    HUI.initDirection();
    HUI.initDeclAut();

    //PEP
    ['pnPEPSi', 'pnPEPNo'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('change', UI.togglePEP);
    });

    //OEA
    document.querySelectorAll('input[name="upOEA"]').forEach(r => r.addEventListener('change', UI.toggleOEA));

    API.loadBancosData();
    CNS.hasValue();
}

/**
 * Abre y precarga los formularios del FUCP según el resultado de la API.
 * - foundMasterOnly: limpia los forms, muestra el form del tipo correcto y carga solo
 *   los datos del Master (con sugerencia de nombre separado para persona natural).
 * - foundDetail: carga los datos completos de persona e información financiera.
 * @param {Object} result - Respuesta de la API (getProvDataForms o getProvPersonDetails).
 * @param {Function} getTypePerson - Callback que retorna el tipo de persona ('natural'|'juridica').
 * @param {string|null} idNum - NIT del proveedor (solo en flujo admin).
 * @param {{value: boolean}} isNewRegisterRef - Referencia mutable para rastrear si es registro nuevo.
 */
export async function openForms(result, getTypePerson, idNum, isNewRegisterRef) {
    if (result.status === 'foundMasterOnly') {
        isNewRegisterRef.value = true;
        const typePerson = getTypePerson(result);
        const masterData = result.data;
        const suggest = result.suggested;

        HUI.resetFormDA();
        showForms(typePerson);
        LD.loadFormData_Natural({});
        LD.loadProvFormData({});

        if (typePerson === 'natural') {
            setTimeout(async () => {
                await LD.loadMasterData(masterData, 'persNatuForm', idNum, suggest);
                CNS.hasValue();
            }, 100);
        } else {
            setTimeout(async () => {
                await LD.loadMasterData(masterData, 'persJuriForm', idNum);
                CNS.hasValue();
            }, 100);
        }
        return;
    }

    if (result.status === 'foundDetail') {
        isNewRegisterRef.value = false;
        const typePerson = getTypePerson(result);
        const formData = result.data;

        showForms(typePerson);

        if (typePerson === 'natural' && formData.natural) {
            await LD.loadFormData_Natural(formData.natural);
        } else if (typePerson === 'juridica' && formData.juridica) {
            await LD.loadFormData_Juridica(formData.juridica);
        }

        if (formData.finanInf) await LD.loadProvFormData(formData.finanInf);
        CNS.hasValue();
        return;
    }

    CNS.alertErrorBody.innerText = 'No se pudo determinar el estado del proveedor.';
    CNS.alertError.show();
}

/**
 * Valida, recopila y envía los formularios de persona (natural o jurídica)
 * e información financiera al backend.
 * Determina si es inserción o actualización según isNewRegisterRef.
 * Al finalizar habilita los botones de formato e impresión, y muestra alerta de éxito.
 * Si es actualización de persona jurídica, muestra aviso adicional para reimprimir el FUCP.
 * @param {string} urlBase - URL base del controlador ('/Admin' o '/Proveedor').
 * @param {Function} getTypePerson - Callback que retorna el tipo de persona actual.
 * @param {{value: boolean}} isNewRegisterRef - Si es true, inserta; si es false, actualiza.
 */
export async function submitForms(urlBase, getTypePerson, isNewRegisterRef) {
    const typePerson = getTypePerson();
    let dataProNJ = null;

    if (typePerson === 'natural') {
        if (!VLD.validateNaturalForm()) return;
        dataProNJ = CLT.collectFormData_Natural();
    } else if (typePerson === 'juridica') {
        if (!VLD.validateJuridicaForm()) return;
        dataProNJ = CLT.collectFormData_Juridica();
    }
    if (!VLD.validateProvForm(typePerson)) return;
    const provData = CLT.collectProvFormData(typePerson);

    const isNew = isNewRegisterRef.value;

    if (typePerson === 'natural') {
        await API.sendData(dataProNJ, isNew
            ? `${urlBase}/AddProviderNatural?typePerson=${typePerson}`
            : `${urlBase}/UpdateProviderNatural?typePerson=${typePerson}`);
        await API.sendData(provData, isNew
            ? `${urlBase}/AddProvFinanceInfo`
            : `${urlBase}/UpdateProvFinanceInfo`);

    } else if (typePerson === 'juridica') {
        await API.sendData(dataProNJ, isNew
            ? `${urlBase}/AddProviderJuridica?typePerson=${typePerson}`
            : `${urlBase}/UpdateProviderJuridica?typePerson=${typePerson}`);
        await API.sendData(provData, isNew
            ? `${urlBase}/AddProvFinanceInfo`
            : `${urlBase}/UpdateProvFinanceInfo`);
    }
    printFormatBtn.disabled = false;
    uploadDocsBtn.disabled = false;

    CNS.alertSuccesBody.innerText = 'Proveedor guardado completamente.';
    CNS.alertSuccess.show();

    // Aviso especial al actualizar persona jurídica
    if (!isNew && typePerson === 'juridica') {
        document.getElementById('alertSuccess').addEventListener('hidden.bs.modal', function onDone() {
            this.removeEventListener('hidden.bs.modal', onDone);
            CNS.alertBody.innerText = 'El formato ha sido actualizado. Debe imprimir nuevamente el Formato, firmarlo y volver a cargarlo en la sección de documentos.';
            CNS.alert.show();
        }, { once: true });
    }
}

/**
 * Carga el panel de documentos del proveedor.
 * Oculta los demás forms, muestra uploadDocsForm, obtiene los documentos guardados
 * y aplica el bloqueo del campo upFUCPfirmado para persona natural
 * (ya que el FUCP no aplica para naturales).
 * @param {Function} getIdNum - Callback que retorna el NIT del proveedor (null en flujo proveedor).
 * @param {Function} getTypePerson - Callback que retorna el tipo de persona actual.
 */
export async function uploadDocsPanel(getIdNum, getTypePerson) {
    hideForms();
    uploadDocsForm.style.display = 'block';

    const idNum = getIdNum();
    const typePerson = getTypePerson();

    try {
        const result = await API.getProvDocuments(idNum);
        LD.loadDocsForm(result.data || [], result.isOEA || null);
        CNS.hasValue();
    } catch (err) {
        console.error('Error cargando archivos guardados:', err);
        LD.loadDocsForm([], null);
    }

    HUI.blockExcl('upFUCPfirmado', typePerson === 'natural');
}

/**
 * Valida, recopila y envía los documentos del proveedor al backend.
 * Si markVisited es true, marca todos los paneles como visitados antes de validar
 * (comportamiento del flujo admin donde el admin puede no haber abierto todos los paneles).
 * @param {string} urlDocs - URL del endpoint de carga de documentos.
 * @param {Function} getTypePerson - Callback que retorna el tipo de persona actual.
 * @param {boolean} [markVisited=false] - Si true, fuerza la validación de todos los paneles.
 */
export async function submitDocs(urlDocs, getTypePerson, markVisited = false) {
    if (markVisited) {
        docPanels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.dataset.panelVisited = 'true';
        });
    }

    if (!VLD.validateDocsForm()) return;

    const typePerson = getTypePerson();

    const docFormData = CLT.collectDocsForm(typePerson);
    await API.sendFiles(docFormData, urlDocs);

    CNS.alertSuccesBody.innerText = 'Documentos cargados correctamente.';
    CNS.alertSuccess.show();
}
