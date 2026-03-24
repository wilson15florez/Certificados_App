import * as CNS from './constant.js';
import { openFormDA } from './helpers-ui.js';


/**
 * Verifica si una fecha de nacimiento corresponde a una persona mayor de edad (>=18 años).
 * Ajusta correctamente si el cumpleaños aún no ha ocurrido en el año actual.
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'.
 * @returns {boolean} true si tiene 18 o más años.
 */
export function isAdult(dateString) {
    if (!dateString) return;

    const birthday = new Date(dateString);
    const today = new Date();

    //calcula la edad
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    //ajustar si aun no ha cumplido años en el año actual
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }

    return age >= 18;
}

/**
 * Determina si el Formato Único de Conocimiento de Proveedores (FUCP) está desactualizado.
 * El FUCP se considera vencido si fue diligenciado en un año anterior al actual.
 * @param {string|null} FechaDiligencia_Formato - Fecha de diligenciamiento del FUCP en Proveedores_Master.
 * @returns {boolean} true si debe actualizarse, false si está vigente.
 */
function shouldUpdateFUCP(FechaDiligencia_Formato) {
    if (!FechaDiligencia_Formato) return true;

    const dateDoc = new Date(FechaDiligencia_Formato);
    const yearDoc = dateDoc.getFullYear();

    //fecha actual
    const currentDate = new Date().getFullYear();

    // si el año del ultimo diligenciamiento es menor al año actual, se debe actualizar el formato
    return yearDoc < currentDate;
}
/**
 * Verifica la vigencia del FUCP y muestra alerta si debe actualizarse.
 * Se llama al cargar la vista de formularios cuando el proveedor tiene foundDetail.
 * @param {string} fechaMaster - Valor de FechaDiligencia_Formato de Proveedores_Master.
 * @returns {Promise<boolean>} true si el formato está desactualizado.
 */
export async function validityFUCP(fechaMaster) {
    const isInvalid = shouldUpdateFUCP(fechaMaster);

    if (isInvalid) {
        CNS.alertBody.innerText = 'El formato único de conocimiento de proveedores (FUCP) que se encuentra registrado en el sistema, fue diligenciado en el año anterior. Por favor, revise y actualice la información correspondiente al año vigente.';
        CNS.alert.show();
        return true;
    }
    return false;
}

/**
 * Configura la fecha máxima de todos los inputs de tipo date al día de hoy,
 * excepto pvFechVen (fecha de vencimiento) que puede ser futura.
 * Se llama una sola vez desde initSharedHandlers.
 */
export function dateLimits() {
    const today = new Date().toISOString().split('T')[0];

    //selecciona todos los inputs date
    const dateInputs = document.querySelectorAll('input[type="date"]');

    dateInputs.forEach(i => {
        //si no corresponde a la fecha de vencimiento en el form informacion financiera, la fecha maxima es hoy
        if (i.id !== 'pvFechVen') {
            i.setAttribute('max', today);
        }
    });
}

/**
 * Aplica el estado visual de error al primer radio del grupo y hace scroll hacia él.
 * Se usa en validateNaturalForm, validateJuridicaForm y validateProvForm para
 * señalizar grupos de radios no seleccionados.
 * @param {string} name - Atributo name del grupo de radios.
 * @param {string} [message='Seleccione una opción.'] - Mensaje de error a mostrar.
 */
function scrollToRadio(name, message = 'Seleccione una opción.') {
    const firstRadio = document.querySelector(`input[name="${name}"]`);
    if (!firstRadio) return;
    toggleValidInput(firstRadio, false, message);
}

/**
 * Muestra u oculta el estado visual de validación en un campo del formulario.
 * Maneja tres casos especiales:
 * - Select2: aplica la clase al elemento .select2-selection (no al select oculto).
 * - Radio/checkbox: busca el contenedor .check-group o el padre directo.
 * - Normal: aplica directamente al elemento.
 * Elimina mensajes de error previos antes de agregar uno nuevo.
 * Hace scroll suave hacia el campo inválido.
 * @param {HTMLElement} el - Elemento a validar.
 * @param {boolean} isValid - true para marcar como válido, false para inválido.
 * @param {string} [message='Este campo es obligatorio.'] - Mensaje de error.
 */
export function toggleValidInput(el, isValid, message = 'Este campo es obligatorio.') {
    if (!el) return;

    //identificar el contenedor real para el mensaje y la clase de error
    let targetVisual = el;
    let container = el.parentNode;

    //caso especial: select2
    if (el.classList.contains('select2-hidden-accessible')) {
        const s2Container = el.nextElementSibling;
        if (s2Container && s2Container.classList.contains('select2-container')) {
            targetVisual = s2Container.querySelector('.select2-selection');
        }
    }
    //caso especial: radios o checkbox
    else if (el.type === 'radio' || el.type === 'checkbox') {
        targetVisual = null;
        container = el.closest('.check-group') || el.parentNode;
    }

    //elimina mensajes previos
    const existingError = container.querySelector('.error-message');
    if (existingError) existingError.remove();
    if (targetVisual) targetVisual.classList.remove('is-invalid-custom');

    if (!isValid) {
        if (targetVisual) targetVisual.classList.add('is-invalid-custom');
        //crea un elemento para mostrar el mensaje de error
        const errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.innerText = message;
        container.appendChild(errorEl);

        const scrollTarget = targetVisual || container;
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Valida todos los campos del formulario de persona natural (persNatuForm)
 * antes de enviarlo al backend.
 * Validaciones incluidas:
 * - Tipo de nacionalidad y tipo de documento seleccionados.
 * - Campos de texto obligatorios no vacíos.
 * - Fecha de nacimiento: mayor de edad (≥18).
 * - Email: formato válido.
 * - Teléfono fijo (si se ingresó): válido según intl-tel-input.
 * - Celular: obligatorio y válido.
 * - Reconocimiento público, manejo de recursos públicos y PEP: radios seleccionados.
 * - Si es PEP: al menos un tipo seleccionado y entidad informada.
 * @returns {boolean} true si el formulario es válido, false si hay errores.
 */
export function validateNaturalForm() {
    const form = document.getElementById('persNatuForm');

    //verifica que sea nacional o extranjero
    if (!pnTipoNacionalidad.value) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si es Nacional o Extranjero.';
        CNS.alertError.show();
        pnTipoNacionalidad.focus();
        return false;
    }

    //verifica que tipo de documento este seleccionado
    if (!pnTipoDoc.value) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione el tipo de documento correspondiente.';
        CNS.alertError.show();
        pnTipoDoc.focus();
        return false;
    }

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pnPrimerApell', 'pnSegundoApell', 'pnNombres', 'pnFechaExpDoc',
        'pnDepExpDoc', 'pnCiuExpDoc', 'pnNacionalidad', 'pnEstadoNac',
        'pnCiudadNac', 'pnFechaNac', 'pnDiResidencia', 'pnDiResidencia',
        'pnDepRes', 'pnCiudadRes', 'pnEmail', 'pnCelular', 'pnActividad'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            CNS.alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            CNS.alertError.show();
            toggleValidInput(el, false, 'Este campo es obligatorio.');
            el.focus();
            return false;
        }
    }

    //valida que fecha de nacimiento corresponda a un mayor de edad(>=18)
    const pnFechaNac = document.getElementById('pnFechaNac');
    if (pnFechaNac.value && !isAdult(pnFechaNac.value)) {
        CNS.alertErrorBody.innerText = 'La persona natural debe ser mayor de edad.';
        CNS.alertError.show();
        toggleValidInput(pnFechaNac, false, 'La persona natural debe ser mayor de edad.');
        pnFechaNac.focus();
        return false;
    }

    // verifica email
    const email = document.getElementById('pnEmail');

    if (email.value.trim() && !CNS.regexEmail.test(email.value.trim())) {
        CNS.alertErrorBody.innerHTML = 'Por favor ingrese un correo electrónico válido.';
        CNS.alertError.show();
        email.focus();
        return false;
    }

    const itiTel = CNS.telInst['pnTelefono'];
    const itiCel = CNS.telInst['pnCelular'];

    //valida telefono fijo (si fue diligenciado)
    if (document.getElementById('pnTelefono').value.trim() !== '') {
        if (!itiTel.isValidNumber()) {
            CNS.alertErrorBody.innerText = 'Por favor ingrese un número de teléfono fijo válido para el país seleccionado.';
            CNS.alertError.show();
            document.getElementById('pnTelefono').focus();
            return false;
        }
    }

    //valida celular (obligatorio)
    if (!itiCel.isValidNumber()) {
        CNS.alertErrorBody.innerText = 'Por favor ingrese un número de celular válido para el país seleccionado.';
        CNS.alertError.show();
        document.getElementById('pnCelular').focus();
        return false;
    }

    //verificacion reconocimiento publico
    if (!form.querySelector('input[name="pnReconoPublic"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si tiene reconocimiento publico.';
        CNS.alertError.show();
        scrollToRadio('pnReconoPublic', 'Seleccione una opción.');
        return false;
    }
    //verificacion manejo de recursos publico
    if (!form.querySelector('input[name="pnManRePub"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si maneja recursos de origen publico.';
        CNS.alertError.show();
        scrollToRadio('pnManRePub', 'Seleccione una opción.');
        return false;
    }

    //verifica PEP y de ser si, valida el check y entidad
    if (!form.querySelector('input[name="pnPEP"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si es Persona Expuesta Politicamente (PEP).';
        CNS.alertError.show();
        scrollToRadio('pnPEP', 'Seleccione una opción.');
        return false;
    }

    if (form.querySelector('input[id="pnPEPSi"]:checked')) {
        const pepChecks = form.querySelectorAll('input[name="pnPEPType"]:checked');
        const pepEntidad = document.getElementById('pnPEP_Entidad');

        if (pepChecks.length === 0) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione al menos un tipo de PEP.';
            CNS.alertError.show();
            scrollToRadio('pnPEPType', 'Seleccione al menos un tipo de PEP.');
            return false;
        }
        if (!pepEntidad.value.trim()) {
            CNS.alertErrorBody.innerText = 'Por favor ingrese la entidad relacionada con el PEP.';
            CNS.alertError.show();
            toggleValidInput(pepEntidad, false, 'Este campo es obligatorio.');
            pepEntidad.focus();
            return false;
        }
    }

    return true;
}

/**
 * Valida todos los campos del formulario de persona jurídica (persJuriForm).
 * Validaciones incluidas:
 * - Campos de texto obligatorios de la empresa y del representante legal.
 * - Teléfono principal válido.
 * - Email de dirección principal válido.
 * - Sucursales: todos los campos completos, email y teléfono válidos por sucursal.
 * - Accionistas: todos los campos completos, porcentaje mínimo 5%, suma total = 100%.
 * - Tipo de nacionalidad y tipo de documento del representante legal seleccionados.
 * - Fecha de nacimiento del representante legal: mayor de edad.
 * @returns {boolean} true si el formulario es válido, false si hay errores.
 */
export function validateJuridicaForm() {
    const form = document.getElementById('persJuriForm');

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pjRazSocial', 'pjDepartDilig', 'pjCiudadDilig', 'pjDirPrincipal', 'pjDepartDirPrincipal',
        'pjCiudadDirPrincipal', 'pjEmailDirPrincipal', 'pjTelDirPrincipal', 'pjPrimApeRL',
        'pjSegApeRL', 'pjNomReLeg', 'pjRLDocNum', 'pjRLFechExpDoc', 'pjRLDepExpDoc',
        'pjRLCiuExpDoc', 'pjRLFechaNac', 'pjRLNacionalidad', 'pjRLDepartNac', 'pjRLCiudadNac'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            CNS.alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            CNS.alertError.show();
            toggleValidInput(el, false, 'Este campo es obligatorio.');
            el.focus();
            return false;
        }
    }

    //valida telefono principal (fijo o celular)
    const itiTelPrinc = CNS.telInst['pjTelDirPrincipal'];
    if (!itiTelPrinc.isValidNumber()) {
        CNS.alertErrorBody.innerText = 'Por favor ingrese un número de teléfono válido para el país seleccionado en dirección principal.';
        CNS.alertError.show();
        return false;
    }

    //validar email
    const emailPrincipal = document.getElementById('pjEmailDirPrincipal').value.trim();

    if (emailPrincipal && !CNS.regexEmail.test(emailPrincipal)) {
        CNS.alertErrorBody.innerText = 'Por favor ingrese un correo electrónico válido para la dirección principal.';
        CNS.alertError.show();
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
            CNS.alertErrorBody.innerText = `Por favor complete todos los campos de la sucursal ${idx}.`;
            CNS.alertError.show();
            return false;
        }

        if (!CNS.regexEmail.test(email)) {
            CNS.alertErrorBody.innerText = `Por favor ingrese un correo electrónico válido para la sucursal ${idx}.`;
            CNS.alertError.show();
            return false;
        }

        const itiTelSucur = CNS.telInst[`pjTelDirSucursal_${idx}`];
        if (!itiTelSucur.isValidNumber()) {
            CNS.alertErrorBody.innerText = `Por favor ingrese un número de teléfono válido para el país seleccionado en la sucursal ${idx}.`;
            CNS.alertError.show();
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
            CNS.alertErrorBody.innerText = `Por favor complete todos los campos de la fila ${i + 1} en la tabla de accionistas.`;
            CNS.alertError.show();
            return false;
        }

        //se rquiere porcentaje minimo del 5%
        if (porcentaje < 5) {
            CNS.alertErrorBody.innerText = `El porcentaje de participación debe ser al menos del 5% en la fila ${i + 1}.`;
            CNS.alertError.show();
            return false;
        }

        totalPorc += porcentaje;
    }

    if (totalPorc < 100) {
        CNS.alertErrorBody.innerText = `La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), es menor al 100%.
                      Por favor ajuste los valores antes de guardar.`;
        CNS.alertError.show();
        return false;
    }

    if (totalPorc > 100) {
        CNS.alertErrorBody.innerText = `La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), supera el 100%.
                    Por favor ajuste los valores antes de guardar.`;
        CNS.alertError.show();
        return false;
    }

    //valida que representante legal sea nacional o extranjero
    if (!pjRLTipNacionalidad.value) {
        CNS.alertErrorBody.innerText = 'Seleccione si el representante legal es Nacional o Extranjero.';
        CNS.alertError.show();
        pjRLTipNacionalidad.focus();
        return false;
    }

    //verifica tipo de documento
    if (!pjRLTipoDoc.value) {
        CNS.alertErrorBody.innerText = 'Por favos seleccione el tipo de documento correspondiente.';
        CNS.alertError.show();
        pjRLTipoDoc.focus();
        return false;
    }

    const pjRLFechaNac = document.getElementById('pjRLFechaNac');
    if (pjRLFechaNac.value && !isAdult(pjRLFechaNac.value)) {
        CNS.alertErrorBody.innerText = 'El respresentante legal debe ser mayor de edad.';
        CNS.alertError.show();
        toggleValidInput(pjRLFechaNac, false, 'La persona debe ser mayor de edad.')
        pjRLFechaNac.focus();
        return false;
    }

    return true;
}

/**
 * Valida todos los campos del formulario de información financiera (provForm).
 * Validaciones incluidas:
 * - Campos de texto/select obligatorios habilitados.
 * - Porcentaje de capital: nacional no puede ser 0, si hay extranjero la suma debe ser 100%.
 * - Radios obligatorios: gran contribuyente, declarante ICA, autoretenedor,
 *   comercio exterior, posee cuenta bancaria.
 * - Certificaciones (solo para persona jurídica): OEA, Calidad, BASC, Ambiental,
 *   ISO 28000, SST.
 * - Declaraciones y autorizaciones: los cuatro radios de tratamiento de datos,
 *   campos pvDeAuRepresentacion, pvFuenteRecur y pvCumCSIn.
 *   Si alguno de estos falta, abre automáticamente el subform de declaraciones.
 * @param {'natural'|'juridica'} personType - Las certificaciones solo aplican para jurídica.
 * @returns {boolean} true si el formulario es válido, false si hay errores.
 */
export function validateProvForm(personType) {

    const form = document.getElementById('provForm');

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos',
        'pvPatrimonio', 'pvPorNacional', 'pvPorPais', 'pvTipEmp',  
        'pvAcEconomica', 'pvCodCIIU', 'pvCapSocReg', 'pvFechConst',
        'pvFechVen', 'pvFechResolGC', 'pvNumResolGC', 'pvDepartDec',
        'pvCiudadDec', 'pvNumResDIAN', 'pvForPag', 'pvEntBenef',
        'pvEntidad', 'pvNumCueBanc', 'pvClasCueBan'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || el.disabled || !el.required) continue;
        if (!el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            CNS.alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            CNS.alertError.show();
            toggleValidInput(el, false, 'Este campo es obligatorio.');
            el.focus();
            return false;
        }
    }

    //verifica porcentaje capital nacional y/o extranjero
    const pvPorNacional = document.getElementById('pvPorNacional');
    const pvPorExtranjero = document.getElementById('pvPorExtranjero');
    let totalPorc = 0;
    const porcNac = parseFloat(pvPorNacional.value.trim() || 0);
    const porcExtr = parseFloat(pvPorExtranjero.value.trim() || 0);
    if (porcNac == 0) {
        CNS.alertErrorBody.innerText = 'El porcentaje de capital nacional no puede ser cero (0).';
        CNS.alertError.show();

        CNS.dirtyFields.add('pvPorNacional');
        toggleValidInput(pvPorNacional, false, 'Porcentaje invalido.');
        pvPorNacional.focus();

        return false;
    }
    if (porcExtr != 0) {
        totalPorc = porcNac + porcExtr;
        if (totalPorc !== 100) {
            CNS.alertErrorBody.innerText = 'La suma del porcentaje de capital nacional y extranjero debe ser igual a cien (100%).';
            CNS.alertError.show();

            CNS.dirtyFields.add('pvPorNacional');
            CNS.dirtyFields.add('pvPorExtranjero');
            toggleValidInput(pvPorExtranjero, false, 'Porcentajes no validos.');
            pvPorExtranjero.focus();    

            return false;
        }
    } else if (porcNac !== 100) {
        CNS.alertErrorBody.innerText = 'El porcentaje de capital nacional debe ser igual a cien (100%) si no hay capital extranjero.';
        CNS.alertError.show();

        CNS.dirtyFields.add('pvPorNacional');
        toggleValidInput(pvPorNacional, false, 'Porcentaje invalido.');
        pvPorNacional.focus();

        return false;
    }

    //verifica gran contribuyente
    if (!form.querySelector('input[name="pvGrCon"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si es gran contribuyente.';
        CNS.alertError.show();
        scrollToRadio('pvGrCon', 'Seleccione una opción.');
        return false;
    }

    //verifica declaracion de industria y comercio
    if (!form.querySelector('input[name="pvDeclIndCom"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si es declarante de industria y comercio.';
        CNS.alertError.show();
        scrollToRadio('pvDeclIndCom', 'Seleccione una opción.');
        return false;
    }

    //verifica auto retenedor
    if (!form.querySelector('input[name="pvAutRet"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si es auto retenedor.';
        CNS.alertError.show();
        scrollToRadio('pvAutRet', 'Seleccione una opción.');
        return false;
    }

    //varifica comercio exterior
    if (!form.querySelector('input[name="pvOpeCExt"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si realiza operaciones de comercio exterior.';
        CNS.alertError.show();
        scrollToRadio('pvOpeCExt', 'Seleccione una opción.');
        return false;
    }

    //verifica posecion cuenta bancaria
    if (!form.querySelector('input[name="pvPosCuBan"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si posee cuenta bancaria.';
        CNS.alertError.show();
        scrollToRadio('pvPosCuBan', 'Seleccione una opción.');
        return false;
    }

    //verifica certificaciones

    if (personType === 'juridica') {
        //OEA
        if (!form.querySelector('input[name="pvCeOEA"]:checked')) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación OEA.';
            CNS.alertError.show();
            scrollToRadio('pvCeOEA', 'Seleccione una opción.');
            return false;
        }

        //Calidad ISO 9001
        if (!form.querySelector('input[name="pvCeCal"]:checked')) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación de Calidad ISO 9001.';
            CNS.alertError.show();
            scrollToRadio('pvCeCal', 'Seleccione una opción.');
            return false;
        }

        //BASC
        if (!form.querySelector('input[name="pvCeBASC"]:checked')) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación BASC.';
            CNS.alertError.show();
            scrollToRadio('pvCeBASC', 'Seleccione una opción.');
            return false;
        }

        //Ambiental ISO 14001
        if (!form.querySelector('input[name="pvCeAmb"]:checked')) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación Ambiental ISO 14001.';
            CNS.alertError.show();
            scrollToRadio('pvCeAmb', 'Seleccione una opción.');
            return false;
        }

        //ISO 28000
        if (!form.querySelector('input[name="pvCe28000"]:checked')) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación ISO 28000.';
            CNS.alertError.show();
            scrollToRadio('pvCe28000', 'Seleccione una opción.');
            return false;
        }

        //SST ISO 45000
        if (!form.querySelector('input[name="pvCeSST"]:checked')) {
            CNS.alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación SST ISO 45000.';
            CNS.alertError.show();
            scrollToRadio('pvCeSST', 'Seleccione una opción.');
            return false;
        }
    }
    
    //verifica autorizaciones
    const pvTDPMotMaq = document.querySelector('input[name="pvTDPMotMaq"]:checked');
    if (!pvTDPMotMaq) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para MOTORYSA S.A.';
        CNS.alertError.show();
        scrollToRadio('pvTDPMotMaq', 'Seleccione una opción.');
        return false;
    }

    const pvTDPCasTor = document.querySelector('input[name="pvTDPCasTor"]:checked');
    if (!pvTDPCasTor) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para CASATORO S.A.';
        CNS.alertError.show();
        scrollToRadio('pvTDPCasTor', 'Seleccione una opción.');
        return false;
    }

    const pvTDPBonap = document.querySelector('input[name="pvTDPBonap"]:checked');
    if (!pvTDPBonap) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para BONAPARTE S.A.S.';
        CNS.alertError.show();
        scrollToRadio('pvTDPBonap', 'Seleccione una opción.');
        return false;
    }

    const pvRadAut = document.querySelector('input[name="pvRadAut"]:checked');
    if (!pvRadAut) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos.';
        CNS.alertError.show();
        scrollToRadio('pvRadAut', 'Seleccione una opción.');
        return false;
    }

    const pvDeAuRepresentacion = document.getElementById('pvDeAuRepresentacion');
    if (!pvDeAuRepresentacion.value) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor indique a quien representa.';
        CNS.alertError.show();
        toggleValidInput(pvDeAuRepresentacion, false);
        return false;
    }

    const pvFuenteRecur = document.getElementById('pvFuenteRecur');
    if (!pvFuenteRecur.value) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor indique la fuente de los recursos.'
        CNS.alertError.show();
        toggleValidInput(pvFuenteRecur, false);
        return false;
    }

    const pvCumCSIn = document.querySelector('input[name="pvCumCSIn"]:checked');
    if (!pvCumCSIn) {
        openFormDA();
        CNS.alertErrorBody.innerText = 'Por favor marque si cumple con lo dispuesto en el Capítulo X de la Circular Básica Jurídica de la Superintendencia de Sociedades.';
        CNS.alertError.show();
        scrollToRadio('pvCumCSIn', 'Seleccione una opción.');
        return false;
    }

    return true;
}

/**
 * Valida los documentos cargados en el formulario de documentos (uploadDocsForm).
 * Validaciones incluidas:
 * - Campos de documentos obligatorios no vacíos.
 * - Referencias comerciales: requiere exactamente 2 archivos.
 * - Estados financieros: requiere exactamente 2 archivos.
 * - OEA: radio seleccionado.
 * - Si es OEA: documentos adicionales (upContingMeMagnetico o upContingFirmada,
 *   upManifestacionSeguridad, upCertifiOEA, upAcuerdoSeguridad) completos.
 * - Archivos nuevos en tempFiles: extensión .pdf y tamaño máximo 4MB.
 * @returns {boolean} true si el formulario es válido, false si hay errores.
 */
export function validateDocsForm() {
    const form = document.getElementById('uploadDocsForm');
    //const files = form.querySelectorAll('input[type="file"]');
    const maxSizeMB = 4 * 1024 * 1024;
    const exptensionVal = /(\.pdf)$/i;

    //verifica que los inputs esten llenos
    const requiredFields = [
        'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 'upComposicionAccionaria',
        'upFotocopiaCC', 'upRefeComerciales', 'upEstadoFinanciero', 'upCertificacionesVarias'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el) continue;

        const hasContent = el.value.trim() !== '';

        if (!hasContent) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;

            CNS.alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            CNS.alertError.show();
            toggleValidInput(el, false, 'Este campo es obligatorio.');
            el.focus();
            return false;
        }
    }

    //verifica que sean dos referencias comerciales
    const refComerc = document.getElementById('upRefeComerciales')
    if (refComerc) {
        const fileNames = refComerc.value.split(', ').filter(name => name.trim() !== '');

        if (fileNames.length < 2) {
            CNS.alertErrorBody.innerText = 'Por favor ingrese dos (2) referencias comerciales.';
            CNS.alertError.show();
            CNS.dirtyFields.add('upRefeComerciales');
            toggleValidInput(refComerc, false, 'Ingrese los dos (2) archivos.')
            refComerc.focus();
            return false;
        }
    }

    //verifica que sea dos estados financieros
    const estFinan = document.getElementById('upEstadoFinanciero')
    if (estFinan) {
        const fileNames = estFinan.value.split(', ').filter(name => name.trim() !== '');

        if (fileNames.length < 2) {
            CNS.alertErrorBody.innerText = 'Por favor ingrese los dos (2) estados financieros.';
            CNS.alertError.show();
            CNS.dirtyFields.add('upEstadoFinanciero');
            toggleValidInput(estFinan, false, 'Ingrese los dos (2) archivos.')
            estFinan.focus();
            return false;
        }
    }

    //verifica si es OEA y de ser asi verifica documentos
    if (!form.querySelector('input[name="upOEA"]:checked')) {
        CNS.alertErrorBody.innerText = 'Por favor seleccione si es Operador Económico Autorizado (OEA).';
        CNS.alertError.show();
        scrollToRadio('upOEA', 'Seleccione una opción.');
        return false;
    }

    const siOEA = document.getElementById('upOEAsi').checked;
    if (siOEA) {
        const requiredOEAFields = [
            'upContingMeMagnetico', 'upContingFirmada', 'upManifestacionSeguridad',
            'upCertifiOEA', 'upAcuerdoSeguridad'
        ];

        for (const id of requiredOEAFields) {
            const el = document.getElementById(id);
            if (!el || el.disabled || !el.required) continue;

            const hasContent = el.value.trim() !== '';
            if (!hasContent) {
                const label = document.querySelector(`label[for="${id}"]`);
                const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
                CNS.alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
                CNS.alertError.show();
                toggleValidInput(el, false, 'El campo es obligatorio.');
                el.focus();
                return false;
            }
        }
    }

    if (typeof tempFiles !== 'undefined') {
        for (const inputId in tempFiles) {
            const files = tempFiles[inputId];
            for (const file of files) {
                if (!exptensionVal.exec(file.name)) {
                    CNS.alertErrorBody.innerText = `El archivo "${file.name}" no es un PDF válido.`;
                    CNS.alertError.show();
                    return false;
                }

                if (file.size > maxSizeMB) {
                    CNS.alertErrorBody.innerText = `El archivo "${file.name}" supera el límite de 4MB.`;
                    CNS.alertError.show();
                    return false;
                }
            }
        }
    }

    return true;
}