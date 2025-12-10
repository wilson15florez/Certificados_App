const personTypeSelect = document.getElementById('personType');
const idNumInput = document.getElementById('idNum');
const consultBtn = document.getElementById('consultBtn');
const alertContainer = document.getElementById('alertContainer');
const idSection = document.getElementById('idSection');
const persNatuForm = document.getElementById('persNatuForm');
const persJuriForm = document.getElementById('persJuriForm');
const provForm = document.getElementById('provForm');
const loaderContainer = document.getElementById('loader-container');
const submitPrvBtn = document.getElementById('submitPrvBtn');

//elementos del formulario de persona natural para PEP
const pnPEPYes = document.getElementById('pnPEPSi');
const pnPEPNo = document.getElementById('pnPEPNo');
const pnPEPtypeGroup = document.getElementById('pnPEPtypeGroup');
const pnPEP_Entidad_Cont = document.getElementById('pnPEP_Entidad_Container');
const pnPEP_Entidad = document.getElementById('pnPEP_Entidad');
const pnPEPChk = document.querySelectorAll('input[name="pnPEPType"]');

//elementos del formulario de persona juridica para sucursales
const addSucursalBtn = document.getElementById('addSucursalBtn');
const sucursalesContainer = document.getElementById('sucursales-container');
const sucursalLimitMsg = document.getElementById('sucursal_limit_msg');
const addControlRowBtn = document.getElementById('addControlRowBtn');
const controlTableBody = document.querySelector('#control-table tbody');

//elementos del formulario persona natural
const pnTipoNacionalidad = document.getElementById('pnTipoNacionalidad');
const pnTipoDoc = document.getElementById('pnTipoDoc');
const docNacionales = [
    { value: 'CC', text: 'CC' },
    { value: 'NIT', text: 'NIT' }
];
const docExtranjeros = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];
const inputNumId = document.getElementById('pnNumId');

const pnNacionalidad = document.getElementById('pnNacionalidad');
const pnEstadoNac = document.getElementById('pnEstadoNac');
const pnCiudadNac = document.getElementById('pnCiudadNac');
const pnDepExpDoc = document.getElementById('pnDepExpDoc');
const pnCiuExpDoc = document.getElementById('pnCiuExpDoc');
const pnDepRes = document.getElementById('pnDepRes');
const pnCiudadRes = document.getElementById('pnCiudadRes');

//elementos del formulario persona juridica
const pjDepartDirPrincipal = document.getElementById('pjDepartDirPrincipal');
const pjCiudadDirPrincipal = document.getElementById('pjCiudadDirPrincipal');

const pjRLDepExpDoc = document.getElementById('pjRLDepExpDoc');
const pjRLCiuExpDoc = document.getElementById('pjRLCiuExpDoc');
const pjRLNacionalidad = document.getElementById('pjRLNacionalidad');
const pjRLDepartNac = document.getElementById('pjRLDepartNac');
const pjRLCiudadNac = document.getElementById('pjRLCiudadNac');

const pjRLRadNac = document.getElementById('pjRLRadNac');
const pjRLRadExtr = document.getElementById('pjRLRadExtr');
const pjRadiosNacDoc = document.querySelectorAll('input[name="pjRLRadNac"]');
const pjRadiosExtDoc = document.querySelectorAll('input[name="pjRLRadExtr"]');
const pjInputNacNum = document.getElementById('pjRLNacNum');
const pjInputExtNum = document.getElementById('pjRLExtNum');
const pjRLSeccionNacional = document.getElementById('pjRLSeccionNacional');
const pjRLSeccionExtranjera = document.getElementById('pjRLSeccionExtranjera');

//elementos del formulario provForm
const pvIngrMens = document.getElementById('pvIngrMens');
const pvEgrMens = document.getElementById('pvEgrMens');
const pvActivos = document.getElementById('pvActivos');
const pvPasivos = document.getElementById('pvPasivos');
const pvPatrimonio = document.getElementById('pvPatrimonio');
const pvOtrIngr = document.getElementById('pvOtrIngr');

const pvPorNacional = document.getElementById('pvPorNacional');
const pvPorExtranjero = document.getElementById('pvPorExtranjero');
const pvPorPais = document.getElementById('pvPorPais');

const pvTipEmp = document.querySelectorAll('input[name="pvTipEmp"]');
const pvAcEconomica = document.getElementById('pvAcEconomica');
const pvCodCIIU = document.getElementById('pvCodCIIU');

const pvCapSocReg = document.getElementById('pvCapSocReg');
const pvFechConst = document.getElementById('pvFechConst');
const pvFechVen = document.getElementById('pvFechVen');

const pvGrCon = document.querySelectorAll('input[name="pvGrCon"]');
const pvFechResolGC = document.getElementById('pvFechResolGC');
const pvNumResolGC = document.getElementById('pvNumResolGC');

const pvDeclIndCom = document.querySelectorAll('input[name="pvDeclIndCom"]');
const pvDepartDec = document.getElementById('pvDepartDec');
const pvCiudadDec = document.getElementById('pvCiudadDec');

const pvAutRet = document.getElementById('input[name="pvAutRet"]');
const pvNumResDIAN = document.getElementById('pvNumResDIAN');

const pvForPag = document.getElementById('pvForPag');
const pvEntBenef = document.getElementById('pvEntBenef');

const pvPosCuBan = document.querySelectorAll('input[name="pvPosCuBan"]');
const pvEntidad = document.getElementById('pvEntidad');

const pvNumCueBanc = document.getElementById('pvNumCueBanc');
const pvClasCueBan = document.getElementById('pvClasCueBan');

//panel de declaraciones y autorizaciones
const pvDeAuRepresentacion = document.getElementById('pvDeAuRepresentacion');
const pvFuenteRecur = document.getElementById('pvFuenteRecur');

const pvTDPMotMaq = document.querySelectorAll('input[name="pvTDPMotMaq"]');
const pvTDPCasTor = document.querySelectorAll('input[name="pvTDPCasTor"]');
const pvTDPBonap = document.querySelectorAll('input[name="pvTDPBonap"]');
const pvTDPBellpi = document.querySelectorAll('input[name="pvTDPBellpi"]');
const pvRadAut = document.querySelectorAll('input[name="pvRadAut"]');

const declAutorPanel = document.getElementById('declAutorPanel');
const cancelAutBtn = document.getElementById('cancelAutBtn');
const saveAutBtn = document.getElementById('saveAutBtn');
const declAutTrigger = document.getElementById('declAutTrigger');

//JSON local Colombia
const colDMJSON = '/data/ubiNacional/ColombiaDepMun.json'

//URLs JSON externos de paises(Repositorio GitHub)
const url_COUNTRIES = '/data/ubiExterior/countries.json';
const url_STATES = '/data/ubiExterior/states.json';
const url_CITIES = '/data/ubiExterior/cities.json';

//elemento para validacion con parametros
const regexTelFijo = /^60[1-9]\d{7}$/;
const regexTelCelular = /^3\d{9}$/;
const regexEmail = /^[^\s@@]+@@[^\s@@]+\.[^\s@@]+$/;

let isNewRegister = false;
let originalPEPTypes = [];
let originalPEPEntidad = '';
let activeDirecform = null;
let activeParagraph = null;
let isAutoFilling = false;

function initHandlers() {
    $(pnTipoNacionalidad).off("change.pnTipoNac").on("change.pnTipoNac", async function () {
        tipDocument();
        await ubicPNaHandler(false);
    });

    console.log("Handlers de nacionalidad inicializados");
}

function waitForSelec2(select, timeout = 800) {
    return new Promise(r => {
        const start = performance.now();

        function check() {
            const hasOptions = select.options.length > 1;

            if (hasOptions || performance.now() - start > timeout) {
                return r();
            }
            requestAnimationFrame(check);
        }

        check();
    });
}

function fillSelect2(select, data, placeholder = 'Seleccione', valueField = 'id', textField = 'name') {
    const $select = $(select);

    //limpia opciones previas
    $select.empty();

    //agrega el placeholder
    $select.append(new Option(placeholder, '', false, false));

    //llena las opciones
    if (Array.isArray(data)) {
        data.forEach(item => {
            let value, text;

            if (typeof item === 'string') {
                value = text = item;
            } else {
                value = item[valueField] ?? item.Código ?? item.id ?? '';
                text = item[textField] ?? item.Nombre ?? item.name ?? '';
            }

            $select.append(new Option(text, value, false, false));
        });
    }

    //Si ya tiene Select2, NO reiniciar completamente
    if ($select.hasClass('select2-hidden-accessible')) {
        //reflesca UI sin resetear el valor
        $select.trigger('change.select2')
    } else {
        //inicializar solo la primera vez
        $select.select2({
            placeholder,
            allowClear: true,
            width: '100%',
            language: { noResults: () => "No se encontraron resultados" }
        });
    }
}

//funcion para setear valores con select2
async function setSelect2Val(select, value) {

    if (!value) return false;

    await waitForSelec2(select);

    const exists = [...select.options].some(o => o.value == value);

    if (!exists) {
        console.warn(`El valor no encontrado en el select2.`, { select, value });
        return false;
    }

    $(select).val(value).trigger('change.select2');
    return true;

}

//bloqueo inicial
pnNacionalidad.disabled = true;
pnEstadoNac.disabled = true;
pnCiudadNac.disabled = true;


idNumInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        consultBtn.click();
    }
});

//funcion que identifica tipo de nacionalidad en form persona natural
function tipDocument() {
    const tipoNac = pnTipoNacionalidad.value;

    pnTipoDoc.innerHTML = '<option value="" disabled selected>Seleccione un documento</option>';

    let listTipDoc = tipoNac === 'Nacional'
        ? docNacionales
        : tipoNac === 'Extranjero'
            ? docExtranjeros
            : [];

    listTipDoc.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.value;
        option.textContent = doc.text;
        pnTipoDoc.appendChild(option);
    });
}

//funcion que identifica tipo de nacionalidad en representante legal de form persona juridica
function pjSelecNacionalidad() {
    if (pjRLRadNac.checked) {
        pjRLSeccionNacional.style.display = 'block';
        pjRLSeccionExtranjera.style.display = 'none';
        clearRadios(pjRadiosExtDoc);
        pjInputExtNum.value = '';
        pjInputNacNum.required = true;
        pjInputExtNum.required = false;

    } else if (pjRLRadExtr.checked) {
        pjRLSeccionNacional.style.display = 'none';
        pjRLSeccionExtranjera.style.display = 'block';
        clearRadios(pjRadiosNacDoc);
        pjInputNacNum.value = '';
        pjInputExtNum.required = true;
        pjInputNacNum.required = false;

    } else {
        pjRLSeccionNacional.style.display = 'none';
        pjRLSeccionExtranjera.style.display = 'none';
        clearRadios(pjRadiosNacDoc);
        clearRadios(pjRadiosExtDoc);
    }
}
if (pjRLRadNac) pjRLRadNac.addEventListener('change', pjSelecNacionalidad);
if (pjRLRadExtr) pjRLRadExtr.addEventListener('change', pjSelecNacionalidad);
pjSelecNacionalidad();

//funcion para crear alertas
function createAlert(message, type = 'warning') {
    alertContainer.innerHTML = `
                    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                        ${message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
            `;
}

//Validacion de campos del form Persona natural
function validateNaturalForm() {
    const form = document.getElementById('persNatuForm');
    alertContainer.innerHTML = '';

    //verifica que sea nacional o extranjero
    if (!pnTipoNacionalidad.value) {
        createAlert('Por favor seleccione si es Nacional o Extranjero.', 'danger');
        pnTipoNacionalidad.focus();
        return false;
    }

    //verifica que tipo de documento este seleccionado
    if (!pnTipoDoc.value) {
        createAlert('Por favor seleccione el tipo de documento correspondiente.', 'danger');
        pnTipoDoc.focus();
        return false;
    }

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pnNombreCompl', 'pnFechaExpDoc', 'pnDepExpDoc', 'pnCiuExpDoc',
        'pnFechaNac', 'pnNacionalidad', 'pnEstadoNac', 'pnCiudadNac',
        'pnDiResidencia', 'pnDepRes', 'pnCiudadRes',
        'pnEmail', 'pnOficProfe', 'pnActividad'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? label.textContent.replace(':', '').trim() : id;
            createAlert(`El campo "${labelText}" es obligatorio.`, 'danger');
            el.focus();
            return false;
        }
    }


    //verifica telefono fijo o celular (al menos uno diligenciado)
    const tel = document.getElementById('pnTelefono').value.trim();
    const cel = document.getElementById('pnCelular').value.trim();

    if (!tel && !cel) {
        createAlert('Por favor ingrese al menos un número de teléfono fijo o celular.', 'danger');
        return false;
    }

    if (tel && !regexTelFijo.test(tel)) {
        createAlert('El número de teléfono fijo debe contener 10 dígitos y comenzar con el indicativo. (Ej: 601 para Bogotá)', 'danger');
        return false;
    }

    if (cel && !regexTelCelular.test(cel)) {
        createAlert('El número de celular debe contener 10 dígitos y comenzar con 3.', 'danger');
        return false;
    }

    // verifica email
    const email = document.getElementById('pnEmail').value.trim();

    if (email && !regexEmail.test(email)) {
        createAlert('Por favor ingrese un correo electrónico válido.', 'danger');
        return false;
    }

    //verificacion reconocimiento publico
    if (!form.querySelector('input[name="pnReconoPublic"]:checked')) {
        createAlert('Por favor seleccione si tiene reconocimiento publico.', 'danger');
        return false;
    }
    //verificacion manejo de recursos publico
    if (!form.querySelector('input[name="pnManRePub"]:checked')) {
        createAlert('Por favor seleccione si maneja recursos de origen publico.', 'danger');
        return false;
    }

    //verifica PEP y de ser si, valida el check y entidad
    const pepSi = document.getElementById('pnPEPSi').checked;
    const pepNo = document.getElementById('pnPEPNo').checked;

    if (!pepSi && !pepNo) {
        createAlert('Por favor seleccione si es PEP.', 'danger');
        return false;
    }

    if (pepSi) {
        const pepChecks = form.querySelectorAll('input[name="pnPEPType"]:checked');
        const penEntidad = document.getElementById('pnPEP_Entidad').value.trim();

        if (pepChecks.length === 0) {
            createAlert('Por favor seleccione al menos un tipo de PEP.', 'danger');
            return false;
        }
        if (!penEntidad) {
            createAlert('Por favor ingrese la entidad relacionada con el PEP.', 'danger');
            return false;
        }
    }

    return true;
}

//validacion de campos del form persona juridica
function validateJuridicaForm() {
    const form = document.getElementById('persJuriForm');
    alertContainer.innerHTML = '';

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pjRazSocial', 'pjDirPrincipal', 'pjDepartDirPrincipal', 'pjCiudadDirPrincipal',
        'pjEmailDirPrincipal', 'pjTelDirPrincipal'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? label.textContent.replace(':', '').trim() : id;
            createAlert(`El campo "${labelText}" es obligatorio.`, 'danger');
            el.focus();
            return false;
        }
    }

    //valida telefono principal (fijo o celular)
    const telPrincipal = document.getElementById('pjTelDirPrincipal').value.trim();
    if (!regexTelFijo.test(telPrincipal) && !regexTelCelular.test(telPrincipal)) {
        createAlert('El número de teléfono principal debe ser un número fijo válido (10 dígitos con indicativo) o un número celular válido (10 dígitos comenzando con 3).', 'danger');
        return false;
    }

    //validar email
    const emailPrincipal = document.getElementById('pjEmailDirPrincipal').value.trim();
    if (emailPrincipal && !regexEmail.test(emailPrincipal)) {
        createAlert('Por favor ingrese un correo electrónico válido para la dirección principal.', 'danger');
        return false;
    }

    //valida las sucursales
    const sucursales = document.querySelectorAll('#sucursales-container .sucursal-item');
    for (let i = 0; i < sucursales.length; i++) {
        const idx = i + 1;
        const dir = document.getElementById(`pjDirSucursal_${idx}`).value.trim();
        const dep = document.getElementById(`pjDepartDirSucursal_${idx}`).value.trim();
        const ciudad = document.getElementById(`pjCiudadDirSucursal_${idx}`).value.trim();
        const email = document.getElementById(`pjEmailDirSucursal_${idx}`).value.trim();
        const tel = document.getElementById(`pjTelDirSucursal_${idx}`).value.trim();

        if (!dir || !dep || !ciudad || !email || !tel) {
            createAlert(`Por favor complete todos los campos de la sucursal ${idx}.`, 'danger');
            return false;
        }

        if (!regexEmail.test(email)) {
            createAlert(`Por favor ingrese un correo electrónico válido para la sucursal ${idx}.`, 'danger');
            return false;
        }

        if (!regexTelFijo.test(tel) && !regexTelCelular.test(tel)) {
            createAlert(`El número de teléfono de la sucursal ${idx} debe ser un número fijo válido (10 dígitos con indicativo) o un número celular válido (10 dígitos comenzando con 3).`, 'danger');
            return false;
        }
    }

    //valida tabla de accionistas
    const controlRows = document.querySelectorAll('#control-table tbody .control-row');
    let totalPorc = 0;

    for (let i = 0; i < controlRows.length; i++) {
        const row = controlRows[i];
        const razSocial = row.querySelector('[name="controlRazonSocial[]"]').value.trim();
        const idType = row.querySelector('[name="controlIdType[]"]').value.trim();
        const idNum = row.querySelector('[name="controlIdNum[]"]').value.trim();
        const porcentaje = parseFloat(row.querySelector('[name="controlPorcentaje[]"]').value.trim() || 0);

        if (!razSocial || !idType || !idNum || isNaN(porcentaje) || porcentaje <= 0) {
            createAlert(`Por favor complete todos los campos de la fila ${i + 1} en la tabla de accionistas.`, 'danger');
            return false;
        }

        if (isNaN(porcentaje) || porcentaje < 5) {
            createAlert(`Porcentaje inválido en la fila ${i + 1}.`, 'danger');
            return false;
        }

        totalPorc += porcentaje;
    }

    if (totalPorc > 100) {
        createAlert(`La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), supera el 100%.
                    Por favor ajuste los valores antes de guardar.`, 'danger');
        return false;
    }

    //valida representante legal
    const pjRLNombre = document.getElementById('pjNomReLeg').value.trim();
    if (!pjRLNombre) {
        createAlert('Debe diligenciar el nombre del representante legal.', 'danger');
        return false;
    }

    const tipoNacionalidad = form.querySelector('input[name="pjRLTipNacionalidad"]:checked');
    if (!tipoNacionalidad) {
        createAlert('Seleccione si el representante legal es Nacional o Extranjero.', 'danger');
        return false;
    }

    const isNacional = tipoNacionalidad.value === 'Nacional';
    const isExtranjero = tipoNacionalidad.value === 'Extranjero';

    //tipo y numero
    let docNum = null;
    if (isNacional) {
        if (!pjRadiosNacDoc) {
            createAlert('Seleccione el tipo de documento del representante legal.', 'danger');
            return false;
        }
        docNum = pjInputNacNum.value.trim();
        if (!docNum) {
            createAlert('Ingrese el numero de documento del representante legal.', 'danger');
            return false;
        }
    }
    if (isExtranjero) {
        if (!pjRadiosExtDoc) {
            createAlert('Seleccione el tipo de documento del representante legal extranjero.', 'danger');
            return false;
        }
        docNum = pjInputExtNum.value.trim();
        if (!docNum) {
            createAlert('Ingrese el número de documento del representante legal extranjero.', 'danger');
            return false;
        }
    }

    //fechas
    const fechExp = document.getElementById('pjRLFechExpDoc').value.trim();
    const fechNac = document.getElementById('pjRLFechaNac').value.trim();
    if (!fechExp) {
        createAlert('Ingrese la fecha de expedicion del documento de identidad del representante legal.', 'danger');
        return false;
    }
    if (!fechNac) {
        createAlert('Ingrese la fecha de nacimiento del representante legal.', 'danger');
        return false;
    }

    //lugar de expedicion
    const depExp = document.getElementById('pjRLDepExpDoc').value.trim();
    const ciuExp = document.getElementById('pjRLCiuExpDoc').value.trim();
    if (!depExp || !ciuExp) {
        createAlert('Seleccione el departamento y ciudad de expedicion del documento de representante legal.', 'danger');
        return false;
    }

    //nacionalidad y nacimiento
    const paisNac = document.getElementById('pjRLNacionalidad').value.trim();
    const depNac = document.getElementById('pjRLDepartNac').value.trim();
    const ciuNac = document.getElementById('pjRLCiudadNac').value.trim();
    if (!paisNac) {
        createAlert('Seleccione el pais del representante legal', 'danger');
        return false;
    }
    if (!depNac || !ciuNac) {
        createAlert('Seleccione el departamento y ciudad de nacimiento del representante legal.', 'danger');
        return false;
    }

    return true;

}

//validacion de campos del form formato unico
function validateProvForm() {
    console.log(">>> validateProvForm START");

    const form = document.getElementById('provForm');
    alertContainer.innerHTML = '';

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos',
        'pvPatrimonio', 'pvOtrIngr', 'pvPorNacional', 'pvPorExtranjero',
        'pvPorPais', 'pvAcEconomica', 'pvCodCIIU', 'pvCapSocReg', 'pvFechConst',
        'pvFechVen', 'pvFechResolGC', 'pvNumResolGC', 'pvDepartDec', 'pvCiudadDec',
        'pvNumResDIAN', 'pvForPag', 'pvEntBenef', 'pvEntidad', 'pvNumCueBanc',
        'pvClasCueBan', 'pvDeAuRepresentacion', 'pvFuenteRecur'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? label.textContent.replace(':', '').trim() : id;
            createAlert(`El campo "${labelText}" es obligatorio.`, 'danger');
            el.focus();
            return false;
        }
    }

    //verifica tipo de empresa
    if (!form.querySelector('input[name="pvTipEmp"]:checked')) {
        createAlert('Por favor seleccione el tipo de empresa.', 'danger');
        return false;
    }

    //verifica gran contribuyente
    if (!form.querySelector('input[name="pvGrCon"]:checked')) {
        createAlert('Por favor seleccione si es gran contribuyente.', 'danger');
        return false;
    }

    //verifica declaracion de industria y comercio
    if (!form.querySelector('input[name="pvDeclIndCom"]:checked')) {
        createAlert('Por favor seleccione si declara impuesto de industria y comercio.', 'danger');
        return false;
    }

    //verifica auto retenedor
    if (!form.querySelector('input[name="pvAutRet"]:checked')) {
        createAlert('Por favor seleccione si es auto retenedor.', 'danger');
        return false;
    }

    //verifica posecion cuenta bancaria
    if (!form.querySelector('input[name="pvPosCuBan"]:checked')) {
        createAlert('Por favor seleccione si posee cuenta bancaria.', 'danger');
        return false;
    }

    //verifica autorizaciones
    if (!pvTDPMotMaq) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para MOTORYSA S.A.', 'danger');
        return false;
    }

    if (!pvTDPCasTor) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para CASATORO S.A.', 'danger');
        return false;
    }

    if (!pvTDPBonap) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para BONAPARTE S.A.S.', 'danger');
        return false;
    }

    if (!pvTDPBellpi) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para BELLPI S.A.S.', 'danger');
        return false;
    }

    if (!pvRadAut) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos.', 'danger');
        return false;
    }

    console.log(">>> validateProvForm PASÓ TODAS LAS VALIDACIONES");

    return true;
}

//funcion para cargar departamentos y municipios colombianos
async function loadUbiNac() {
    const res = await fetch(colDMJSON);
    const data = await res.json();

    const departamentos = [...new Set(data.map(d => (d["Nombre"] || "").trim().toUpperCase()))];
    const ciudadByDep = {};

    data.forEach(item => {
        const depto = (item["Nombre"] || "").trim().toUpperCase();
        const ciud = (item[" Nombre "] || item["Nombre"] || '').trim();

        if (!ciudadByDep[depto]) ciudadByDep[depto] = [];

        if (ciud) ciudadByDep[depto].push(ciud);
    });
    return { departamentos, ciudadByDep };
}

//funcion para cargar paises
async function loadUbiExt() {
    const res = await fetch(url_COUNTRIES);
    const data = await res.json();
    const countries = data.countries || [];
    return countries.filter(c => c.name.toLowerCase() !== "colombia");
}

//funcion para cargar los estados segun el pais
async function loadStates(countryId) {
    const res = await fetch(url_STATES);
    const data = await res.json();
    return (data.states || []).filter(s => s.id_country == countryId);
}

//funcion para cargar ciudades segun el estado
async function loadCities(stateId) {
    const res = await fetch(url_CITIES);
    const data = await res.json();
    return (data.cities || []).filter(c => c.id_state == stateId);
}

//funcion que gestiona los select de ubicacion de persona natural
async function ubicPNaHandler() {

    const nac = pnTipoNacionalidad.value;

    //si es autorellenado no limpia ni deshabilita
    if (!isAutoFilling) {
        [pnNacionalidad, pnEstadoNac, pnCiudadNac, pnDepExpDoc, pnCiuExpDoc, pnDepRes, pnCiudadRes].forEach(sel => {
            $(sel).empty().prop("disabled", true);
        });
    }

    if (nac === 'Nacional') {
        //pais fijo colombia
        fillSelect2(pnNacionalidad, [{ id: 'CO', name: 'COLOMBIA' }]);

        $(pnNacionalidad).val('CO').trigger('change.select2');
        pnNacionalidad.disabled = true;

        //carga departamentos/ciudades de colombia
        const { departamentos, ciudadByDep } = await loadUbiNac();

        //departamentos de nacimiento, expedicion y residencia
        [pnEstadoNac, pnDepExpDoc, pnDepRes].forEach(depSelect => {
            fillSelect2(depSelect, departamentos);
            depSelect.disabled = false;
        });

        const handleDeptChange = (depSelect, citySelect) => {
            $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
                const dep = this.value.trim().toUpperCase();
                const municipios = ciudadByDep[dep] || [];
                fillSelect2(citySelect, municipios);
                citySelect.disabled = municipios.length === 0;
            });
        };

        handleDeptChange(pnEstadoNac, pnCiudadNac);
        handleDeptChange(pnDepExpDoc, pnCiuExpDoc);
        handleDeptChange(pnDepRes, pnCiudadRes);

    }
    else if (nac === 'Extranjero') {

        //carga paises
        const countries = await loadUbiExt();

        fillSelect2(pnNacionalidad, countries, 'Seleccione país', 'id', 'name');
        pnNacionalidad.disabled = false;

        //Departamentos y ciudades colombianas para expedicion y residencia
        const { departamentos, ciudadByDep } = await loadUbiNac();

        [pnDepExpDoc, pnDepRes].forEach(depSelect => {
            fillSelect2(depSelect, departamentos);
            depSelect.disabled = false;
        });

        const handleDeptChange = (depSelect, citySelect) => {
            $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
                const dep = this.value.trim().toUpperCase();
                const municipios = ciudadByDep[dep] || [];
                fillSelect2(citySelect, municipios);
                citySelect.disabled = municipios.length === 0;
            });
        };

        handleDeptChange(pnDepExpDoc, pnCiuExpDoc);
        handleDeptChange(pnDepRes, pnCiudadRes);

        //Estados y ciudades para país seleccionado
        $(pnNacionalidad).off('change.ubiExtrPais').on('change.ubiExtrPais', async function () {
            const countryId = this.value;

            //estados
            const states = await loadStates(countryId);
            fillSelect2(pnEstadoNac, states, 'Seleccione estado', 'id', 'name');
            pnEstadoNac.disabled = false;

            //ciudades
            $(pnEstadoNac).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
                const stateId = this.value;
                const cities = await loadCities(stateId);
                fillSelect2(pnCiudadNac, cities, 'Seleccione ciudad', 'id', 'name');
                pnCiudadNac.disabled = false;
            });
        });
    }
}

//funcion que gestiona los select de ubicacion replesentante legal
async function handleRepLeg() {
    //limpiar selects
    [pjRLNacionalidad, pjRLDepartNac, pjRLCiudadNac, pjRLDepExpDoc, pjRLCiuExpDoc].forEach(sel => {
        $(sel).empty().prop('disabled', true);
    });

    const { departamentos, ciudadByDep } = await loadUbiNac();

    if (pjRLRadNac.checked) {

        fillSelect2(pjRLNacionalidad, [{ id: 'CO', name: 'COLOMBIA' }], 'Seleccione país');
        $(pjRLNacionalidad).val('CO').trigger('change.select2');
        $(pjRLNacionalidad).prop('disabled', true);

        fillSelect2(pjRLDepartNac, departamentos, 'Seleccione departamento');
        fillSelect2(pjRLDepExpDoc, departamentos, 'Seleccione departamento');
        $(pjRLDepartNac).prop('disabled', false);
        $(pjRLDepExpDoc).prop('disabled', false);

        const handleDeptChange = (depSelect, citySelect) => {
            $(depSelect).off('change.rep').on('change.rep', function () {
                const dep = ($(this).val() || '').trim().toUpperCase();
                const municipios = ciudadByDep[dep] || [];
                fillSelect2(citySelect, municipios, 'Seleccione ciudad');
                $(citySelect).prop('disabled', municipios.length === 0);
            });
        };

        handleDeptChange(pjRLDepartNac, pjRLCiudadNac);
        handleDeptChange(pjRLDepExpDoc, pjRLCiuExpDoc);
    }
    else if (pjRLRadExtr.checked) {
        const countries = await loadUbiExt();
        fillSelect2(pjRLNacionalidad, countries, 'Seleccione país');
        $(pjRLNacionalidad).prop('disabled', false);

        fillSelect2(pjRLDepExpDoc, departamentos, 'Seleccione departamento');
        $(pjRLDepExpDoc).prop('disabled', false);

        $(pjRLDepExpDoc).off('change.rep').on('change.rep', function () {
            const dep = ($(this).val() || '').trim().toUpperCase();
            const municipios = ciudadByDep[dep] || [];
            fillSelect2(pjRLCiuExpDoc, municipios, 'Seleccione ciudad');
            $(pjRLCiuExpDoc).prop('disabled', municipios.length === 0);
        });

        $(pjRLNacionalidad).off('change.rep').on('change.rep', async function () {
            const countryId = $(this).val();
            if (!countryId) {
                fillSelect2(pjRLDepartNac, [], 'Seleccione estado');
                fillSelect2(pjRLCiudadNac, [], 'Seleccione ciudad');
                $(pjRLDepartNac).prop('disabled', true);
                $(pjRLCiudadNac).prop('disabled', true);
                return;
            }

            const states = await loadStates(countryId);
            fillSelect2(pjRLDepartNac, states, 'Seleccione estado');
            $(pjRLDepartNac).prop('disabled', false);

            $(pjRLDepartNac).off('change.rep2').on('change.rep2', async function () {
                const cities = await loadCities($(this).val());
                fillSelect2(pjRLCiudadNac, cities, 'Seleccione ciudad');
                $(pjRLCiudadNac).prop('disabled', false);
            });
        });
    }
}

//funcion que gestiona los select de ubicacion de persona juridica
async function ubicPJuHandler() {

    const { departamentos, ciudadByDep } = await loadUbiNac();

    //direccion principal
    fillSelect2(pjDepartDirPrincipal, departamentos, 'Seleccione departamento');
    $(pjDepartDirPrincipal).prop('disabled', false);

    $(pjDepartDirPrincipal).off('change.ubiPJ').on('change.ubiPJ', function () {
        const dep = ($(this).val() || '').trim().toUpperCase();
        const municipios = ciudadByDep[dep] || [];
        fillSelect2(pjCiudadDirPrincipal, municipios, 'Seleccione ciudad');
        $(pjCiudadDirPrincipal).prop('disabled', municipios.length === 0);
    });

    //funcion para crear select dinamico en sucursales
    window.initSucursalUbic = function (index) {
        const depSelect = document.getElementById(`pjDepartDirSucursal_${index}`);
        const citySelect = document.getElementById(`pjCiudadDirSucursal_${index}`);
        if (!depSelect || !citySelect) return;

        fillSelect2(depSelect, departamentos, 'Seleccione departamento');
        $(depSelect).prop('disabled', false);

        $(depSelect).off('change.ubiSUC').on('change.ubiSUC', function () {
            const dep = ($(this).val() || '').trim().toUpperCase();
            const municipios = ciudadByDep[dep] || [];
            fillSelect2(citySelect, municipios, 'Seleccione ciudad');
            $(citySelect).prop('disabled', municipios.length === 0);
        });
    };

    //representante legal
    pjRLRadNac.addEventListener('change', handleRepLeg);
    pjRLRadExtr.addEventListener('change', handleRepLeg);
    handleRepLeg();

    initSucursalUbic(1);
}

//funcion que gestiona los select de ubicacion del provForm
async function ubicProvFormHandler() {

    //si es autorellenado no limpia
    if (!isAutoFilling) {
        [pvPorPais, pvDepartDec, pvCiudadDec].forEach(sel => {
            $(sel).empty().prop("disabled", true);
        });
    }

    //carga pais extranjero de porcentaje origen de capital
    const countries = await loadUbiExt();
    fillSelect2(pvPorPais, countries, 'Seleccione país', 'id', 'name');
    pvPorPais.disabled = false;

    //carga departamento y ciudad de declaracion
    const { departamentos, ciudadByDep } = await loadUbiNac();

    fillSelect2(pvDepartDec, departamentos, 'Seleccione departamento');
    pvDepartDec.disabled = false;

    $(pvDepartDec).off('change.ubiNac').on('change.ubiNac', function () {
        const selectedDep = this.value.trim().toUpperCase();
        const municipios = ciudadByDep[selectedDep] || [];

        fillSelect2(pvCiudadDec, municipios, 'Seleccione ciudad');
        pvCiudadDec.disabled = municipios.length === 0;
    });

    if (isAutoFilling && pvDepartDec.value) {
        $(pvDepartDec).trigger('change.ubiNac');
    }

    console.log("ubicProvFormHandler ejecutado");

}

// Estado inicial: nada seleccionado
fillSelect2(pnNacionalidad, [], 'Seleccione país');
[pnEstadoNac, pnCiudadNac, pnDepExpDoc, pnCiuExpDoc, pnDepRes, pnCiudadRes].forEach(sel => {
    $(sel).empty().append(new Option('Seleccione', '', true, false)).prop('disabled', true);
});

//funcion para precargar los datos del formulario persona natural
async function loadFormData_Natural(data) {
    //bloquea los eventos de cambio para evitar conflictos durante el auto llenado
    isAutoFilling = true;

    const form = document.getElementById('persNatuForm');

    //limpieza inicial
    form.querySelectorAll('input,select, textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
    });

    if (!data) {
        isAutoFilling = false;
        return;
    }

    //tipo nacionalidad
    if (data.pnTipoNacionalidad) {
        pnTipoNacionalidad.value = data.pnTipoNacionalidad;

        //tipo de documento segun nacionalidad
        tipDocument();

        if (data.pnTipoDoc) {
            pnTipoDoc.value = data.pnTipoDoc;
        }
    }

    //iniciar ubicaciones (prepara los contenedores)
    await ubicPNaHandler();

    await waitForSelec2(pnEstadoNac);
    await waitForSelec2(pnDepExpDoc);
    await waitForSelec2(pnDepRes);

    //mapea nit al campo de identificacion
    if (data.Nit) inputNumId.value = data.Nit;


    //ubicaciones

    //nacimiento
    if (data.pnNacionalidad) {
        await setSelect2Val(pnNacionalidad, data.pnNacionalidad);

        if (data.pnTipoNacionalidad === 'Nacional') {
            $(pnNacionalidad).trigger("change.ubiNac");
        } else {
            $(pnNacionalidad).trigger("change.ubiExtrPais");
        }

        await waitForSelec2(pnEstadoNac);
    }

    if (data.pnEstadoNac) {
        await setSelect2Val(pnEstadoNac, data.pnEstadoNac);

        if (data.pnTipoNacionalidad === 'Nacional') {
            $(pnEstadoNac).trigger("change.ubiNac");
        } else {
            $(pnEstadoNac).trigger("change.ubiExtrEstado");
        }

        await waitForSelec2(pnCiudadNac);
    }

    if (data.pnCiudadNac) {
        await setSelect2Val(pnCiudadNac, data.pnCiudadNac);
    }

    //expedicion
    if (data.pnDepExpDoc) {
        await setSelect2Val(pnDepExpDoc, data.pnDepExpDoc);
        $(pnDepExpDoc).trigger("change.ubiNac");
        await waitForSelec2(pnCiuExpDoc);
    }
    if (data.pnCiuExpDoc) {
        await setSelect2Val(pnCiuExpDoc, data.pnCiuExpDoc);
    }

    //residencia
    if (data.pnDepRes) {
        await setSelect2Val(pnDepRes, data.pnDepRes);
        $(pnDepRes).trigger("change.ubiNac");
        await waitForSelec2(pnCiudadRes);
    }
    if (data.pnCiudadRes) {
        await setSelect2Val(pnCiudadRes, data.pnCiudadRes);
    }

    //asigna los campos simples excepto los que requieren logica especial
    const skipCampos = [
        'pnTipoNacionalidad', 'pnTipoDoc', 'pnNacionalidad',
        'pnEstadoNac', 'pnCiudadNac', 'pnDepExpDoc',
        'pnCiuExpDoc', 'pnDepRes', 'pnCiudadRes', 'Nit'
    ];

    for (const key in data) {
        if (!skipCampos.includes(key)) {
            const el = document.getElementById(key);
            if (el && data[key] != null) el.value = data[key];
        }
    }

    //radios, PEP y checkboxes
    if (data.pnReconoPublic) {
        const r = form.querySelector(`input[name="pnReconoPublic"][value="${data.pnReconoPublic}"]`);
        if (r) r.checked = true;
    }
    if (data.pnManRePub) {
        const r = form.querySelector(`input[name="pnManRePub"][value="${data.pnManRePub}"]`);
        if (r) r.checked = true;
    }

    if (data.pnPEP === 'Si') document.getElementById('pnPEPSi').checked = true;
    if (data.pnPEP === 'No') document.getElementById('pnPEPNo').checked = true;

    if (Array.isArray(data.PEPTypes)) {
        data.PEPTypes.forEach(v => {
            const chk = form.querySelector(`input[name="pnPEPType"][value="${v}"]`);
            if (chk) chk.checked = true;
        });
    }

    originalPEPTypes = Array.isArray(data.PEPTypes) ? [...data.PEPTypes] : [];
    originalPEPEntidad = data.pnPEP_Entidad || '';

    const entidadInput = document.getElementById('pnPEP_Entidad');
    if (entidadInput) entidadInput.value = data.pnPEP_Entidad || '';

    handlePEPChange();

    isAutoFilling = false;
}

//funcion para precargar los datos del formulario persona juridica
async function loadFormData_Juridica(data) {
    const form = document.getElementById('persJuriForm');

    //limpieza
    form.querySelectorAll('input,select, textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
    });

    if (!data) return;

    const pjNitInput = document.getElementById('pjNIT');
    if (pjNitInput) {
        pjNitInput.value = data.Nit || data.pjNIT || '';
        pjNitInput.setAttribute('disabled', 'disabled');
    }

    //carga generica
    for (const key in data) {
        if (!data.hasOwnProperty(key) || data[key] === null || data[key] === undefined) continue;
        if (key.startsWith('pjDepart') || key.startsWith('pjCiudad') || key.startsWith('pjRL')) continue;

        const el = document.getElementById(key);
        if (el) el.value = data[key];
    }

    //helper local para select2
    const setSelect = (id, val) => {
        if (!val) return;
        $(`#${id}`).val(String(val).trim()).trigger('change.select2');
    };

    await ubicPJuHandler();
    const { ciudadByDep } = await loadUbiNac();

    //precarga ubicacion direccion oficina principal
    if (data.pjDepartDirPrincipal) {
        setSelect('pjDepartDirPrincipal', data.pjDepartDirPrincipal);
        const cities = ciudadByDep[data.pjDepartDirPrincipal.trim().toUpperCase()] || [];
        fillSelect2('#pjCiudadDirPrincipal', cities, '-- Seleccione ciudad --');
        if (data.pjCiudadDirPrincipal) setSelect('pjCiudadDirPrincipal', data.pjCiudadDirPrincipal);
    }

    //precarga las sucursales
    const addSucursalBtn = document.getElementById('addSucursalBtn');
    if (data.Sucursales && Array.isArray(data.Sucursales) && data.Sucursales.length > 0) {
        //limpia las sucursales existentes exepto la primera
        document.querySelectorAll('.sucursal-item:not(#sucursal_1)').forEach(item => item.remove());

        data.Sucursales.forEach((suc, index) => {
            const i = index + 1;
            if (i > 1) {
                addSucursalBtn.click();
            }

            //llenar campos de texto
            document.getElementById(`pjDirSucursal_${i}`).value = suc.pjSucursalDir || '';
            document.getElementById(`pjEmailDirSucursal_${i}`).value = suc.pjSucursalEmail || '';
            document.getElementById(`pjTelDirSucursal_${i}`).value = suc.pjSucursalTel || '';

            //inicializa ubicacion para sucursal dinamica
            if (typeof initSucursalUbic === 'function') {
                initSucursalUbic(i);
            }

            //llena departamento y dispara el cambio para cargar ciudades
            if (suc.pjSucursalDepart) {
                setSelect(`pjDepartDirSucursal_${i}`, suc.pjSucursalDepart);
                const cities = ciudadByDep[suc.pjSucursalDepart.trim().toUpperCase()] || [];
                fillSelect2(`#pjCiudadDirSucursal_${i}`, cities, '-- Seleccione ciudad --');
                if (suc.pjSucursalCiudad) setSelect(`pjCiudadDirSucursal_${i}`, suc.pjSucursalCiudad);
            }
        });
    }

    //tabla de accionistas
    while (controlTableBody.querySelectorAll('.control-row').length > 1) {
        controlTableBody.lastElementChild.remove();
    }

    if (data.ControlRow && Array.isArray(data.ControlRow) && data.ControlRow.length > 0) {
        controlTableBody.innerHTML = '';

        data.ControlRow.forEach((row) => {
            addControlRow();
            const currentRow = controlTableBody.lastElementChild;

            currentRow.querySelector('[name="controlRazonSocial[]"]').value = row.razonSocial || '';
            currentRow.querySelector('[name="controlIdType[]"]').value = row.idType || 'CC';
            currentRow.querySelector('[name="controlIdNum[]"]').value = row.idNum || '';
            currentRow.querySelector('[name="controlPorcentaje[]"]').value = row.porcentaje || '';
        });
    } else {
        controlTableBody.innerHTML = '';
        addControlRow();
    }

    //representante legal
    if (data.pjRLTipNacionalidad) {
        const isNacional = data.pjRLTipNacionalidad === 'Nacional';
        document.getElementById(isNacional ? 'pjRLRadNac' : 'pjRLRadExtr').checked = true;

        pjSelecNacionalidad();
        //llena los select base (paises o dep colombia)
        await handleRepLeg();

        //mapeo de documentos y numeros
        const tipoDoc = isNacional
            ? (data.pjRLNacDoc || data.pjRLRadNac)
            : (data.pjRLExtDoc || data.pjRLRadExtr);

        const docNum = data.pjRLDocNum || data.pjRLNacNum || data.pjRLExtNum;

        if (isNacional) {
            if (tipoDoc) {
                $(`input[name="pjRLRadNac"][value="${tipoDoc}"]`).prop('checked', true);
            }
            if (docNum) document.getElementById('pjRLNacNum').value = docNum;

        } else {
            if (tipoDoc) {
                $(`input[name="pjRLRadExtr"][value="${tipoDoc}"]`).prop('checked', true);
            }
            if (docNum) document.getElementById('pjRLExtNum').value = docNum;
        }

        //llena fechas
        if (data.pjRLFechExpDoc) document.getElementById('pjRLFechExpDoc').value = data.pjRLFechExpDoc;
        if (data.pjRLFechaNac) document.getElementById('pjRLFechaNac').value = data.pjRLFechaNac;

        //mapeo ubicacion
        //expedicion
        if (data.pjRLDepExpDoc) {
            setSelect('pjRLDepExpDoc', data.pjRLDepExpDoc);
            const cities = ciudadByDep[data.pjRLDepExpDoc.trim().toUpperCase()] || [];
            fillSelect2('#pjRLCiuExpDoc', cities, '-- Seleccione ciudad --');
            if (data.pjRLCiuExpDoc) setSelect('pjRLCiuExpDoc', data.pjRLCiuExpDoc);
        }

        //nacimiento
        if (isNacional) {
            //nacional
            if (data.pjRLDepartNac) {
                setSelect('pjRLDepartNac', data.pjRLDepartNac);
                const cities = ciudadByDep[data.pjRLDepartNac.trim().toUpperCase()] || [];
                fillSelect2('#pjRLCiudadNac', cities, '-- Seleccione ciudad --');
                if (data.pjRLCiudadNac) setSelect('pjRLCiudadNac', data.pjRLCiudadNac);
            }
        } else {
            //extranjero
            if (data.pjRLNacionalidad) {
                setSelect('pjRLNacionalidad', data.pjRLNacionalidad);
                if (data.pjRLDepartNac) {
                    const states = await loadStates(data.pjRLNacionalidad);
                    fillSelect2('#pjRLDepartNac', states, '-- Seleccione estado --', 'id', 'name');
                    setSelect('pjRLDepartNac', data.pjRLDepartNac);
                    if (data.pjRLCiudadNac) {
                        const cities = await loadCities(data.pjRLDepartNac);
                        fillSelect2('#pjRLCiudadNac', cities, '-- Seleccione ciudad --', 'id', 'name');
                        setSelect('pjRLCiudadNac', data.pjRLCiudadNac);
                    }
                }
            }
        }
    }
}

//funcion para precargar datos en el formulario de proveedor general (provForm)
async function loadProvFormData(data) {

    isAutoFilling = true;

    const form = document.getElementById('provForm');

    //limpieza inicial
    form.querySelectorAll('input,select, textarea').forEach(el => {
        if (el.type === 'radio') el.checked = false;
        else el.value = '';
    });

    if (!data) {
        isAutoFilling = false;
        return;
    }

    //permite que se cargue selects de ubicacion
    await ubicProvFormHandler();

    await waitForSelec2(pvDepartDec);
    await waitForSelec2(pvCiudadDec);

    //ubicacion pais
    if (data.pvPorPais) {
        await setSelect2Val(pvPorPais, data.pvPorPais);
    }

    //ubicaciones departamento y ciudad de declaracion
    if (data.pvDepartDec) {
        await setSelect2Val(pvDepartDec, data.pvDepartDec);
        $(pvDepartDec).trigger("change.ubiNac");
        await waitForSelec2(pvCiudadDec);
    }
    if (data.pvCiudadDec) {
        await setSelect2Val(pvCiudadDec, data.pvCiudadDec);
    }

    //asigna los campos simples excepto los que rquieren logica especial
    const skipCampos = [
        'pvPorPais', 'pvDepartDec', 'pvCiudadDec'
    ];

    for (const key in data) {
        if (!skipCampos.includes(key)) {
            const el = document.getElementById(key);
            if (el && data[key] != null) el.value = data[key];
        }
    }

    //radios
    if (data.pvTipEmp) {
        const r = form.querySelector(`input[name="pvTipEmp"][value="${data.pvTipEmp}"]`);
        if (r) r.checked = true;
    }
    if (data.pvGrCon) {
        const r = form.querySelector(`input[name="pvGrCon"][value="${data.pvGrCon}"]`);
        if (r) r.checked = true;
    }
    if (data.pvDeclIndCom) {
        const r = form.querySelector(`input[name="pvDeclIndCom"][value="${data.pvDeclIndCom}"]`);
        if (r) r.checked = true;
    }
    if (data.pvAutRet) {
        const r = form.querySelector(`input[name="pvAutRet"][value="${data.pvAutRet}"]`);
        if (r) r.checked = true;
    }
    if (data.pvPosCuBan) {
        const r = form.querySelector(`input[name="pvPosCuBan"][value="${data.pvPosCuBan}"]`);
        if (r) r.checked = true;
    }
    if (data.pvTDPMotMaq) {
        const r = document.querySelector(`input[name="pvTDPMotMaq"][value="${data.pvTDPMotMaq}"]`);
        if (r) r.checked = true;
    }
    if (data.pvTDPCasTor) {
        const r = document.querySelector(`input[name="pvTDPCasTor"][value="${data.pvTDPCasTor}"]`);
        if (r) r.checked = true;
    }
    if (data.pvTDPBonap) {
        const r = document.querySelector(`input[name="pvTDPBonap"][value="${data.pvTDPBonap}"]`);
        if (r) r.checked = true;
    }
    if (data.pvTDPBellpi) {
        const r = document.querySelector(`input[name="pvTDPBellpi"][value="${data.pvTDPBellpi}"]`);
        if (r) r.checked = true;
    }
    if (data.pvRadAut) {
        const r = document.querySelector(`input[name="pvRadAut"][value="${data.pvRadAut}"]`);
        if (r) r.checked = true;
    }

    isAutoFilling = false;
}

//  ---------SE BORRA DENTRO DE POCO--------   funcion para limpiar los radioButtons de nacionalidad
function clearRadios(radioGroup) {
    if (!radioGroup || !radioGroup.forEach) return;
    radioGroup.forEach(radio => radio.checked = false);
}


//funcion para precargar datos de proveedores_Master
function loadMasterData(masterData, formId, idNum) {

    if (formId === 'persNatuForm') {
        document.getElementById('idNum').value = idNum;
    }

    //Precarga el resto de la data de proveedores_Master (si existe)
    if (masterData) {
        if (formId === 'persNatuForm') {
            //precarga los campos que coincida con la data de master
            document.getElementById('pnNombreCompl').value = masterData.nombre || '';
            document.getElementById('pnDiResidencia').value = masterData.direccion || '';
            document.getElementById('pnEmail').value = masterData.correo || '';

            //logica para separar tel fijos de celular de master
            const phone = masterData.telefono || '';
            const pnTelefono = document.getElementById('pnTelefono');
            const pnCelular = document.getElementById('pnCelular');

            if (pnTelefono) pnTelefono.value = '';
            if (pnCelular) pnCelular.value = '';

            if (phone.startsWith('6') && pnTelefono) {
                pnTelefono.value = phone;
            } else if (phone.startsWith('3') && pnCelular) {
                pnCelular.value = phone;
            }
        }
        else if (formId === 'persJuriForm') {
            //precarga los campos que coincida con la data de master
            document.getElementById('pjRazSocial').value = masterData.nombre || '';
            document.getElementById('pjDirPrincipal').value = masterData.direccion || '';
            document.getElementById('pjEmailDirPrincipal').value = masterData.correo || '';
            document.getElementById('pjTelDirPrincipal').value = masterData.telefono || '';

            const docInputPJ = document.getElementById('pjNIT');
            if (docInputPJ) {
                docInputPJ.value = idNum;
                docInputPJ.setAttribute('disabled', 'disabled');
            }
        }
    }
}

//funcion para recopilar los datos del formulario persona natural
function collectFormData_Natural() {
    const form = document.getElementById('persNatuForm');
    const data = {};

    //recopila campos simples
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], select, textarea')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = el.value.trim() !== "" ? el.value.trim() : null;
        });

    //recopila Nacionalidad
    data.pnTipoNacionalidad = pnTipoNacionalidad.value || null;
    data.pnTipoDoc = pnTipoDoc.value || null;
    data.pnNumId = inputNumId.value.trim() !== "" ? inputNumId.value.trim() : null;

    //radios y checkboxes
    const radioGroups = [
        'pnReconoPublic',
        'pnManRePub',
        'pnPEP'
    ];

    radioGroups.forEach(rname => {
        const checked = form.querySelector(`input[name="${rname}"]:checked`);
        data[rname] = checked ? checked.value : null;
    });

    const selectedPEPTypes = Array.from(form.querySelectorAll('input[name="pnPEPType"]:checked'))
        .map(chk => chk.value);

    data.PEPTypes = selectedPEPTypes.length > 0 ? selectedPEPTypes : [];

    //PEP entidad (solo si es 'si')
    if (data.pnPEP === 'Si') {
        const entidad = document.getElementById('pnPEP_Entidad').value.trim();
        data.pnPEP_Entidad = entidad !== "" ? entidad : null;
    } else {
        data.pnPEP_Entidad = null;
        data.PEPTypes = [];
    }

    //forzar ubicaciones a null por seguridad si estan vacias
    [
        'pnDepExpDoc', 'pnCiuExpDoc',
        'pnDepRes', 'pnCiudadRes',
        'pnEstadoNac', 'pnCiudadNac',
        'pnNacionalidad'
    ].forEach(name => {
        if (!data[name] || data[name] === "") data[name] = null;
    });

    //agregar NIT consultado
    data.Nit = document.getElementById('idNum').value;

    return data;
}

//funcion para recopilar los datos del formulario persona juridica
function collectFormData_Juridica() {
    const form = document.getElementById('persJuriForm');
    const data = {};

    form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], select, textarea')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = el.value.trim() !== "" ? el.value.trim() : null;
        });

    const radioGroups = ['pjRLTipNacionalidad', 'pjRLRadNac', 'pjRLRadExtr'];
    radioGroups.forEach(rname => {
        const checked = form.querySelector(`input[name="${rname}"]:checked`);
        data[rname] = checked ? checked.value : null;
    });

    if (pjInputNacNum && !pjInputNacNum.disabled && pjInputNacNum.value.trim() !== "") data.pjRLDocNum = pjInputNacNum.value.trim();
    else if (pjInputExtNum && !pjInputExtNum.disabled && pjInputExtNum.value.trim() !== "") data.pjRLDocNum = pjInputExtNum.value.trim();
    else data.pjRLDocNum = null;

    data.pjInputNacNum = data['pjRLNacNum'] || null;
    data.pjInputExtNum = data['pjRLExtNum'] || null;

    data.Sucursales_PJuridica = Array.from(document.querySelectorAll('#sucursales-container .sucursal-item')).map((s, idx) => {
        const i = idx + 1;
        return {
            Direccion: document.getElementById(`pjDirSucursal_${i}`)?.value || '',
            Departamento: document.getElementById(`pjDepartDirSucursal_${i}`)?.value || '',
            Ciudad: document.getElementById(`pjCiudadDirSucursal_${i}`)?.value || '',
            Email: document.getElementById(`pjEmailDirSucursal_${i}`)?.value || '',
            Telefono: document.getElementById(`pjTelDirSucursal_${i}`)?.value || ''
        };
    });

    data.AccionistasControlPJuridica = Array.from(controlTableBody.querySelectorAll('.control-row')).map(row => ({
        razonSocial: row.querySelector('[name="controlRazonSocial[]"]')?.value || '',
        idType: row.querySelector('[name="controlIdType[]"]')?.value || '',
        idNum: row.querySelector('[name="controlIdNum[]"]')?.value || '',
        porcentaje: row.querySelector('[name="controlPorcentaje[]"]')?.value || ''
    }));

    const pjNit = document.getElementById('pjNIT');
    data.Nit = pjNit ? pjNit.value : null;

    return data;
}

//funcion para recopilar los datos del formulario proveedor general
function collectProvFormData() {
    const form = document.getElementById('provForm');
    const data = {};

    //recopila campos simples
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], select, textarea')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = el.value.trim() !== "" ? el.value.trim() : null;
        });

    //radios
    const radioGroups = [
        'pvTipEmp', 'pvGrCon', 'pvDeclIndCom',
        'pvAutRet', 'pvPosCuBan'
    ];

    radioGroups.forEach(rname => {
        const checked = form.querySelector(`input[name="${rname}"]:checked`);
        data[rname] = checked ? checked.value : null;
    });


    //Agrega datos del subform declaraciones y autorizaciones
    data["pvDeAuRepresentacion"] = pvDeAuRepresentacion.value.trim();
    data["pvFuenteRecur"] = pvFuenteRecur.value.trim();

    const sbFormRadios = [
        'pvTDPMotMaq', 'pvTDPCasTor', 'pvTDPBonap',
        'pvTDPBellpi', 'pvRadAut'
    ];

    sbFormRadios.forEach(rname => {
        const checked = document.querySelector(`input[name="${rname}"]:checked`);
        data[rname] = checked ? checked.value : null;
    });


    //Agrega Nit desde idNumInput para el foreign key en DB
    data["Nit"] = idNumInput.value.trim();

    //forzar ubicaciones a null por seguridad si estan vacias
    [
        'pvPorPais', 'pvDepartDec', 'pvCiudadDec'
    ].forEach(name => {
        if (!data[name] || data[name] === "") data[name] = null;
    });

    return data;
}

//funcion de consulta en el BACKEND
consultBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const idNum = idNumInput.value.trim();
    const personType = personTypeSelect.value;
    alertContainer.innerHTML = '';

    if (!personType || !idNum) {
        createAlert('Por favor, ingrese el Tipo de persona e ingrese el Numero de Identificación.', 'danger');
        return;
    }

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';

    const url = `/Admin/CheckProvider?idNum=${idNum}&personType=${personType}`;
    loaderContainer.style.display = 'flex';

    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log('Respuesta del servidor:', result);

        if (!response.ok)
            throw new Error(result.message || 'Error desconocido en la respuesta del servidor.');

        //ID no encontrado (proveedor no registrado)
        if (result.status === 'notFound') {
            createAlert(`Proveedor con ID: ${idNum} no encontrado. Verifique el ID o registre el nuevo proveedor.`, 'success');
            return;
        }

        //ID ya registrado con un tipo de persona diferente
        if (result.status === 'misMatch') {
            const registeredTypeText = result.registeredType === 'natural' ? 'Persona Natural' : 'Persona Juridica';
            createAlert(`¡Advertencia! El proveedor con ID: ${idNum} ya esta registrado como ${registeredTypeText}. Para actualizarlo debe seleccionar "${registeredTypeText}" en el desplegable.`, 'warning');
            return;
        }

        //ID solo registrado en proveedores_Master
        if (result.status === 'foundMasterOnly') {
            createAlert(`Proveedor con ID: ${idNum} encontrado en la base de datos basica. Conplete y/o actualice la informacion.`, 'info');

            isNewRegister = true;

            const masterData = result.data;

            if (personType === 'natural') {
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block';
                loadFormData_Natural({});
                loadMasterData(masterData, 'persNatuForm', idNum);
            } else {
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block'
                loadFormData_Juridica({});
                loadMasterData(masterData, 'persJuriForm', idNum);
            }

            await ubicProvFormHandler();

            return;
        }

        //ID ya registrado en proveedores_Master, en una tabla de tipo de persona (natural o juridica) y en proveedores_FUCP
        if (result.status === 'foundDetail') {
            createAlert(`Informacion del proveedor con ID: ${idNum} cargada con exito.`, 'success');

            const formData = result.data;

            if (personType === 'natural') {
                persNatuForm.style.display = 'block';
                provForm.style.display = 'block'

                if (formData.natural) {
                    await loadFormData_Natural(formData.natural);
                }

                loadMasterData(null, 'persNatuForm', idNum);

            } else {
                persJuriForm.style.display = 'block';
                provForm.style.display = 'block'

                if (formData.juridica) {
                    await loadFormData_Juridica(formData.juridica);
                }

                loadMasterData(null, 'persJuriForm', idNum);

            }

            await ubicProvFormHandler();

            if (formData.fucp) {
                await loadProvFormData(formData.fucp);
            }

            return;
        }

        createAlert('No se pudo determinar el estado del proveedor.', 'danger');
    } catch (error) {
        createAlert("Error al consultar: " + error.message, 'danger');
        console.error('Error de Fetch:', error);
    } finally {
        loaderContainer.style.display = 'none';
    }
});

//logica para mostrar/ocultar los forms al cambiar el tipo de persona
personTypeSelect.addEventListener('change', function () {

    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    provForm.style.display = 'none';
    idNumInput.value = '';

    idSection.style.display = 'flex';
    alertContainer.innerHTML = '';
});

//logica para mostrar/ocultar campos relacionados con PEP en el form de persona natural
function handlePEPChange() {
    if (pnPEPYes && pnPEPYes.checked) {
        pnPEPtypeGroup.style.display = 'flex';
        pnPEP_Entidad_Cont.style.display = 'block';

        pnPEPChk.forEach(chk => chk.checked = originalPEPTypes.includes(parseInt(chk.value)));
        pnPEP_Entidad.value = originalPEPEntidad || '';

    } else if (pnPEPNo.checked) {
        pnPEPtypeGroup.style.display = 'none';
        pnPEP_Entidad_Cont.style.display = 'none';

        pnPEPChk.forEach(chk => chk.checked = false);
        pnPEP_Entidad.value = '';
    }
}
if (pnPEPYes) {
    pnPEPYes.addEventListener('change', handlePEPChange);
}
if (pnPEPNo) {
    pnPEPNo.addEventListener('change', handlePEPChange);
}
handlePEPChange();

//logica para agregar y eliminar sucursales en el form de persona juridica
addSucursalBtn.addEventListener('click', function () {
    const currentSucursales = sucursalesContainer.querySelectorAll('.sucursal-item').length;
    const newIndex = currentSucursales + 1;

    if (newIndex > 3) {
        sucursalLimitMsg.style.display = 'block';
        return;
    }
    sucursalLimitMsg.style.display = 'none';

    const newSucursalDiv = document.createElement('div');
    newSucursalDiv.className = 'sucursal-item justify-content-around align-items-center w-75 flex-row m-2 p-2';
    newSucursalDiv.id = `sucursal_${newIndex}`;
    newSucursalDiv.innerHTML = `
                    <h4>Dirección sucursal ${newIndex}</h4>
                    <div class="d-flex">
                        <div class="form-group input-wrapper">
                            <input type="text" id="pjDirSucursal_${newIndex}" name="pjDirSucursal_${newIndex}" class="form-control" required />
                            <label for="pjDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="Dirección Sucursal" alt="Dirección Sucursal"></label>
                        </div>
                        <div class="form-group d-block custom-input-group">
                            <label for="pjDepartDirSucursal_${newIndex}" class="form-label">Departamento:</label>
                            <select id="pjDepartDirSucursal_${newIndex}" name="pjDepartDirSucursal_${newIndex}" class="form-control" required></select>
                        </div>
                        <div class="form-group d-block custom-input-group">
                            <label for="pjCiudadDirSucursal_${newIndex}" class="form-label">Ciudad:</label>
                            <select id="pjCiudadDirSucursal_${newIndex}" name="pjCiudadDirSucursal_${newIndex}" class="form-control" required></select>
                        </div>
                    </div>
                    <div class="d-flex justify-content-around align-items-center flex-row m-2 p-2">
                        <div class="form-group input-wrapper">
                            <input type="email" id="pjEmailDirSucursal_${newIndex}" name="pjEmailDirSucursal_${newIndex}" class="form-control" required />
                            <label for="pjEmailDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="E-mail" alt="E-mail"></label>
                        </div>
                        <div class="form-group input-wrapper">
                            <input type="number" id="pjTelDirSucursal_${newIndex}" name="pjTelDirSucursal_${newIndex}" class="form-control" required />
                            <label for="pjTelDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="Teléfono" alt="Teléfono"></label>
                        </div>
                        <div class="form-group">
                            <button type="button" class="remove-sucursal-btn button-group btn btn-primary">Remover Sucursal</button>
                        </div>
                    </div>
                `;

    sucursalesContainer.appendChild(newSucursalDiv);
    initSucursalUbic(newIndex);
    if (newIndex === 3) {
        sucursalLimitMsg.style.display = 'block';
    }
});
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

            //oculta mensaje del limite si se elimino una sucursal y quedo menos del maximo
            if (sucursales.length < 3) {
                sucursalLimitMsg.style.display = 'none';
            }
        }
    }
});

//logica para agregar y remover filas a la tabla de control Persona Juridica
function addControlRow() {
    const newRow = document.createElement('tr');
    newRow.className = 'control-row';
    newRow.innerHTML = `
                    <td><input type="text" class="form-control" name="controlRazonSocial[]" style="width:100%;" /></td>
                    <td>
                        <select class="form-control" name="controlIdType[]">
                            <option value="" disabled selected>Seleccione</option>
                            <option value="CC">CC</option>
                            <option value="NIT">NIT</option>
                        </select>
                    </td>
                    <td><input type="text" class="form-control" name="controlIdNum[]" style="width:100%;" /></td>
                    <td><input type="number" class="form-control" name="controlPorcentaje[]" style="width:100%;" /></td>
                    <td><button type="button" class="remove-control-row button-group btn btn-primary">Eliminar</button></td>
                `;
    controlTableBody.appendChild(newRow);
}
addControlRowBtn.addEventListener('click', addControlRow);
controlTableBody.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-control-row')) {
        if (controlTableBody.querySelectorAll('.control-row').length > 1) {
            e.target.closest('.control-row').remove();
        } else {
            alert("Debe haber al menos una fila de control.");
        }
    }
});

//inicializa la vista
window.onload = function () {
    personTypeSelect.value = '';
    persNatuForm.style.display = 'none';
    persJuriForm.style.display = 'none';
    handlePEPChange();
};

//logica de conexion al backend
function sendData(payload, url) {
    console.log("Enviando datos a:", url, payload);

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(result => {
            if (result.error || result.status === 'error') {
                alert("Error: " + (result.message || result.error));
                throw new Error(result.message || result.error);
            }
            alert("¡Exito! " + (result.message || 'Guardado correctamente.'));
            return result;
        })
        .catch(error => {
            console.error('Error de Fetch:', error);
            alert("Error al guardar: " + error.message);
        });
}

//logica del subformulario de direccion (despliega subform, botones cancelar y guardar)
document.addEventListener('focusin', (e) => {
    if (e.target.matches('input[id^="pnDiResidencia"], input[id^="pjDirPrincipal"],input[id^="pjDirSucursal_"]')) {
        activeDirecform = e.target;
        document.getElementById('directionStructure').style.display = 'flex';
    }
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
    if (compleDir) direcc = ` ${compleDir}`;

    //asigna la direccion al input
    if (activeDirecform) {
        activeDirecform.value = direcc;
    }

    //cierre
    document.getElementById('directionStructure').style.display = 'none';
    activeDirecform = null;
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
})

//listener de envio de forms
submitPrvBtn.addEventListener("click", submitPrvBtnHandler);

async function submitPrvBtnHandler(e) {
    e.preventDefault();

    //recopila la data de los forms
    const natData = collectFormData_Natural();
    const jurData = collectFormData_Juridica();
    const provData = collectProvFormData();


    try {
        //Add o Update segun tipo de persona y su registro
        if (personTypeSelect.value === 'natural') {
            await sendData(natData, isNewRegister ? '/Admin/AddProviderNatural' : '/Admin/UpdateProviderNatural');

        } else if (personTypeSelect.value === 'juridica') {
            await sendData(jurData, isNewRegister ? '/Admin/AddProviderJuridica' : '/Admin/UpdateProviderJuridica');
        }

        //Add o Update del form proveedor general(FUCP)
        await sendData(provData, isNewRegister ? '/Admin/AddProviderFUCP' : '/Admin/UpdateProviderFUCP');

        alert("Proveedor guardado completamente.");

    } catch (err) {
        console.log('Error al guardar proveedor: ', +err);
        alert("Error al guardar: " + (err.message || err));
    }
};