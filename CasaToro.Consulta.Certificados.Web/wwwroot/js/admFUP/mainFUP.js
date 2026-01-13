import * as API from './api-client.js';
import * as UI from './ui-handlers.js';
import * as Collector from './collector.js';
import * as Validator from './validators.js';
import * as UtilsPhone from './utils-phone.js';


const openFormsBtn = document.getElementById('openFormsBtn');
const uploadDocsBtn = document.getElementById('uploadDocsBtn');
const printFormatBtn = document.getElementById('printFormatBtn');

const consultForm = document.getElementById('consultForm');
const personTypeSelect = document.getElementById('personType');
const idNumInput = document.getElementById('idNum');

const consultBtn = document.getElementById('consultBtn');
const submitPrvBtn = document.getElementById('submitPrvBtn');

let isNewRegister = false;
let activeParagraph = null;
let activeDirecform = null;

//funcion de inicializacion de handlers
function initHandlers() {

    UI.firstBlock()

    //handlers de nacionalidad y tipo de documento para form persona natural y juridica
    $(pnTipoNacionalidad).off("change.pnTipoNac").on("change.pnTipoNac", async function () {
        UI.tipDocument();
        await UI.ubicPNaHandler(false);
    });
    $(pjRLTipNacionalidad).off("change.pjRLTipoDoc").on("change.pjRLTipoDoc", async function () {
        UI.pjTipDocument();
        await UI.ubicPJuHandler(false);
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

                const maxSucursales = 4;

                //oculta mensaje del limite si se elimino una sucursal y quedo menos del maximo
                if (sucursales.length < maxSucursales) {
                    UI.createAlert('');
                }
            }
        }
    });

    //handlers para agregar y eliminar filas de accionistas en form persona juridica
    const addControlRowBtn = document.getElementById('addControlRowBtn');
    const controlTableBody = document.querySelector('#control-table tbody');
    const alertContainer = document.getElementById('alertContainer');

    addControlRowBtn.addEventListener('click', UI.addControlRow);
    controlTableBody.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-control-row')) {
            if (controlTableBody.querySelectorAll('.control-row').length > 1) {
                e.target.closest('.control-row').remove();
                alertContainer.innerHTML = '';
            } else {
                UI.createAlert("Debe haber al menos una fila de control en la tabla de accionistas.", "warning");
            }
        }
    });

    //handlers para provForm
    const pvTipEmp = document.querySelectorAll('input[name="pvTipEmp"]');
    const pvPorExtranjero = document.getElementById('pvPorExtranjero');
    const pvGrCon = document.querySelectorAll('input[name="pvGrCon"]');
    const pvDeclIndCom = document.querySelectorAll('input[name="pvDeclIndCom"]');
    const pvAutRet = document.querySelectorAll('input[name="pvAutRet"]');
    const pvPosCuBan = document.querySelectorAll('input[name="pvPosCuBan"]');

    pvTipEmp.forEach(r => r.addEventListener('input', UI.togglePvTE));
    pvPorExtranjero.addEventListener('input', UI.togglePvPais);
    pvGrCon.forEach(r => r.addEventListener('change', UI.togglePvGC));
    pvDeclIndCom.forEach(r => r.addEventListener('change', UI.togglePvDIC));
    pvAutRet.forEach(r => r.addEventListener('change', UI.togglePvAR));
    pvPosCuBan.forEach(r => r.addEventListener('change', UI.togglePvCB));

    //carga datos de codigos CIIU y actividades economicas
    API.loadCIIUData();
    //sincroniza actividad economica -> codigo CIIU provForm
    $(pvAcEconomica).on('change', function () {
        const selectVal = $(this).val();
        if (selectVal && $(pvCodCIIU).val() !== selectVal) {
            $(pvCodCIIU).val(selectVal).trigger('change.select2');
        }
    });
    //sincroniza codigo CIIU -> actividad economica provForm
    $(pvCodCIIU).on('change', function () {
        const selectVal = $(this).val();
        if (selectVal && $(pvAcEconomica).val() !== selectVal) {
            $(pvAcEconomica).val(selectVal).trigger('change.select2');
        }
    });

    //formato de campos monetarios provForm
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
    UtilsPhone.initTelInputs(document.getElementById('pnTelefono'), false);
    UtilsPhone.initTelInputs(document.getElementById('pnCelular'), true);
    UtilsPhone.initTelInputs(document.getElementById('pjTelDirPrincipal'), true);

    //UI.handlePEPChange();
    const pnPEPYes = document.getElementById('pnPEPSi');
    const pnPEPNo = document.getElementById('pnPEPNo');

    if (pnPEPYes) pnPEPYes.addEventListener('change', UI.handlePEPChange);
    if (pnPEPNo) pnPEPNo.addEventListener('change', UI.handlePEPChange);

    //carga de datos de bancos
    API.loadBancosData();
}


//logica para mostrar/ocultar entre acciones de la sub nav
openFormsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    alertContainer.innerHTML = '';
    uploadDocsForm.style.display = 'none';


    consultForm.style.display = 'block';
});
uploadDocsBtn.addEventListener('click', function (e) {
    e.preventDefault();
    alertContainer.innerHTML = '';
    consultForm.style.display = 'none';
    if (consultForm.style.display = 'none') {
        persNatuForm.style.display = 'none';
        persJuriForm.style.display = 'none';
        provForm.style.display = 'none';
        personTypeSelect.value = '';
        idNumInput.value = null;
    }

    uploadDocsForm.style.display = 'block';
});
printFormatBtn.addEventListener('click', function (e) {
    e.preventDefault();
    alertContainer.innerHTML = '';
    consultForm.style.display = 'none';
    if (consultForm.style.display = 'none') {
        persNatuForm.style.display = 'none';
        persJuriForm.style.display = 'none';
        provForm.style.display = 'none';
        personTypeSelect.value = '';
        idNumInput.value = null;
    }
    uploadDocsForm.style.display = 'none';


});

//logica para mostrar/ocultar los forms al cambiar el tipo de persona
personTypeSelect.addEventListener('change', function () {

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    idNumInput.value = '';

    alertContainer.innerHTML = '';
});

//logica del subformulario de direccion (despliega subform, botones cancelar y guardar)
document.addEventListener('focusin', (e) => {
    if (e.target.matches('input[id^="pnDiResidencia"], input[id^="pjDirPrincipal"],input[id^="pjDirSucursal_"]')) {
        activeDirecform = e.target;
        document.getElementById('directionStructure').style.display = 'flex';
    }
});

//logica del subformulario de declaraciones y autorizaciones (despliega subform, botones cancelar y guardar)
declAutTrigger.addEventListener('click', () => {
    declAutorPanel.style.display = 'flex';
    activeParagraph = declAutTrigger;
});
cancelAutBtn.addEventListener('click', () => {
    declAutorPanel.style.display = 'none';
    activeParagraph = null;
});
saveAutBtn.addEventListener('click', () => {
    const pvDeAuRepresentacion = document.getElementById('pvDeAuRepresentacion').value.trim();
    const pvFuenteRecur = document.getElementById('pvFuenteRecur').value.trim();
    const pvTDPMotMaq = document.getElementById('input[name="pvTDPMotMaq"]');
    const pvTDPCasTor = document.getElementById('input[name="pvTDPCasTor"]');
    const pvTDPBonap = document.getElementById('input[name="pvTDPBonap"]');
    const pvTDPBellpi = document.getElementById('input[name="pvTDPBellpi"]');
    const pvRadAut = document.getElementById('input[name="pvRadAut"]');

    declAutorPanel.style.display = 'none';
    activeParagraph = null;
});


document.getElementById('cancelDirBtn').addEventListener('click', () => {
    document.getElementById('directionStructure').style.display = 'none';
    activeDirecform = null;
});
document.getElementById('saveDirBtn').addEventListener('click', () => {
    const tipoVia = document.getElementById('tipoVia').value.trim();
    const vPrincipal = document.getElementById('vPrincipal').value.trim();
    const sufPrincipal = document.getElementById('sufPrincipal').value.trim();
    const vSecundaria = document.getElementById('vSecundaria').value.trim();
    const sufSecundaria = document.getElementById('sufSecundaria').value.trim();
    const numPlaca = document.getElementById('numPlaca').value.trim();
    const compleDir = document.getElementById('compleDir').value.trim();

    if (!tipoVia || !vPrincipal || !vSecundaria || !numPlaca) {
        createAlert('Por favor complete los campos obligatorios de la dirección.', 'danger');
        return;
    }

    //construye la direccion
    let direcc = `${tipoVia} ${vPrincipal}${sufPrincipal ? sufPrincipal : ''}  # ${vSecundaria}${sufSecundaria ? sufSecundaria : ''} - ${numPlaca}`;
    if (compleDir) direcc += `, ${compleDir}`;

    //asigna la direccion al input
    if (activeDirecform) {
        activeDirecform.value = direcc;
    }

    //cierre
    document.getElementById('directionStructure').style.display = 'none';
    activeDirecform = null;
});



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

    const idNum = idNumInput.value.trim();
    const personType = personTypeSelect.value;
    alertContainer.innerHTML = '';

    const persNatuForm = document.getElementById('persNatuForm');
    const persJuriForm = document.getElementById('persJuriForm');
    const provForm = document.getElementById('provForm');

    if (!personType || !idNum) {
        UI.createAlert('Por favor, ingrese el Tipo de persona e ingrese el Numero de Identificación.', 'danger');
        return;
    }

    document.getElementById('persNatuForm').style.display = 'none';
    document.getElementById('persJuriForm').style.display = 'none';
    document.getElementById('provForm').style.display = 'none';

    const url = `/Admin/CheckProvider?idNum=${idNum}&personType=${personType}`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log('Respuesta del servidor:', result);

        if (!response.ok)
            throw new Error(result.message || 'Error desconocido en la respuesta del servidor.');

        //ID no encontrado (proveedor no registrado)
        if (result.status === 'notFound') {
            UI.createAlert(`Proveedor con ID: ${idNum} no encontrado. Verifique el ID o registre el nuevo proveedor.`, 'success');
            return;
        }

        //ID ya registrado con un tipo de persona diferente
        if (result.status === 'misMatch') {
            const registeredTypeText = result.registeredType === 'natural' ? 'Persona Natural' : 'Persona Juridica';
            UI.createAlert(`¡Advertencia! El proveedor con ID: ${idNum} ya esta registrado como ${registeredTypeText}. Para actualizarlo debe seleccionar "${registeredTypeText}" en el desplegable.`, 'warning');
            return;
        }

        //ID solo registrado en proveedores_Master
        if (result.status === 'foundMasterOnly') {
            UI.createAlert(`Proveedor con ID: ${idNum} encontrado en la base de datos basica. Complete y/o actualice la informacion.`, 'info');

            isNewRegister = true;

            const masterData = result.data;

            if (personType === 'natural') {
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block';

                //UI.loadFormData_Natural({});
                UI.loadProvFormData({});
                UI.loadMasterData(masterData, 'persNatuForm', idNum);
            } else {
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block'
                UI.loadFormData_Juridica({});
                UI.loadProvFormData({});
                UI.loadMasterData(masterData, 'persJuriForm', idNum);
            }

            await UI.ubicProvFormHandler();

            return;
        }

        //ID ya registrado en proveedores_Master, en una tabla de tipo de persona (natural o juridica) y en proveedores_FUCP
        if (result.status === 'foundDetail') {
            UI.createAlert(`Informacion del proveedor con ID: ${idNum} cargada con exito.`, 'success');

            const formData = result.data;

            if (personType === 'natural') {
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block'

                if (formData.natural) {
                    await UI.loadFormData_Natural(formData.natural);
                }

                UI.loadMasterData(null, 'persNatuForm', idNum);

            } else {
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block'

                if (formData.juridica) {
                    await UI.loadFormData_Juridica(formData.juridica);
                }

                UI.loadMasterData(null, 'persJuriForm', idNum);

            }

            await UI.ubicProvFormHandler();

            if (formData.fucp) {
                await UI.loadProvFormData(formData.fucp);
            }

            return;
        }

        UI.createAlert('No se pudo determinar el estado del proveedor.', 'danger');
    } catch (error) {
        UI.createAlert("Error al consultar: " + error.message, 'danger');
        console.error('Error de Fetch:', error);
    }
});

//listener de envio de forms
submitPrvBtn.addEventListener("click", submitPrvBtnHandler);
async function submitPrvBtnHandler(e) {
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
    if (!Validator.validateProvForm()) return;
    const provData = Collector.collectProvFormData();

    try {
        //Add o Update segun tipo de persona y su registro
        if (personTypeSelect.value === 'natural') {
            await API.sendData(dataProNJ, isNewRegister ? '/Admin/AddProviderNatural' : '/Admin/UpdateProviderNatural');
            //Add o Update del form proveedor general(FUCP)
            await API.sendData(provData, isNewRegister ? '/Admin/AddProviderFUCP' : '/Admin/UpdateProviderFUCP');

        } else if (personTypeSelect.value === 'juridica') {
            await API.sendData(dataProNJ, isNewRegister ? '/Admin/AddProviderJuridica' : '/Admin/UpdateProviderJuridica');
            //Add o Update del form proveedor general(FUCP)
            await API.sendData(provData, isNewRegister ? '/Admin/AddProviderFUCP' : '/Admin/UpdateProviderFUCP');
        }


        alert("Proveedor guardado completamente.");

    } catch (err) {
        console.log('Error al guardar proveedor: ', +err);
        alert("Error al guardar: " + (err.message || err));
    }
};

initHandlers()