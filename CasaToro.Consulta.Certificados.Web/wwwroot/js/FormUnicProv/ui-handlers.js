import * as CNS from './constant.js';
import * as API from './api-client.js';
import * as HUI from './helpers-ui.js';
import { toggleValidInput, isAdult } from './validators.js';

//tabla accionistas
export const controlTableBody = document.querySelector('#control-table tbody');

/** Máximo de sucursales y accionistas permitidos en persJuriForm. */
export const maxSucursales = 2;
const maxAccionistas = 4;

/**
 * Flag que indica si los formularios están siendo rellenados automáticamente
 * (loadFormData). Cuando es true, la validación IRT no actúa para evitar
 * errores falsos durante el autorellenado.
 * @type {boolean}
 */
export let isAutoFilling = false;

/** Tipos PEP del proveedor cargado, para restaurarlos al volver a marcar PEP=Sí. */
let originalPEPTypes = [];
let originalPEPEntidad = '';

/**
 * Setter para isAutoFilling. Necesario porque los ES modules exportan
 * valores por referencia solo para objetos — los primitivos requieren setter.
 * @param {boolean} value
 */
export function setAutoFilling(value) { isAutoFilling = value; }
/**
 * Guarda los tipos PEP y entidad originales del proveedor cargado.
 * Se restauran cuando el usuario vuelve a marcar pnPEP = 'Sí' después de haberlo desmarcado.
 * @param {number[]} types - Array de IDs de tipos PEP.
 * @param {string} entidad - Nombre de la entidad PEP.
 */
export function setOriginalPEP(types, entidad) {
    originalPEPTypes = types;
    originalPEPEntidad = entidad;
}

/**
 * Enlaza el select de departamento con el de ciudad para ubicaciones colombianas.
 * Al cambiar el departamento, llena las ciudades correspondientes y habilita el select.
 * @param {HTMLSelectElement} depSelect - Select de departamento.
 * @param {HTMLSelectElement} citySelect - Select de ciudad a llenar.
 * @param {Object.<string, string[]>} ciudadByDep - Diccionario dep→municipios.
 */
function handleDeptChange(depSelect, citySelect, ciudadByDep) {
    $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
        const dep = this.value.trim().toUpperCase();
        const municipios = ciudadByDep[dep] || [];
        HUI.fillSelect2(citySelect, municipios, 'Seleccione ciudad');
        citySelect.disabled = municipios.length === 0;
        document.querySelector(`label[for="${citySelect.id}"]`).classList.remove('disabled-label');
    });
}

/**
 * Habilita o deshabilita un select y sincroniza el estado visual de su label.
 * @param {HTMLSelectElement} el - Select a modificar.
 * @param {boolean} enabled - true para habilitar, false para deshabilitar.
 */
function setSelectEnable(el, enabled) {
    el.disabled = !enabled;
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) label.classList.toggle('disabled-label', !enabled);
}

/**
 * Deshabilita los selects que dependen de otros (ubicaciones, cuenta bancaria)
 * al iniciar la carga de la página para evitar selecciones inválidas.
 * Se llama una sola vez desde initSharedHandlers.
 */
export function firstBlock() {
    const selectFields = [
        pnDepExpDoc, pnCiuExpDoc, pnNacionalidad, pnEstadoNac, pnCiudadNac, pnDepRes, pnCiudadRes,
        pjCiudadDilig, pjCiudadDirPrincipal, pjRLCiuExpDoc, pjRLNacionalidad, pjRLDepartNac, pjRLCiudadNac,
        pvPorPais, pvDepartDec, pvCiudadDec, pvClasCueBan
    ];

    selectFields.forEach(sel => {
        sel.disabled = true;
        document.querySelector(`label[for="${sel.id}"]`).classList.add('disabled-label');
    });
}

/**
 * Limpia todos los inputs, selects y textareas de un formulario,
 * incluyendo radios y checkboxes. No dispara eventos de change.
 * @param {HTMLFormElement} formEl - Formulario a limpiar.
 */
export function clearForm(formEl) {
    formEl.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
    });
}

/**
 * Precarga un select de departamento con un valor, dispara el chain de ciudad
 * y espera a que las opciones del select de ciudad estén disponibles.
 * Se usa en loadFormData_Natural, loadFormData_Juridica y loadProvFormData
 * para restaurar ubicaciones guardadas en DB.
 * @param {HTMLSelectElement} depSel - Select de departamento a precargar.
 * @param {HTMLSelectElement} citySel - Select de ciudad que se llenará.
 * @param {string} value - Valor del departamento a seleccionar.
 * @param {string} triggerName - Sufijo del evento a disparar (ej: 'ubiNac').
 * @returns {Promise<void>}
 */
export async function loadDepCity(depSel, citySel, value, triggerName) {
    await setSelect2Val(depSel, value);
    $(depSel).trigger(`change.${triggerName}`);
    await waitForOptions(citySel);
}

/**
 * Espera a que un select tenga más de una opción cargada (la opción placeholder no cuenta).
 * Usa requestAnimationFrame para no bloquear el hilo principal.
 * Tiene un timeout máximo para no quedarse esperando indefinidamente.
 * @param {HTMLSelectElement} select - Select a monitorear.
 * @param {number} [timeout=800] - Tiempo máximo de espera en ms.
 * @returns {Promise<void>}
 */
export function waitForOptions(select, timeout = 800) {
    return new Promise(r => {
        const start = performance.now();

        function check() {
            if (select.options.length > 1 || performance.now() - start > timeout) {
                return r();
            }
            requestAnimationFrame(check)
        }
        check();
    });
}

/**
 * Espera a que el select tenga opciones y luego selecciona el valor indicado con select2.
 * Si el valor no existe entre las opciones, emite un warning y retorna false.
 * @param {HTMLSelectElement} select - Select donde asignar el valor.
 * @param {string} value - Valor a seleccionar.
 * @returns {Promise<boolean>} true si se asignó, false si el valor no existe.
 */
export async function setSelect2Val(select, value) {

    if (!value) return false;

    await waitForOptions(select);

    const exists = [...select.options].some(o => o.value == value);

    if (!exists) {
        console.warn(`El valor no encontrado en el select2.`, { select, value });
        return false;
    }

    $(select).val(value).trigger('change.select2');
    return true;

}

/**
 * Limpia todos los errores visuales de la validación IRT:
 * remueve clases is-invalid-custom, elementos .error-message
 * y vacía el set dirtyFields para empezar una nueva sesión de validación.
 */
export function clearValidationIRT() {
    document.querySelectorAll('.is-invalid-custom').forEach(el => el.classList.remove('is-invalid-custom'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    CNS.dirtyFields.clear();
}

/**
 * Inicializa la validación en tiempo real (IRT) para todos los campos requeridos
 * del FUCP (persNatuForm, persJuriForm, provForm y uploadDocsForm).
 * Comportamiento por tipo de campo:
 * - Radio/checkbox: valida al 'change', marca dirtyFields con el nombre del grupo.
 * - Text/select/date: valida al 'blur' (marca dirty) y al 'input' (si ya es dirty).
 * - Campos de documentos (isDocsField): no validan hasta que el panel fue visitado.
 * - Lógica especial: fechas de nacimiento (mayoría de edad), email (regex),
 *   teléfonos (intl-tel-input), direcciones (parseDirection), porcentajes (suma=100%),
 *   upRefeComerciales y upEstadoFinanciero (requieren 2 archivos).
 * - CIIU: al validar pvAcEconomica también marca válido pvCodCIIU y viceversa.
 * Se llama una sola vez desde initSharedHandlers.
 */
export function initValidationIRT() {
    //validacion de campos simples
    const requiredFields = [
        'pnPrimerApell', 'pnSegundoApell', 'pnNombres', 'pnTipoNacionalidad', 'pnTipoDoc', 'pnFechaExpDoc', 'pnDepExpDoc', 'pnCiuExpDoc', 'pnNacionalidad',
        'pnEstadoNac', 'pnCiudadNac', 'pnFechaNac', 'pnDiResidencia', 'pnDepRes', 'pnCiudadRes', 'pnEmail', 'pnTelefono', 'pnCelular', 'pnActividad',
        'pnReconoPblSi', 'pnManRePubSi', 'pnPEPSi', 'pnPEP-Nac', 'pnPEP_Entidad', 'pjRazSocial', 'pjDepartDilig', 'pjCiudadDilig', 'pjDirPrincipal',
        'pjDepartDirPrincipal', 'pjCiudadDirPrincipal', 'pjEmailDirPrincipal', 'pjTelDirPrincipal', 'pjPrimApeRL', 'pjSegApeRL', 'pjNomReLeg',
        'pjRLTipNacionalidad', 'pjRLTipoDoc', 'pjRLDocNum', 'pjRLFechExpDoc', 'pjRLDepExpDoc', 'pjRLCiuExpDoc', 'pjRLFechaNac', 'pjRLNacionalidad',
        'pjRLDepartNac', 'pjRLCiudadNac', 'pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos', 'pvPatrimonio', 'pvPorNacional', 'pvPorExtranjero', 'pvPorPais',
        'pvTipEmp', 'pvAcEconomica', 'pvCodCIIU', 'pvCapSocReg', 'pvFechConst', 'pvFechVen', 'pvGrConSi', 'pvFechResolGC', 'pvNumResolGC', 'pvDeclIndComSi',
        'pvDepartDec', 'pvCiudadDec', 'pvAutRetSi', 'pvNumResDIAN', 'pvOpeCExtSi', 'pvForPag', 'pvEntBenef', 'pvPosCuBanSi', 'pvEntidad', 'pvNumCueBanc',
        'pvClasCueBan', 'pvCeOEASi', 'pvCeCalSi', 'pvCeBASCSi', 'pvCeAmbSi', 'pvCe28000Si', 'pvCeSSTSi', 'pvTDPMotMaqSI', 'pvTDPCasTorSI', 'pvTDPBonapSI',
        'pvRadAutSI', 'pvDeAuRepresentacion', 'pvFuenteRecur', 'pvCumCSInSI', 'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 'upComposicionAccionaria',
        'upFotocopiaCC', 'upRefeComerciales', 'upEstadoFinanciero', 'upCertificacionesVarias', 'upFUCPfirmado', 'upOEAsi', 'upContingMeMagnetico',
        'upContingFirmada', 'upCertifiOEA', 'upAcuerdoSeguridad'
    ];

    const docsFieldIds = new Set([
        'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 'upComposicionAccionaria', 'upFotocopiaCC', 'upRefeComerciales', 'upEstadoFinanciero',
        'upCertificacionesVarias', 'upFUCPfirmado', 'upOEAsi', 'upContingMeMagnetico', 'upContingFirmada', 'upCertifiOEA', 'upAcuerdoSeguridad'
    ]);

    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const isDocsField = docsFieldIds.has(id);

        //para radios y checkbox valida al hacer change (no al registrar)
        if (el.type === 'radio' || el.type === 'checkbox') {
            const elName = el.name;
            const radios = document.querySelectorAll(`input[name="${elName}"]`);
            radios.forEach(r => {
                r.addEventListener('change', function () {
                    CNS.dirtyFields.add(elName);
                    const isChecked = document.querySelector(`input[name="${elName}"]:checked`);
                    toggleValidInput(el, !!isChecked, 'Seleccione una opción.');
                });
            });
            return;
        }

        //eventos 'blur' y 'change'
        const validateEvent = () => {
            if (isAutoFilling) return;
            if (!CNS.dirtyFields.has(id)) return;
            if (el.disabled || el.display === 'none') {
                toggleValidInput(el, true);
                return;
            }

            const value = el.value ? el.value.trim() : '';

            //logica especifica por tipo de campo
            if (id === 'pnFechaNac' || id === 'pjRLFechaNac') {
                const isValid = value !== '' && isAdult(value);
                toggleValidInput(el, isValid, value === '' ? 'Este campo es obligatorio.' : 'La persona debe ser mayor de edad.');
            }
            else if (id === 'pnEmail' || id === 'pjEmailDirPrincipal') {
                const isValid = CNS.regexEmail.test(value);
                toggleValidInput(el, isValid, 'Ingrese un correo valido.');
            }
            else if (el.type === 'tel') {
                const iti = CNS.telInst[id];
                const isValid = value === '' ? false : iti.isValidNumber();
                toggleValidInput(el, isValid, 'Ingrese un número de teléfono válido.');
            }
            else if (id === 'pnDiResidencia' || id === 'pjDirPrincipal' || id.includes('pjDirSucursal_')) {
                value === '' ? toggleValidInput(el, false, 'Este campo es obligatorio.') : HUI.parseDirection(el);
            }
            else if (id === 'pvPorNacional' || id === 'pvPorExtranjero') {
                if (!CNS.dirtyFields.has('pvPorNacional') && !CNS.dirtyFields.has('pvPorExtranjero')) return;

                const porcNac = parseFloat(pvPorNacional.value.trim() || 0);
                const porcExt = parseFloat(pvPorExtranjero.value.trim() || 0);

                //porcentaje nacional vacio o 0: invalido
                if (porcNac === 0 || porcNac > 100 || pvPorNacional.value.trim() === '') {
                    toggleValidInput(pvPorNacional, false, 'Porcentaje inválido.');
                    toggleValidInput(pvPorExtranjero, true);
                    return;
                }

                //porcentaje nacional es el 100%, valido y extranjero no aplica
                if (porcNac === 100) {
                    toggleValidInput(pvPorNacional, true);
                    toggleValidInput(pvPorExtranjero, true);
                    return;
                }

                // % nacional < 100, se espera porcentaje extranjero
                if (porcExt === 0 || pvPorExtranjero.value.trim() === '') {
                    toggleValidInput(pvPorNacional, true);
                    if (CNS.dirtyFields.has('pvPorExtranjero')) {
                        toggleValidInput(pvPorExtranjero, false, 'Ingrese el % extranjero.')
                    }
                    return;
                }

                const totalPorc = porcNac + porcExt;
                if (totalPorc !== 100) {
                    toggleValidInput(pvPorNacional, false, `Total: ${totalPorc}% (la suma de los dos % debe ser 100%)`);
                    toggleValidInput(pvPorExtranjero, false, `Total: ${totalPorc}% (la suma de los dos % debe ser 100%)`);
                } else {
                    toggleValidInput(pvPorNacional, true);
                    toggleValidInput(pvPorExtranjero, true);
                }
            }
            //verifica si falta docs en referencias comerciales y/o en estados finacieros
            else if (id === 'upRefeComerciales' || id === 'upEstadoFinanciero') {
                const fileNames = value.split(', ').filter(n => n.trim() !== '');
                toggleValidInput(el,
                    fileNames.length >= 2,
                    fileNames.length === 0 ? 'Este campo es obligatorio.' : 'Ingrese los dos (2) archivos.'
                );
            }
            else {
                toggleValidInput(el, value !== '', 'Este campo es obligatorio.');
            }
        };

        //'blur' -> marca como "tocado" y lo valida (excepto los panel de docs que no se han abierto o los que estan abiertos)
        el.addEventListener('blur', function () {
            if (isDocsField && !el.dataset.panelVisited) return;
            if (isDocsField && el.dataset.panelOpen) return;
            CNS.dirtyFields.add(id);
            validateEvent();
        });

        //change (select/select2) -> marca como "tocado" y valida
        $(el).on('change', function () {
            if (isAutoFilling) return;
            if (isDocsField && !el.dataset.panelVisited) return;
            CNS.dirtyFields.add(id);
            validateEvent();

            if (id === 'pvAcEconomica' || id === 'pvCodCIIU') {
                const otherId = id === 'pvAcEconomica' ? 'pvCodCIIU' : 'pvAcEconomica';
                const otherEl = document.getElementById(otherId);
                if (el.value !== '') toggleValidInput(otherEl, true);
            }
        });

        el.addEventListener('input', function () {
            if (!CNS.dirtyFields.has(id)) return;
            validateEvent();
        });
    });

    //validacion IRT en la fila existente en html
    controlTableBody.querySelectorAll('.control-row').forEach(row => initAccionistIRT(row));
}

/**
 * Llena el select de tipo de documento del form persona natural
 * según la nacionalidad seleccionada (Nacional → CC/NIT, Extranjero → CE/PAS/CAR).
 */
export function tipDocument() {
    const tipoNac = pnTipoNacionalidad.value;

    pnTipoDoc.innerHTML = '<option value="" disabled selected>Seleccione un documento</option>';

    let listTipDoc = tipoNac === 'Nacional'
        ? CNS.docNacionales : tipoNac === 'Extranjero' ? CNS.docExtranjeros : [];

    listTipDoc.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.value;
        option.textContent = doc.text;
        pnTipoDoc.appendChild(option);
    });
}

/**
 * Llena el select de tipo de documento del representante legal en persJuriForm
 * según su nacionalidad (Nacional → CC, Extranjero → CE/PAS/CAR).
 */
export function pjTipDocument() {
    const tipoNac = pjRLTipNacionalidad.value;

    pjRLTipoDoc.innerHTML = '<option value="" disabled selected>Seleccione un documento</option>';

    let listTipDoc = tipoNac === 'Nacional'
        ? CNS.pjRLDocNaci : tipoNac === 'Extranjero' ? CNS.pjRLDocExtr : [];

    listTipDoc.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.value;
        option.textContent = doc.text;
        pjRLTipoDoc.appendChild(option);
    });
}

/**
 * Registra los listeners de cascada para selects de ubicación extranjera
 * (país → estado → ciudad). Se reutiliza en ubicPNaHandler y ubicPJuReLeHandler.
 * @param {HTMLSelectElement} selPais - Select de país.
 * @param {HTMLSelectElement} selEstado - Select de estado/departamento.
 * @param {HTMLSelectElement} selCiudad - Select de ciudad.
 */
function bindExtrUbi(selPais, selEstado, selCiudad) {
    $(selPais).off('change.ubiExtrPais').on('change.ubiExtrPais', async function () {
        const states = await API.loadStates(this.value);
        HUI.fillSelect2(selEstado, states, 'Seleccione estado', 'id', 'name');
        setSelectEnable(selEstado, true);

        $(selEstado).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
            const cities = await API.loadCities(this.value);
            HUI.fillSelect2(selCiudad, cities, 'Seleccione ciudad', 'id', 'name');
            setSelectEnable(selCiudad, true);
        });
    });
}

/**
 * Configura los selects de ubicación del form persona natural según la nacionalidad.
 * - Nacional: país fijo Colombia, departamentos/ciudades colombianas para nacimiento,
 *   expedición de documento y residencia.
 * - Extranjero: lista de países extranjeros para nacimiento (con cascada estado→ciudad),
 *   departamentos/ciudades colombianas para expedición y residencia.
 * Limpia y deshabilita todos los selects dependientes antes de reconfigurar.
 * @returns {Promise<void>}
 */
export async function ubicPNaHandler() {

    const nac = pnTipoNacionalidad.value;

    $(pnNacionalidad).off('change.ubiExtrPais');
    $(pnEstadoNac).off('change.ubiNac').off('change.ubiExtrEstado');

    const selectClear = [pnNacionalidad, pnEstadoNac, pnCiudadNac, pnDepExpDoc, pnCiuExpDoc, pnDepRes, pnCiudadRes];
    selectClear.forEach(sel => {
        $(sel).empty();
        if (!isAutoFilling) {
            $(sel).prop("disabled", true);
            document.querySelector(`label[for="${sel.id}"]`).classList.add('disabled-label');
        }
    });

    if (nac === 'Nacional') {
        //pais fijo colombia
        HUI.fillSelect2(pnNacionalidad, [{ id: 'COLOMBIA', name: 'COLOMBIA' }]);

        $(pnNacionalidad).val('COLOMBIA').trigger('change.select2');
        setSelectEnable(pnNacionalidad, false);

        //carga departamentos/ciudades de colombia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

        //departamentos de nacimiento, expedicion y residencia
        [pnEstadoNac, pnDepExpDoc, pnDepRes].forEach(depSelect => {
            HUI.fillSelect2(depSelect, departamentos, 'Seleccione departamento');
            setSelectEnable(depSelect, true);
        });

        handleDeptChange(pnEstadoNac, pnCiudadNac, ciudadByDep);
        handleDeptChange(pnDepExpDoc, pnCiuExpDoc, ciudadByDep);
        handleDeptChange(pnDepRes, pnCiudadRes, ciudadByDep);

    }
    else if (nac === 'Extranjero') {

        //carga paises
        const countries = await API.loadUbiExt();

        HUI.fillSelect2(pnNacionalidad, countries, 'Seleccione país', 'id', 'name');
        setSelectEnable(pnNacionalidad, true);

        //Departamentos y ciudades colombianas para expedicion y residencia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

        [pnDepExpDoc, pnDepRes].forEach(depSelect => {
            HUI.fillSelect2(depSelect, departamentos, 'Seleccione departamento');
            setSelectEnable(depSelect, true);
        });

        handleDeptChange(pnDepExpDoc, pnCiuExpDoc, ciudadByDep);
        handleDeptChange(pnDepRes, pnCiudadRes, ciudadByDep);

        bindExtrUbi(pnNacionalidad, pnEstadoNac, pnCiudadNac);

        //Estados y ciudades para país seleccionado
        $(pnNacionalidad).off('change.ubiExtrPais').on('change.ubiExtrPais', async function () {
            const countryId = this.value;

            //estados
            const states = await API.loadStates(countryId);
            HUI.fillSelect2(pnEstadoNac, states, 'Seleccione estado', 'id', 'name');
            pnEstadoNac.disabled = false;
            document.querySelector('label[for="pnEstadoNac"]').classList.remove('disabled-label');

            //ciudades
            $(pnEstadoNac).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
                const stateId = this.value;
                const cities = await API.loadCities(stateId);
                HUI.fillSelect2(pnCiudadNac, cities, 'Seleccione ciudad', 'id', 'name');
                pnCiudadNac.disabled = false;
                document.querySelector('label[for="pnCiudadNac"]').classList.remove('disabled-label');
            });
        });
    }
}

/**
 * Muestra u oculta los campos PEP (tipos y entidad) del form persona natural.
 * Al mostrar, restaura los tipos y entidad originales cargados desde DB.
 * Al ocultar (o cuando ningún radio está marcado), limpia los campos.
 */
export function togglePEP() {
    const pnPEPYes = document.getElementById('pnPEPSi');
    const pnPEPtypeGroup = document.getElementById('pnPEPtypeGroup');
    const pnPEP_Entidad_Cont = document.getElementById('pnPEP_Entidad_Container');
    const pnPEP_Entidad = document.getElementById('pnPEP_Entidad');
    const pnPEPChk = document.querySelectorAll('input[name="pnPEPType"]');

    if (pnPEPYes && pnPEPYes.checked) {
        pnPEPtypeGroup.style.display = 'block';
        pnPEP_Entidad_Cont.style.display = 'block';

        pnPEPChk.forEach(chk => chk.checked = originalPEPTypes.includes(parseInt(chk.value)));
        pnPEP_Entidad.value = originalPEPEntidad || '';

    } else {
        pnPEPtypeGroup.style.display = 'none';
        pnPEP_Entidad_Cont.style.display = 'none';

        pnPEPChk.forEach(chk => chk.checked = false);
        pnPEP_Entidad.value = '';
    }
}

/**
 * Configura los selects de diligenciamiento y dirección principal de persJuriForm.
 * Siempre usa ubicaciones colombianas (departamento → ciudad).
 * @returns {Promise<void>}
 */
export async function ubicPJuHandler() {
    //asegura que los datos de ubicacion colombiana esten cargados
    await API.loadUbiData();

    //datos de ubicacion colombiana
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

    //limpia selects y los deshabilita si no es autorellenado del representante legal
    const selectClear = [pjDepartDilig, pjCiudadDilig, pjDepartDirPrincipal, pjCiudadDirPrincipal];
    selectClear.forEach(sel => {
        const $sel = $(sel);
        $sel.val(null).trigger('change.select2');
        $sel.empty();
        if (!isAutoFilling) setSelectEnable(sel, false);
    });

    //departamento y ciudad de diligenciamiento
    HUI.fillSelect2(pjDepartDilig, ubi_Departamentos, 'Seleccione departamento');
    setSelectEnable(pjDepartDilig, true);
    handleDeptChange(pjDepartDilig, pjCiudadDilig, ciudadByDep);

    //departamento y ciudad direccion principal
    HUI.fillSelect2(pjDepartDirPrincipal, ubi_Departamentos, 'Seleccione departamento');
    setSelectEnable(pjDepartDirPrincipal, true);
    handleDeptChange(pjDepartDirPrincipal, pjCiudadDirPrincipal, ciudadByDep);

}

/**
 * Configura los selects de ubicación del representante legal en persJuriForm.
 * - Expedición de documento: siempre colombiana.
 * - Nacimiento: colombiana si Nacional, extranjera con cascada si Extranjero.
 * @returns {Promise<void>}
 */
export async function ubicPJuReLeHandler() {
    //asegura que los datos de ubicacion colombiana esten cargados
    await API.loadUbiData();

    //limpia selects y los deshabilita si no es autorellenado del representante legal
    const selectClearRL = [pjRLNacionalidad, pjRLDepartNac, pjRLCiudadNac, pjRLDepExpDoc, pjRLCiuExpDoc];
    selectClearRL.forEach(sel => {
        const $sel = $(sel);
        $sel.val(null).trigger('change.select2');
        $sel.empty();
        if (!isAutoFilling) setSelectEnable(sel, false);
    });

    //datos de ubicacion colombiana
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

    //departamento y ciudad expedicion documento representante legal
    HUI.fillSelect2(pjRLDepExpDoc, ubi_Departamentos, 'Seleccione departamento');
    setSelectEnable(pjRLDepExpDoc, true);
    handleDeptChange(pjRLDepExpDoc, pjRLCiuExpDoc, ciudadByDep);

    //ubicacion nacimiento de representante legal
    const nac = pjRLTipNacionalidad.value;
    if (nac === 'Nacional') {
        //pais fijo colombia
        HUI.fillSelect2(pjRLNacionalidad, [{ id: 'COLOMBIA', name: 'COLOMBIA' }]);
        $(pjRLNacionalidad).val('COLOMBIA').trigger('change.select2');
        setSelectEnable(pjRLNacionalidad, false);

        //depatamento y ciudad colombianos
        HUI.fillSelect2(pjRLDepartNac, ubi_Departamentos, 'Seleccione departamento');
        setSelectEnable(pjRLDepartNac, true);

        handleDeptChange(pjRLDepartNac, pjRLCiudadNac, ciudadByDep);
    }
    else if (nac === 'Extranjero') {
        //carga paises
        const countries = await API.loadUbiExt();
        HUI.fillSelect2(pjRLNacionalidad, countries, 'Seleccione país', 'id', 'name');
        setSelectEnable(pjRLNacionalidad, true);

        bindExtrUbi(pjRLNacionalidad, pjRLDepartNac, pjRLCiudadNac);
    }
}

/**
 * Configura los selects de ubicación del provForm (Información Financiera).
 * - País de porcentaje extranjero: lista de países sin Colombia.
 * - Departamento y ciudad de declaración: ubicación colombiana.
 * Si es autorellenado, no limpia los selects de actividad económica, CIIU y entidad.
 * @returns {Promise<void>}
 */
export async function ubicProvFormHandler() {

    //si es autorellenado no limpia los selects de ubicacion, actividad economica y codigo CIIU
    if (!isAutoFilling) {
        [pvPorPais, pvDepartDec, pvCiudadDec].forEach(sel => {
            $(sel).empty();
            setSelectEnable(sel, false);
        });
    } else {
        [pvAcEconomica, pvCodCIIU, pvEntidad].forEach(sel => {
            CNS.dirtyFields.delete(sel.id);
            $(sel).val(null).trigger('change');
        });
    }

    //carga pais extranjero de porcentaje origen de capital
    const countries = await API.loadUbiExt();
    HUI.fillSelect2(pvPorPais, countries, 'Seleccione país', 'id', 'name');
    setSelectEnable(pvPorPais, true);

    //carga departamento y ciudad de declaracion
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

    HUI.fillSelect2(pvDepartDec, departamentos, 'Seleccione departamento');
    setSelectEnable(pvDepartDec, true);

    if (!pvDepartDec.value) setSelectEnable(pvCiudadDec, false);

    $(pvDepartDec).off('change.ubiNac').on('change.ubiNac', function () {
        const selectedDep = this.value.trim().toUpperCase();
        const municipios = ciudadByDep[selectedDep] || [];

        HUI.fillSelect2(pvCiudadDec, municipios, 'Seleccione ciudad');
        setSelectEnable(pvCiudadDec, municipios.length > 0);
    });

    if (isAutoFilling && pvDepartDec.value) {
        $(pvDepartDec).trigger('change.ubiNac');
    }

    togglePvPais();
    togglePvDIC();
}

/**
 * Habilita/deshabilita los campos de porcentaje extranjero y país de origen de capital
 * según el valor de pvPorNacional.
 * - Si pvPorNacional < 100: habilita pvPorExtranjero.
 * - Si pvPorExtranjero tiene valor: habilita pvPorPais.
 * - Si no: limpia y deshabilita los campos dependientes.
 */
export function togglePvPais() {
    const hasNaVal = parseFloat(pvPorNacional.value.trim() || 0);
    const needExt = hasNaVal > 0 && hasNaVal < 100;

    pvPorExtranjero.classList.toggle('no-edit', !needExt);
    document.querySelector(`label[for="pvPorExtranjero"]`).classList.toggle('disabled-label', !needExt);

    if (!needExt) {
        pvPorExtranjero.value = '';
        CNS.hasValue();
        CNS.dirtyFields.delete('pvPorExtranjero');
        toggleValidInput(pvPorExtranjero, true);
    } 

    const hasVal = pvPorExtranjero.value.trim().length > 0;
    $(pvPorPais).prop('disabled', !hasVal).trigger('change.select2');
    document.querySelector(`label[for="pvPorPais"]`).classList.toggle('disabled-label', !hasVal);
    if (!hasVal) {
        CNS.dirtyFields.delete('pvPorPais');
        $(pvPorPais).val(null).trigger('change.select2');
        toggleValidInput(pvPorPais, true);
    }
}

/**
 * Helper genérico que habilita o deshabilita un grupo de campos dependientes en provForm.
 * Al deshabilitar: limpia el valor, agrega clase no-edit/disabled-label, quita required
 * y marca el campo como válido (para no bloquear el submit).
 * Al habilitar: revierte todo lo anterior.
 * @param {boolean} show - true para habilitar, false para deshabilitar.
 * @param {Array<{id: string, type?: 'input'|'select'}>} fields - Campos a gestionar.
 */
function tDependentFields(show, fields) {
    fields.forEach(({ id, type = 'input' }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const label = document.querySelector(`label[for="${id}"]`);

        if (show) {
            if (type === 'select') {
                $(el).prop('disabled', false).trigger('change.select2');
            } else {
                el.classList.remove('no-edit');
            }
            label?.classList.remove('disabled-label');
            el.required = true;
            CNS.dirtyFields.delete(id);
            toggleValidInput(el, true);
        } else {
            if (type === 'select') {
                $(el).prop('disabled', true).val(null).trigger('change.select2');
            } else {
                el.value = '';
                el.classList.add('no-edit');
            }
            label?.classList.add('disabled-label');
            el.required = false;
            CNS.dirtyFields.delete(id);
            toggleValidInput(el, true);
        }
    });
    CNS.hasValue();
}
/** Habilita/deshabilita campos de resolución Gran Contribuyente en provForm. */
export function togglePvGC() {
    tDependentFields(
        document.getElementById('pvGrConSi').checked,
        [{ id: 'pvFechResolGC' }, { id: 'pvNumResolGC' }]
    );
}
/** Habilita/deshabilita campos de departamento y ciudad de declaración ICA en provForm. */
export function togglePvDIC() {
    tDependentFields(
        document.getElementById('pvDeclIndComSi').checked,
        [{ id: 'pvDepartDec', type: 'select' }, { id: 'pvCiudadDec', type: 'select' }]
    );
}
/** Habilita/deshabilita campo de número de resolución DIAN (autoretenedor) en provForm. */
export function togglePvAR() {
    tDependentFields(
        document.getElementById('pvAutRetSi').checked,
        [{ id: 'pvNumResDIAN' }]
    );
}
/** Habilita/deshabilita campos de forma de pago y beneficiados de comercio exterior en provForm. */
export function togglePvCoEx() {
    tDependentFields(
        document.getElementById('pvOpeCExtSi').checked,
        [{ id: 'pvForPag' }, { id: 'pvEntBenef' }]
    );
}
/** Habilita/deshabilita campos de cuenta bancaria (entidad, número, clase) en provForm. */
export function togglePvCB() {
    tDependentFields(
        document.getElementById('pvPosCuBanSi').checked,
        [
            { id: 'pvNumCueBanc' },
            { id: 'pvEntidad', type: 'select' },
            { id: 'pvClasCueBan', type: 'select' }
        ]
    );
}

/**
 * Inicializa los selects de departamento y ciudad de una sucursal específica.
 * Se expone en window para ser llamada desde addSucursalInternal y loadFormData_Juridica.
 * Requiere que loadUbiData haya sido llamada previamente (datos en window.ubi_*).
 * @param {number} index - Índice de la sucursal (1-based).
 */
window.initSucursalUbic = async function (index) {
    //asegura que los datos de ubicacion colombiana esten cargados
    await API.loadUbiData();

    const depSelect = document.getElementById(`pjDepartDirSucursal_${index}`);
    const citySelect = document.getElementById(`pjCiudadDirSucursal_${index}`);
    if (!depSelect || !citySelect) return;

    HUI.fillSelect2(depSelect, ubi_Departamentos, 'Seleccione departamento');
    depSelect.disabled = false;

    $(depSelect).off('change.ubiSUC').on('change.ubiSUC', function () {
        const dep = this.value.trim().toUpperCase();
        const municipios = ubi_CiudadByDep[dep] || [];
        HUI.fillSelect2(citySelect, municipios);
        citySelect.disabled = municipios.length === 0;
    });
};
/**
 * Agrega una nueva sucursal al contenedor de sucursales de persJuriForm.
 * Respeta el límite de maxSucursales. Inicializa el teléfono con intl-tel-input,
 * los selects de ubicación y la validación IRT para los campos de la nueva sucursal.
 * @param {number} [newIndex] - No se usa como parámetro real; se calcula internamente.
 */
export function addSucursalInternal(newIndex) {
    const sucursalesContainer = document.getElementById('sucursales-container');
    const currentSucursales = sucursalesContainer.querySelectorAll('.sucursal-item').length;
    newIndex = currentSucursales + 1;

    if (newIndex > maxSucursales) {
        CNS.alertBody.innerText = `Máximo ${maxSucursales} sucursales permitidas.`;
        CNS.alert.show();
        return;
    }

    const newSucursalDiv = document.createElement('div');
    newSucursalDiv.className = 'sucursal-item m-2 p-2';
    newSucursalDiv.id = `sucursal_${newIndex}`;
    newSucursalDiv.innerHTML = `
                    <h4>Dirección sucursal ${newIndex}</h4>
                    <div class="field-group">
                        <div class="col-md-5 input-wrapper">
                            <input type="text" id="pjDirSucursal_${newIndex}" name="pjDirSucursal_${newIndex}" class="form-control" autocomplete="new-password" required />
                            <label for="pjDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="Dirección Sucursal *" alt="Dirección Sucursal *"></label>
                        </div>
                        <div class="col-md-3 custom-input-group">
                            <label for="pjDepartDirSucursal_${newIndex}" class="form-label">Departamento *</label>
                            <select id="pjDepartDirSucursal_${newIndex}" name="pjDepartDirSucursal_${newIndex}" class="form-control" required></select>
                        </div>
                        <div class="col-md-3 custom-input-group">
                            <label for="pjCiudadDirSucursal_${newIndex}" class="form-label">Ciudad *</label>
                            <select id="pjCiudadDirSucursal_${newIndex}" name="pjCiudadDirSucursal_${newIndex}" class="form-control" required></select>
                        </div>
                    </div>
                    <div class="field-group">
                        <div class="col-md-4 input-wrapper">
                            <input type="email" id="pjEmailDirSucursal_${newIndex}" name="pjEmailDirSucursal_${newIndex}" class="form-control" autocomplete="new-password" required />
                            <label for="pjEmailDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="E-mail *" alt="E-mail *"></label>
                        </div>
                        <div class="col-md-4 input-wrapper">
                            <input type="tel" id="pjTelDirSucursal_${newIndex}" name="pjTelDirSucursal_${newIndex}" class="form-control" autocomplete="new-password" required />
                            <label for="pjTelDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="Teléfono *" alt="Teléfono *"></label>
                        </div>
                        <div class="col-md-3">
                            <button type="button" class="remove-sucursal-btn button-group btn btn-primary">Remover</button>
                        </div>
                    </div>
                `;

    sucursalesContainer.appendChild(newSucursalDiv);

    const newTelInput = document.getElementById(`pjTelDirSucursal_${newIndex}`);
    HUI.initTelInputs(newTelInput, false);

    if (newIndex && newIndex.telefono) {
        CNS.telInst[`pjTelDirSucursal_${newIndex}`].setNumber(newIndex.telefono);
    }

    //inicializa los selects de ubicacion para la nueva sucursal
    window.initSucursalUbic(newIndex);

    initSucursalIRT(newIndex);
}
/**
 * Registra la validación IRT para los campos de una sucursal específica.
 * Usa sets dirty locales por sucursal para no interferir con el set global.
 * @param {number} index - Índice de la sucursal.
 */
function initSucursalIRT(index) {
    const textFields = [
        {
            id: `pjDirSucursal_${index}`, validate: (el, val) => {
                val === '' ? toggleValidInput(el, false, 'Este campo es obligatorio.') : HUI.parseDirection(el);
            }
        },
        {
            id: `pjEmailDirSucursal_${index}`, validate: (el, val) => {
                const ok = val !== '' && CNS.regexEmail.test(val);
                toggleValidInput(el, ok, val === '' ? 'Este campo es obligatorio.' : 'Ingrese un correo válido.');
            }
        },
        {
            id: `pjTelDirSucursal_${index}`, validate: (el, val) => {
                const iti = CNS.telInst[`pjTelDirSucursal_${index}`];
                const ok = val !== '' && iti && iti.isValidNumber();
                toggleValidInput(el, ok, val === '' ? 'Este campo es obligatorio.' : 'Ingrese un teléfono válido.')
            }
        }
    ];

    textFields.forEach(({ id, validate }) => {
        const el = document.getElementById(id);
        if (!el) return;

        const dirty = new Set();

        const run = () => {
            if (!dirty.has(id)) return;
            validate(el, el.value.trim());
        };

        el.addEventListener('blur', () => { dirty.add(id); run(); });
        el.addEventListener('input', () => { if (dirty.has(id)) run(); });
    });

    const selectFields = [
        `pjDepartDirSucursal_${index}`,
        `pjCiudadDirSucursal_${index}`
    ];

    selectFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const dirty = new Set();

        $(el).on('change', function () {
            dirty.add(id);
            toggleValidInput(el, el.value !== '', 'Este campo es obligatorio.');
        });
    });
}

/**
 * Agrega una nueva fila a la tabla de accionistas de persJuriForm.
 * Respeta el límite de maxAccionistas. Registra la validación IRT para la nueva fila.
 * @param {number} [newIndex] - No se usa como parámetro real; se calcula internamente.
 */
export function addControlRow(newIndex) {
    const currencyAccionistas = controlTableBody.querySelectorAll('.control-row').length;
    newIndex = currencyAccionistas + 1;

    if (newIndex > maxAccionistas) {
        CNS.alertBody.innerText = `Máximo ${maxAccionistas} accionistas permitidos.`;
        CNS.alert.show();
        return;
    }

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
                    <td><button type="button" class="remove-control-row button-group btn btn-primary">X</button></td>
                `;
    controlTableBody.appendChild(newRow);

    initAccionistIRT(newRow);
}
/**
 * Registra la validación IRT para una fila de accionistas.
 * Valida razón social, tipo de ID, número de ID y porcentaje.
 * El porcentaje valida mínimo 5% individual y suma global = 100%
 * solo cuando todas las filas tienen valor ingresado.
 * @param {HTMLTableRowElement} row - Fila de la tabla de accionistas.
 */
function initAccionistIRT(row) {
    //validacion en tiempo real para tabla de accionistas
    function validateTotalPorcentaje() {
        const allRows = document.querySelectorAll('#control-table tbody .control-row');
        let total = 0;
        let allFilled = true;

        allRows.forEach(r => {
            const inp = r.querySelector('[name="controlPorcentaje[]"]');
            if (!inp) return;
            const val = parseFloat(inp.value.trim() || 0);
            if (inp.value.trim() === '' || val <= 0) { allFilled = false; return; }
            total += val;
        });

        if (!allFilled) return;

        allRows.forEach(r => {
            const inp = r.querySelector('[name="controlPorcentaje[]"]');
            if (!inp || inp.value.trim() === '') return;
            const val = parseFloat(inp.value.trim() || 0);
            if (val < 5) return;
            if (total !== 100) {
                toggleValidInput(inp, false, `Total: ${total.toFixed(2)}% (debe ser 100%).`);
            } else {
                toggleValidInput(inp, true);
            }
        });
    }

    // Razon social
    const elRaz = row.querySelector('[name="controlRazonSocial[]"]');
    if (elRaz) {
        let dirty = false;
        const validate = () => toggleValidInput(elRaz, elRaz.value.trim() !== '', 'Este campo es obligatorio.');
        elRaz.addEventListener('blur', () => { dirty = true; validate(); });
        elRaz.addEventListener('input', () => { if (dirty) validate(); });
    }

    // Tipo de identificacion
    const elType = row.querySelector('[name="controlIdType[]"]');
    if (elType) {
        let dirty = false;
        const validate = () => toggleValidInput(elType, elType.value !== '', 'Seleccione un tipo.');
        elType.addEventListener('change', () => { dirty = true; validate(); });
        elType.addEventListener('blur', () => { dirty = true; validate(); });
    }

    // Numero de identificacion
    const elIdNum = row.querySelector('[name="controlIdNum[]"]');
    if (elIdNum) {
        let dirty = false;
        const validate = () => toggleValidInput(elIdNum, elIdNum.value.trim() !== '', 'Este campo es obligatorio.');
        elIdNum.addEventListener('blur', () => { dirty = true; validate(); });
        elIdNum.addEventListener('input', () => { if (dirty) validate(); });
    }

    // Porcentaje: minimo 5% individual + total global = 100%
    const elPorc = row.querySelector('[name="controlPorcentaje[]"]');
    if (elPorc) {
        let dirty = false;
        const validate = () => {
            const val = parseFloat(elPorc.value.trim() || 0);
            if (elPorc.value.trim() === '' || isNaN(val) || val <= 0) {
                toggleValidInput(elPorc, false, 'Ingrese un porcentaje válido.');
            } else if (val < 5) {
                toggleValidInput(elPorc, false, 'El porcentaje mínimo es 5%.');
            } else {
                toggleValidInput(elPorc, true);
                validateTotalPorcentaje();
            }
        };
        elPorc.addEventListener('blur', () => { dirty = true; validate(); });
        elPorc.addEventListener('input', () => { if (dirty) validate(); });
    }
}

/**
 * Muestra u oculta la sección de documentos adicionales OEA (Operador Económico Autorizado).
 * Al ocultar, limpia y desmarca los inputs del panel OEA.
 */
export function toggleOEA() {
    const si = document.getElementById('upOEAsi').checked;
    const containerYesOEA = document.getElementById('sectionYesOEA');
    if (si) {
        containerYesOEA.style.display = 'block';
        containerYesOEA.querySelectorAll('input').forEach(i => i.required = true);
    } else {
        containerYesOEA.style.display = 'none';
        containerYesOEA.querySelectorAll('input').forEach(i => {
            i.value = '';
            i.required = false;
            i.classList.remove('file-existing');
        });
    }
}

/**
 * Muestra el iframe de visualización del FUCP en PDF o lo oculta.
 * Agrega un timestamp a la URL para forzar recarga y evitar caché del navegador.
 * @param {string|null} url - URL relativa del PDF generado, o null para ocultar el panel.
 */
export function printFormatHandler(url) {
    const printFormatForm = document.getElementById('printFormatForm');
    const iframe = document.getElementById('printFrame');

    if (url) {
        iframe.src = `${url}?t=${new Date().getTime()}`;

        printFormatForm.style.display = 'flex';
    } else {
        iframe.src = '';
        printFormatForm.style.display = 'none';
    }
}