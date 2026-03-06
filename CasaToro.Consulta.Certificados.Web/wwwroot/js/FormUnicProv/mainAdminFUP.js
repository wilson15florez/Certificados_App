import { alertSuccesBody, alertErrorBody, alertBody, alertSuccess, alertError, alert } from './constant.js';
import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as Collector from './collector.js';
import * as Validator from './validators.js';
import * as Fhelper from './form-helpers.js';

const personTypeSelect = document.getElementById('personType');
const personType = personTypeSelect.value;
const idNumInput = document.getElementById('idNum');
const idNum = idNumInput.value.trim();

const openFormsBtn = document.getElementById('openFormsBtn');
const uploadDocsBtn = document.getElementById('uploadDocsBtn');
const printFormatBtn = document.getElementById('printFormatBtn');

const persNatuForm = document.getElementById('persNatuForm');
const persJuriForm = document.getElementById('persJuriForm');
const provForm = document.getElementById('provForm');
const certSection = document.getElementById('certSection');
const uploadDocsForm = document.getElementById('uploadDocsForm');

const consultBtn = document.getElementById('consultBtn');
const submitPrvBtn = document.getElementById('submitPrvBtn');

let isNewRegister = false;

//funcion de inicializacion de handlers
function initHandlers() {

    UI.scrollButton();
    UI.firstBlock();
    Fhelper.initUploadDocs();
    Validator.dateLimits();
    UI.ubicPJuHandler();
    UI.initValidationIRT();

    //handlers de nacionalidad y tipo de documento para form persona natural y juridica
    $(pnTipoNacionalidad).off("change.pnTipoNac").on("change.pnTipoNac", async function () {
        UI.tipDocument();
        await UI.ubicPNaHandler(false);
    });
    $(pjRLTipNacionalidad).off("change.pjRLTipoDoc").on("change.pjRLTipoDoc", async function () {
        UI.pjTipDocument();
        await UI.ubicPJuReLeHandler();
    });

    //handlers para agregar y eliminar sucursales en form persona juridica
    const addSucursalBtn = document.getElementById('addSucursalBtn');
    const sucursalesContainer = document.getElementById('sucursales-container');

    if (addSucursalBtn) addSucursalBtn.addEventListener('click', function () { UI.addSucursalInternal(); })
    sucursalesContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-sucursal-btn')) {
            const sucursalItem = e.target.closest('.sucursal-item');
            if (sucursalItem) {
                sucursalItem.remove();

                const sucursales = sucursalesContainer.querySelectorAll('.sucursal-item');
                sucursales.forEach((sucursal, index) => {
                    const newIndex = index + 1;
                    sucursal.id = `sucursal_${newIndex}`;
                    sucursal.querySelector('h4').textContent = `Dirección sucursal ${newIndex}`;

                    sucursal.querySelectorAll('label, input, select').forEach(element => {
                        const oldId = element.id;
                        const newId = oldId ? oldId.replace(/\d+/, newIndex) : null;
                        if (newId) element.id = newId;

                        const oldFor = element.getAttribute('for');
                        const newFor = oldFor ? oldFor.replace(/\d+/, newIndex) : null;
                        if (newFor) element.setAttribute('for', newFor);
                    });
                });
            }
        }
    });

    //handlers para agregar y eliminar filas de accionistas en form persona juridica
    const addControlRowBtn = document.getElementById('addControlRowBtn');
    const controlTableBody = document.querySelector('#control-table tbody');

    addControlRowBtn.addEventListener('click', function () { UI.addControlRow(); });
    controlTableBody.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-control-row')) {
            if (controlTableBody.querySelectorAll('.control-row').length > 1) {
                e.target.closest('.control-row').remove();
            } else {
                alertBody.innerText = 'Debe haber al menos una fila de control en la tabla de accionistas.';
                alert.show();
            }
        }
    });

    //handlers para provForm (informacion financiera)
    //const pvTipEmp = document.querySelectorAll('input[name="pvTipEmp"]');
    const pvPorNacional = document.getElementById('pvPorNacional');
    const pvPorExtranjero = document.getElementById('pvPorExtranjero');
    const pvGrCon = document.querySelectorAll('input[name="pvGrCon"]');
    const pvDeclIndCom = document.querySelectorAll('input[name="pvDeclIndCom"]');
    const pvAutRet = document.querySelectorAll('input[name="pvAutRet"]');
    const pvPosCuBan = document.querySelectorAll('input[name="pvPosCuBan"]');
    const pvOpeCExt = document.querySelectorAll('input[name="pvOpeCExt"]');

    //pvTipEmp.forEach(r => r.addEventListener('input', UI.togglePvTE));
    pvPorNacional.addEventListener('input', UI.togglePvPais);
    pvPorExtranjero.addEventListener('input', UI.togglePvPais);
    pvGrCon.forEach(r => r.addEventListener('change', UI.togglePvGC));
    pvDeclIndCom.forEach(r => r.addEventListener('change', UI.togglePvDIC));
    pvAutRet.forEach(r => r.addEventListener('change', UI.togglePvAR));
    pvPosCuBan.forEach(r => r.addEventListener('change', UI.togglePvCB));
    pvOpeCExt.forEach(r => r.addEventListener('change', UI.togglePvCoEx));

    //carga datos de codigos CIIU y actividades economicas
    API.loadCIIUData();
    //sincroniza actividad economica -> codigo CIIU provForm (informacion financiera)
    $(pvAcEconomica).on('change', function () {
        const selectVal = $(this).val();
        if (selectVal && $(pvCodCIIU).val() !== selectVal) {
            $(pvCodCIIU).val(selectVal).trigger('change.select2');
        }
    });
    //sincroniza codigo CIIU -> actividad economica provForm (informacion financiera)
    $(pvCodCIIU).on('change', function () {
        const selectVal = $(this).val();
        if (selectVal && $(pvAcEconomica).val() !== selectVal) {
            $(pvAcEconomica).val(selectVal).trigger('change.select2');
        }
    });

    //formato de campos monetarios provForm (informacion financiera)
    const moneyInputs = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos',
        'pvPasivos', 'pvPatrimonio', 'pvOtrIngr',
        'pvCapSocReg'
    ];
    moneyInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let cursorPos = e.target.selectionStart;
                let oldLength = e.target.value.length;

                e.target.value = UI.formatCurrency(e.target.value);

                let newLength = e.target.value.length;
                cursorPos += (newLength - oldLength);
                e.target.setSelectionRange(cursorPos, cursorPos);
            });
        }
    });

    //inicializacion de instancias de intl-tel-input
    Fhelper.initTelInputs(document.getElementById('pnTelefono'), false);
    Fhelper.initTelInputs(document.getElementById('pnCelular'), true);
    Fhelper.initTelInputs(document.getElementById('pjTelDirPrincipal'), true);

    Fhelper.initDirection();
    Fhelper.initDeclAut();

    //UI.handlePEPChange();
    const pnPEPYes = document.getElementById('pnPEPSi');
    const pnPEPNo = document.getElementById('pnPEPNo');

    if (pnPEPYes) pnPEPYes.addEventListener('change', UI.handlePEPChange);
    if (pnPEPNo) pnPEPNo.addEventListener('change', UI.handlePEPChange);

    const upOEA = document.querySelectorAll('input[name="upOEA"]');
    upOEA.forEach(r => r.addEventListener('change', UI.toggleOEA));

    //carga de datos de bancos
    API.loadBancosData();


    UI.hasValue();
}

//atajo de consulta con enter
idNumInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        consultBtn.click();
    }
});
//funcion de consulta en el BACKEND
consultBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const openFormsBtn = document.getElementById('openFormsBtn');
    const uploadDocsBtn = document.getElementById('uploadDocsBtn');
    const printFormatForm = document.getElementById('printFormatForm');

    const personTypeSelect = document.getElementById('personType');
    const personType = personTypeSelect.value;
    const idNumInput = document.getElementById('idNum');
    const idNum = idNumInput.value.trim();

    //limpia validaciones visuales de posible consulta anterior
    UI.clearValidationIRT();
    [
        'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 'upComposicionAccionaria',
        'upFotocopiaCC', 'upRefeComerciales', 'upEstadoFinanciero', 'upCertificacionesVarias',
        'upFUCPfirmado', 'upOEAsi', 'upContingMeMagnetico', 'upContingFirmada',
        'upManifestacionSeguridad', 'upCertifiOEA', 'upAcuerdoSeguridad'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) { delete el.dataset.panelVisited; delete el.dataset.panelOpen; }
    });

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    uploadDocsForm.style.display = 'none';
    printFormatForm.style.display = 'none';

    if (!personType || !idNum) {
        alertErrorBody.innerText = 'Por favor, ingrese el Tipo de persona e ingrese el Numero de Identificación.';
        alertError.show();
        return;
    }

    const subNavConteiner = document.getElementById('subNavConteiner');
    subNavConteiner.style.display = 'block';

    try {

        const result = await API.getProvDataForms(idNum, personType);

        //ID no encontrado (proveedor no registrado)
        if (result.status === 'notFound') {
            alertBody.innerText = `Proveedor con ID: ${idNum} no encontrado. Verifique el ID o registre el nuevo proveedor.`;
            alert.show();
            openFormsBtn.disabled = true;
            uploadDocsBtn.disabled = true;
            printFormatBtn.disabled = true;

            return;
        }

        //ID ya registrado con un tipo de persona diferente
        if (result.status === 'misMatch') {
            const registeredTypeText = result.registeredType === 'natural' ? 'Persona Natural' : 'Persona Juridica';
            alertBody.innerText = `¡Advertencia! El proveedor con ID: ${idNum} ya esta registrado como ${registeredTypeText}.`;
            alert.show();
            openFormsBtn.disabled = true;
            uploadDocsBtn.disabled = true;
            printFormatBtn.disabled = true;

            return;
        }

        //ID solo registrado en proveedores_Master
        if (result.status === 'foundMasterOnly') {
            const data = result.data;
            alertSuccesBody.innerText = `Proveedor con ID: ${idNum} encontrado sin Formato diligenciado y/o actualizado. Complete la informacion.`;
            alertSuccess.show();
            openFormsBtn.disabled = false;
            printFormatBtn.disabled = true;
            uploadDocsBtn.disabled = false;

            return;
        }

        //ID ya registrado en proveedores_Master, en una tabla de tipo de persona (natural o juridica) y en proveedores_InfoFinanciera
        if (result.status === 'foundDetail') {
            const dateValityFUCP = result.dateValityFUCP;
            if (dateValityFUCP) {
                await Validator.validityFUCP(dateValityFUCP);
            }
            openFormsBtn.disabled = false;
            uploadDocsBtn.disabled = false;
            if (personType === 'natural') printFormatBtn.disabled = true;

            return;
        }

        alertErrorBody.innerText = 'No se pudo determinar el estado del proveedor.';
        alertError.show();

    } catch (error) {
        alertErrorBody.innerText = 'Error al consultar: ' + error.message;
        alertError.show();
        console.error('Error de Fetch:', error);
    }
});

//logica para mostrar/ocultar entre acciones de la sub nav
openFormsBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const personTypeSelect = document.getElementById('personType');
    const personType = personTypeSelect.value;
    const idNumInput = document.getElementById('idNum');
    const idNum = idNumInput.value.trim();

    uploadDocsForm.style.display = 'none';
    printFormatForm.style.display = 'none';

    try {
        const result = await API.getProvDataForms(idNum, personType);
        console.log(result);

        //ID solo registrado en proveedores_Master
        if (result.status === 'foundMasterOnly') {
            isNewRegister = true;

            const masterData = result.data;
            const suggest = result.suggested;

            Fhelper.resetFormDA();

            if (personType === 'natural') {
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block';
                certSection.style.display = 'none';

                UI.loadFormData_Natural({});
                UI.loadProvFormData({});

                setTimeout(async () => {
                    await UI.loadMasterData(masterData, 'persNatuForm', idNum, suggest);
                    UI.hasValue();
                }, 100);

            } else {
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block';
                certSection.style.display = 'block';
                UI.loadFormData_Juridica({});
                UI.loadProvFormData({});

                setTimeout(async () => {
                    await UI.loadMasterData(masterData, 'persJuriForm', idNum);
                    UI.hasValue();
                }, 100);

            }

            return;
        }

        //ID ya registrado en proveedores_Master, en una tabla de tipo de persona (natural o juridica) y en proveedores_InfoFinanciera
        if (result.status === 'foundDetail') {
            isNewRegister = false;

            const formData = result.data;

            if (personType === 'natural') {
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block'
                certSection.style.display = 'none';

                if (formData.natural) {
                    await UI.loadFormData_Natural(formData.natural);
                }
            } else {
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block'
                certSection.style.display = 'block';

                if (formData.juridica) {
                    await UI.loadFormData_Juridica(formData.juridica);
                }
            }

            if (formData.finanInf) {
                await UI.loadProvFormData(formData.finanInf);
            }

            UI.hasValue();

            return;
        }

        alertErrorBody.innerText = 'No se pudo determinar el estado del proveedor.';
        alertError.show();

    } catch (error) {
        alertErrorBody.innerText = 'Error al consultar: ' + error.message;
        alertError.show();
        console.error('Error de Fetch:', error);
    }
});
uploadDocsBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    printFormatForm.style.display = 'none';
    
    uploadDocsForm.style.display = 'block';

    const personTypeSelect = document.getElementById('personType');
    const personType = personTypeSelect.value;
    const idNumInput = document.getElementById('idNum');
    const idNum = idNumInput.value.trim();

    try {
        const result = await API.getProvDocuments(idNum, personType);
        UI.loadDocsForm(result.data || [], result.isOEA || null);
    }
    catch (err) {
        console.error("Error cargando archivos guardados: ", err);
        UI.loadDocsForm([], null);
    }
});
printFormatBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    uploadDocsForm.style.display = 'none';

    const personTypeSelect = document.getElementById('personType');
    const personType = personTypeSelect.value;
    const idNumInput = document.getElementById('idNum');
    const idNum = idNumInput.value.trim();

    if (personType !== "juridica") {
        alertErrorBody.innerText = 'La impresión de formato solo está disponible para Personas Jurídicas.';
        alertError.show();
        return;
    } else {
        try {
            const result = await API.getFormat(idNum, personType);
            if (result && result.url) {
                UI.printFormatHandler(result.url);
            }
        }
        catch (err) {
            console.error("Error al obtener formato: ", err);

            alertErrorBody.innerText = err.message;
            alertError.show();
            UI.printFormatHandler(null);
        }
    }
});

//logica para mostrar/ocultar los forms al cambiar el tipo de persona
personTypeSelect.addEventListener('change', function () {

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    printFormatForm.style.display = 'none';
    uploadDocsForm.style.display = 'none';
    subNavConteiner.style.display = 'none';
    idNumInput.value = '';
    UI.hasValue();

});
idNumInput.addEventListener('input', function () {
    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    printFormatForm.style.display = 'none';
    uploadDocsForm.style.display = 'none';
    subNavConteiner.style.display = 'none';
});

//listener de envio de forms
submitPrvBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let dataProNJ = null;

    //valida y recopila la data
    if (personTypeSelect.value === 'natural') {
        if (!Validator.validateNaturalForm()) return;
        dataProNJ = Collector.collectFormData_Natural();
    } else if (personTypeSelect.value === 'juridica') {
        if (!Validator.validateJuridicaForm()) return;
        dataProNJ = Collector.collectFormData_Juridica();
    }
    if (!Validator.validateProvForm(personTypeSelect.value)) return;
    const provData = Collector.collectProvFormData(personTypeSelect.value);

    try {
        //Add o Update segun tipo de persona y su registro
        if (personTypeSelect.value === 'natural') {
            await API.sendData(dataProNJ, isNewRegister ? `/Admin/AddProviderNatural?typePerson=${personTypeSelect.value}` : `/Admin/UpdateProviderNatural?typePerson=${personTypeSelect.value}` );
            //Add o Update del provForm(Informacion Financiera)
            await API.sendData(provData, isNewRegister ? '/Admin/AddProvFinanceInfo' : '/Admin/UpdateProvFinanceInfo');

        } else if (personTypeSelect.value === 'juridica') {
            await API.sendData(dataProNJ, isNewRegister ? `/Admin/AddProviderJuridica?typePerson=${personTypeSelect.value}` : `/Admin/UpdateProviderJuridica?typePerson=${personTypeSelect.value}`);
            //Add o Update del provForm(Informacion Financiera)
            await API.sendData(provData, isNewRegister ? '/Admin/AddProvFinanceInfo' : '/Admin/UpdateProvFinanceInfo');

            printFormatBtn.disabled = false;
        }

        alertSuccesBody.innerText = 'Proveedor guardado completamente.';
        alertSuccess.show();

    } catch (err) {
        console.log('Error al guardar proveedor: ', +err);
        alertErrorBody.innerText = 'Error al guardar: ' + (err.message || err);
    }
});

//listener de envio de documentos
submitDocsBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const docsFieldIds = [
        'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado',
        'upComposicionAccionaria', 'upFotocopiaCC', 'upRefeComerciales',
        'upEstadoFinanciero', 'upCertificacionesVarias', 'upFUCPfirmado',
        'upOEAsi', 'upContingMeMagnetico', 'upContingFirmada',
        'upManifestacionSeguridad', 'upCertifiOEA', 'upAcuerdoSeguridad'
    ];

    docsFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dataset.panelVisited = 'true';
    })

    if (!Validator.validateDocsForm()) return;

    const docFormData = Collector.collectDocsForm(personTypeSelect.value);

    try {
        await API.sendFiles(docFormData, '/Admin/UploadDocuments');

        alertSuccesBody.innerText = 'Documentos cargados correctamente.';
        alertSuccess.show();
    }
    catch (err) {
        console.log('Error al cargar proveedores: ', +err);
        alertErrorBody.innerText = 'Error al cargar: ' + (err.message || err);
        alertError.show();
    }
});

initHandlers()