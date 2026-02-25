import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as Collector from './collector.js';
import * as Validator from './validators.js';
import * as Fhelper from './form-helpers.js';
import { alertSuccesBody, alertErrorBody, alertBody, alertSuccess, alertError, alert } from './constant.js';

const openFormsBtn = document.getElementById('openFormsBtn');
const uploadDocsBtn = document.getElementById('uploadDocsBtn');
const printFormatBtn = document.getElementById('printFormatBtn');

const persNatuForm = document.getElementById('persNatuForm');
const persJuriForm = document.getElementById('persJuriForm');
const provForm = document.getElementById('provForm');
const certSection = document.getElementById('certSection');

const uploadDocsForm = document.getElementById('uploadDocsForm');
const printFormatForm = document.getElementById('printFormatForm');

const submitPrvBtn = document.getElementById('submitPrvBtn');


let isNewRegister = false;

function initFormHandlers() {
    UI.scrollButton();
    UI.firstBlock();
    Fhelper.initUploadDocs();
    Validator.dateLimits();
    UI.ubicPJuHandler();

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

    addControlRowBtn.addEventListener('click', UI.addControlRow);
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
    const pvTipEmp = document.querySelectorAll('input[name="pvTipEmp"]');
    const pvPorExtranjero = document.getElementById('pvPorExtranjero');
    const pvGrCon = document.querySelectorAll('input[name="pvGrCon"]');
    const pvDeclIndCom = document.querySelectorAll('input[name="pvDeclIndCom"]');
    const pvAutRet = document.querySelectorAll('input[name="pvAutRet"]');
    const pvPosCuBan = document.querySelectorAll('input[name="pvPosCuBan"]');
    const pvOpeCExt = document.querySelectorAll('input[name="pvOpeCExt"]');

    pvTipEmp.forEach(r => r.addEventListener('input', UI.togglePvTE));
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

    checkUser();
}

//logica para mostrar/ocultar entre acciones de la sub nav
openFormsBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    uploadDocsForm.style.display = 'none';
    printFormatForm.style.display = 'none';

    checkUser();
});
uploadDocsBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    printFormatForm.style.display = 'none';

    uploadDocsForm.style.display = 'block';

    try {
        const result = await API.getProvDocuments(null);
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

    const result = await API.getProvDataForms(null);
    console.log("Respuesta completa del servidor:", result);

    const typePerson = (result.typeperson || result.typePerson || "").toLowerCase().trim();
    console.log("Tipo de persona procesado:", typePerson);

    if (typePerson !== "juridica") {
        alertErrorBody.innerText = 'La impresión de formato solo está disponible para Personas Jurídicas.';
        alertError.show();
        return;
    } else {
        try {
            const result = await API.getFormat(null);
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

//listener de envio de forms
submitPrvBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let dataProNJ = null;

    const result = await API.getProvDataForms(null);
    console.log("Respuesta completa del servidor:", result);

    const typePerson = (result.typeperson || result.typePerson || "").toLowerCase().trim();
    console.log("Tipo de persona procesado:", typePerson);

    //valida y recopila la data
    if (typePerson === 'natural') {
        if (!Validator.validateNaturalForm()) return;
        dataProNJ = Collector.collectFormData_Natural();
    } else if (typePerson === 'juridica') {
        if (!Validator.validateJuridicaForm()) return;
        dataProNJ = Collector.collectFormData_Juridica();
    }
    if (!Validator.validateProvForm(typePerson)) return;
    const provData = Collector.collectProvFormData(typePerson);

    try {
        //Add o Update segun tipo de persona y su registro
        if (typePerson === 'natural') {
            await API.sendData(dataProNJ, isNewRegister ? `/Proveedor/AddProviderNatural?typePerson=${typePerson}` : `/Proveedor/UpdateProviderNatural?typePerson=${typePerson}`);
            //Add o Update del provForm(Informacion Financiera)
            await API.sendData(provData, isNewRegister ? '/Proveedor/AddProvFinanceInfo' : '/Proveedor/UpdateProvFinanceInfo');

        } else if (typePerson === 'juridica') {
            await API.sendData(dataProNJ, isNewRegister ? `/Proveedor/AddProviderJuridica?typePerson=${typePerson}` : `/Proveedor/UpdateProviderJuridica?typePerson=${typePerson}`);
            //Add o Update del provForm(Informacion Financiera)
            await API.sendData(provData, isNewRegister ? '/Proveedor/AddProvFinanceInfo' : '/Proveedor/UpdateProvFinanceInfo');
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

    if (!Validator.validateDocsForm()) return;

    const docFormData = Collector.collectDocsForm(null);

    try {
        await API.sendFiles(docFormData, '/Proveedor/UploadDocuments');

        alertSuccesBody.innerText = 'Documentos cargados correctamente.';
        alertSuccess.show();
    }
    catch (err) {
        console.log('Error al cargar proveedores: ', +err);
        alertErrorBody.innerText = 'Error al cargar: ' + (err.message || err);
        alertError.show();
    }
});

async function checkUser() {
    try {

        const result = await API.getProvDataForms(null);
        console.log("Respuesta completa del servidor:", result);

        const typePerson = (result.typeperson || result.typePerson || "").toLowerCase().trim();
        console.log("Tipo de persona procesado:", typePerson);

        //ID solo registrado en proveedores_Master
        if (result.status === 'foundMasterOnly') {
            isNewRegister = true;

            const masterData = result.data;
            const suggest = result.suggested;

            Fhelper.resetFormDA();

            if (typePerson === 'natural') {
                subNavConteiner.style.display = 'block';
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block';
                certSection.style.display = 'none';

                UI.loadFormData_Natural({});
                UI.loadProvFormData({});

                setTimeout(async () => {
                    await UI.loadMasterData(masterData, "persNatuForm", masterData.nit, suggest);
                    UI.hasValue()
                }, 100);

            } else if (typePerson === 'juridica') {
                subNavConteiner.style.display = 'block';
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block';
                certSection.style.display = 'block';

                UI.loadFormData_Juridica({});
                UI.loadProvFormData({});

                setTimeout(async () => {
                    await UI.loadMasterData(masterData, "persJuriForm", masterData.nit);
                    UI.hasValue()
                }, 100);

            } else {
                alertBody.innerHTML = 'Tipo de persona no ha sido seleccionado. \n Por favor registre que tipo de persona es en la pestaña "Editar Perfil"';
                alert.show();
            }

            await UI.ubicProvFormHandler();

            return;
        }

        //ID ya registrado en proveedores_Master, en una tabla de tipo de persona (natural o juridica) y en proveedores_InfoFinanciera
        if (result.status === 'foundDetail') {
            isNewRegister = false;

            const formData = result.data;

            if (typePerson === 'natural') {
                subNavConteiner.style.display = 'block';
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block';
                certSection.style.display = 'none';

                if (formData.natural) {
                    await UI.loadFormData_Natural(formData.natural);
                }
                printFormatBtn.disabled = true;
            } else {
                subNavConteiner.style.display = 'block';
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block';
                certSection.style.display = 'block';

                if (formData.juridica) {
                    await UI.loadFormData_Juridica(formData.juridica);
                }
            }

            await UI.ubicProvFormHandler();

            if (formData.finanInf) {
                await UI.loadProvFormData(formData.finanInf);
            }

            UI.hasValue();

            return;
        }

        alertErrorBody.innerHTML = 'No se pudo determinar el estado del proveedor.';
        alertError.show();
    }
    catch (error) {
        alertErrorBody.innerHTML = `Error al verificar el proveedor : ${error.message}`;
        alertError.show();
        console.error('Error al verificar el proveedor: ', error);
    }
}

initFormHandlers();