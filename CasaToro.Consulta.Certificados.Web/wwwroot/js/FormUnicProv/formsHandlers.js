import * as Constant from './constant.js';
import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as Collector from './collector.js';
import * as Validator from './validators.js';
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

//IDs de los paneles de documentos
export const docPanels = [
    'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado',
    'upComposicionAccionaria', 'upFotocopiaCC', 'upRefeComerciales',
    'upEstadoFinanciero', 'upCertificacionesVarias', 'upFUCPfirmado',
    'upOEAsi', 'upContingMeMagnetico', 'upContingFirmada',
    'upManifestacionSeguridad', 'upCertifiOEA', 'upAcuerdoSeguridad'
];

//Oculta los forms
export function hideForms() {
    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    uploadDocsForm.style.display = 'none';
    printFormatForm.style.display = 'none';
}

//Muestra los forms segun tipo de persona
export function showForms(typePerson) {
    if (typePerson === 'natural') {
        persNatuForm.style.display = 'block';
        persJuriForm.style.display = 'none';
        provForm.style.display = 'block';
        certSection.style.display = 'none';
    } else {
        persNatuForm.style.display = 'none';
        persJuriForm.style.display = 'block';
        provForm.style.display = 'block';
        certSection.style.display = 'block';
    }
}

//Inicializa los handlers compartidos
export function initSharedHandlers() {
    HUI.scrollButton();
    UI.firstBlock();
    HUI.initUploadDocs();
    Validator.dateLimits();
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
        if (sucursalItem) return;
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
            Constant.alertBody.innerText = 'Debe haber al menos una fila de control en la tabla de accionistas.';
            Constant.alert.show();
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
        if (input) input.addEventListener('change', UI.handlePEPChange);
    });

    //OEA
    document.querySelectorAll('input[name="upOEA"]').forEach(r => r.addEventListener('change', UI.toggleOEA));

    API.loadBancosData();
    UI.hasValue();
}

//abre y carga los forms segun el resultado de API
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
                UI.hasValue();
            }, 100);
        } else {
            setTimeout(async () => {
                await LD.loadMasterData(masterData, 'persJuriForm', idNum);
                UI.hasValue();
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
        UI.hasValue();
        return;
    }

    Constant.alertErrorBody.innerText = 'No se pudo determinar el estado del proveedor.';
    Constant.alertError.show();
}

//valida, recopila y envia los formularios de persona e informacion financiera
export async function submitForms(urlBase, getTypePerson, isNewRegisterRef) {
    const typePerson = getTypePerson();
    let dataProNJ = null;

    if (typePerson === 'natural') {
        if (!Validator.validateNaturalForm()) return;
        dataProNJ = Collector.collectFormData_Natural();
    } else if (typePerson === 'juridica') {
        if (!Validator.validateJuridicaForm()) return;
        dataProNJ = Collector.collectFormData_Juridica();
    }
    if (!Validator.validateProvForm(typePerson)) return;
    const provData = Collector.collectProvFormData(typePerson);

    const isNew = isNewRegisterRef.value;

    if (typePerson === 'natural') {
        await API.sendData(dataProNJ, isNew
            ? `${urlBase}/AddProviderNatural?typePerson=${typePerson}`
            : `${urlBase}/UpdateProviderNatural?typePerson=${typePerson}`);
        await API.sendData(provData, isNew
            ? `${urlBase}/AddProvFinanceInfo`
            : `${urlBase}/UpdateProvFinanceInfo`);
        uploadDocsBtn.disabled = false;

    } else if (typePerson === 'juridica') {
        await API.sendData(dataProNJ, isNew
            ? `${urlBase}/AddProviderJuridica?typePerson=${typePerson}`
            : `${urlBase}/UpdateProviderJuridica?typePerson=${typePerson}`);
        await API.sendData(provData, isNew
            ? `${urlBase}/AddProvFinanceInfo`
            : `${urlBase}/UpdateProvFinanceInfo`);
        printFormatBtn.disabled = false;
        uploadDocsBtn.disabled = false;
    }

    Constant.alertSuccesBody.innerText = 'Proveedor guardado completamente.';
    Constant.alertSuccess.show();

    // Aviso especial al actualizar persona jurídica
    if (!isNew && typePerson === 'juridica') {
        document.getElementById('alertSuccess').addEventListener('hidden.bs.modal', function onDone() {
            this.removeEventListener('hidden.bs.modal', onDone);
            Constant.alertBody.innerText = 'El formato ha sido actualizado. Debe imprimir nuevamente el Formato, firmarlo y volver a cargarlo en la sección de documentos.';
            Constant.alert.show();
        }, { once: true });
    }
}

//carga el panel de documentos
export async function uploadDocsPanel(getIdNum, getTypePerson) {
    hideForms();
    uploadDocsForm.style.display = 'block';

    const idNum = getIdNum();
    const typePerson = getTypePerson();

    try {
        const result = await API.getProvDocuments(idNum);
        LD.loadDocsForm(result.data || [], result.isOEA || null);
        UI.hasValue();
    } catch (err) {
        console.error('Error cargando archivos guardados:', err);
        LD.loadDocsForm([], null);
    }

    UI.blockExcl('upFUCPfirmado', typePerson === 'natural');
}

//valida, recolecta y envia documentos
export async function submitDocs(urlDocs, getTypePerson, markVisited = false) {
    if (markVisited) {
        docPanels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.dataset.panelVisited = 'true';
        });
    }

    if (!Validator.validateDocsForm()) return;

    const typePerson = getTypePerson();

    const docFormData = Collector.collectDocsForm(typePerson);
    await API.sendFiles(docFormData, urlDocs);

    Constant.alertSuccesBody.innerText = 'Documentos cargados correctamente.';
    Constant.alertSuccess.show();
}
