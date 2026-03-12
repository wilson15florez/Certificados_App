import * as Constant from './constant.js';
import * as API from './api-client.js';
import * as HUI from './helpers-ui.js';
import * as LD from './loader.js';
import { toggleValidInput, isAdult } from './validators.js';

export const controlTableBody = document.querySelector('#control-table tbody');
export const maxSucursales = 2;
const maxAccionistas = 4;
export let isAutoFilling = false;
let originalPEPTypes = [];
let originalPEPEntidad = '';
export let filePaths = {};

//setters para variables de estado de modulo (ES imports son read-only)
export function setAutoFilling(value) { isAutoFilling = value; }
export function setOriginalPEP(types, entidad) {
    originalPEPTypes = types;
    originalPEPEntidad = entidad;
}

//funcion para enlazar select2 de departamento con el de ciudad para las ubicaciones colombianas
function handleDeptChange(depSelect, citySelect, ciudadByDep) {
    $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
        const dep = this.value.trim().toUpperCase();
        const municipios = ciudadByDep[dep] || [];
        fillSelect2(citySelect, municipios, 'Seleccione ciudad');
        citySelect.disabled = municipios.length === 0;
        document.querySelector(`label[for="${citySelect.id}"]`).classList.remove('disabled-label');
    });
}

//funcion para bloquear los selects al iniciar la carga de la pagina (forms persona natural, juridica e informacion financiera)
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

//limpia todos los inputs, select y textarea de un form
export function clearForm(formEl) {
    formEl.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
    });
}

//habilita o deshabilita un select y sincroniza su label
function setSelectEnable(el, enabled) {
    el.disabled = !enabled;
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) label.classList.toggle('disabled-label', !enabled);
}

//precarga un select de departamento, dispara el chain y espera ciudades
export async function loadDepCity(depSel, citySel, value, triggerName) {
    await setSelect2Val(depSel, value);
    $(depSel).trigger(`change.${triggerName}`);
    await waitForOptions(citySel);
}

//funcion que espera a que select2 tenga opciones cargadas
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

//funcion para llenar select2
export function fillSelect2(select, data, placeholder = 'Seleccione', valueField = 'id', textField = 'name') {
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

//logica para animacion visual de labels
export function hasValue() {
    document.querySelectorAll('.form-control').forEach(input => {
        // Verificar al cargar la página (por si hay valores previos)
        if (input.value.trim() !== "") {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }

        // Escuchar cuando el usuario interactúa
        input.addEventListener('change', () => {
            if (input.value.trim() !== "") {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
}

//limpia todos los errores visuales de validacion IRT
export function clearValidationIRT() {
    document.querySelectorAll('.is-invalid-custom').forEach(el => el.classList.remove('is-invalid-custom'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    Constant.dirtyFields.clear();
}

//logica que asigna la validacion de campos
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
        'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 'upComposicionAccionaria',
        'upFotocopiaCC', 'upRefeComerciales', 'upEstadoFinanciero', 'upCertificacionesVarias',
        'upFUCPfirmado', 'upOEAsi', 'upContingMeMagnetico', 'upContingFirmada', 'upCertifiOEA',
        'upAcuerdoSeguridad'
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
                    Constant.dirtyFields.add(elName);
                    const isChecked = document.querySelector(`input[name="${elName}"]:checked`);
                    toggleValidInput(el, !!isChecked, 'Seleccione una opción.');
                });
            });
            return;
        }

        //eventos 'blur' y 'change'
        const validateEvent = () => {
            if (isAutoFilling) return;
            if (!Constant.dirtyFields.has(id)) return;
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
                const isValid = Constant.regexEmail.test(value);
                toggleValidInput(el, isValid, 'Ingrese un correo valido.');
            }
            else if (el.type === 'tel') {
                const iti = Constant.telInst[id];
                const isValid = value === '' ? false : iti.isValidNumber();
                toggleValidInput(el, isValid, 'Ingrese un número de teléfono válido.');
            }
            else if (id === 'pnDiResidencia' || id === 'pjDirPrincipal' || id.includes('pjDirSucursal_')) {
                value === '' ? toggleValidInput(el, false, 'Este campo es obligatorio.') : HUI.parseDirection(el);
            }
            else if (id === 'pvPorNacional' || id === 'pvPorExtranjero') {
                if (!Constant.dirtyFields.has('pvPorNacional') && !Constant.dirtyFields.has('pvPorExtranjero')) return;

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
                    if (Constant.dirtyFields.has('pvPorExtranjero')) {
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
            Constant.dirtyFields.add(id);
            validateEvent();
        });

        //change (select/select2) -> marca como "tocado" y valida
        $(el).on('change', function () {
            if (isAutoFilling) return;
            if (isDocsField && !el.dataset.panelVisited) return;
            Constant.dirtyFields.add(id);
            validateEvent();

            if (id === 'pvAcEconomica' || id === 'pvCodCIIU') {
                const otherId = id === 'pvAcEconomica' ? 'pvCodCIIU' : 'pvAcEconomica';
                const otherEl = document.getElementById(otherId);
                if (el.value !== '') toggleValidInput(otherEl, true);
            }
        });

        el.addEventListener('input', function () {
            if (!Constant.dirtyFields.has(id)) return;
            validateEvent();
        });
    });

    //validacion IRT en la fila existente en html
    controlTableBody.querySelectorAll('.control-row').forEach(row => initAccionistIRT(row));
}

//funcion que identifica tipo de nacionalidad en form persona natural
export function tipDocument() {
    const tipoNac = pnTipoNacionalidad.value;

    pnTipoDoc.innerHTML = '<option value="" disabled selected>Seleccione un documento</option>';

    let listTipDoc = tipoNac === 'Nacional'
        ? Constant.docNacionales
        : tipoNac === 'Extranjero'
            ? Constant.docExtranjeros
            : [];

    listTipDoc.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.value;
        option.textContent = doc.text;
        pnTipoDoc.appendChild(option);
    });
}

//funcion que identifica tipo de nacionalidad en representante legal de form persona juridica
export function pjTipDocument() {
    const tipoNac = pjRLTipNacionalidad.value;

    pjRLTipoDoc.innerHTML = '<option value="" disabled selected>Seleccione un documento</option>';

    let listTipDoc = tipoNac === 'Nacional'
        ? Constant.pjRLDocNaci
        : tipoNac === 'Extranjero'
            ? Constant.pjRLDocExtr
            : [];

    listTipDoc.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.value;
        option.textContent = doc.text;
        pjRLTipoDoc.appendChild(option);
    });
}

//funcion que gestiona los select de persona natural y enlaza los listener de ubi extranjera
function bindExtrUbi(selPais, selEstado, selCiudad) {
    $(selPais).off('change.ubiExtrPais').on('change.ubiExtrPais', async function () {
        const states = await API.loadStates(this.value);
        fillSelect2(selEstado, states, 'Seleccione estado', 'id', 'name');
        setSelectEnabled(selEstado, true);

        $(selEstado).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
            const cities = await API.loadCities(this.value);
            fillSelect2(selCiudad, cities, 'Seleccione ciudad', 'id', 'name');
            setSelectEnabled(selCiudad, true);
        });
    });
}

//funcion que gestiona los select de ubicacion de persona natural
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
        fillSelect2(pnNacionalidad, [{ id: 'COLOMBIA', name: 'COLOMBIA' }]);

        $(pnNacionalidad).val('COLOMBIA').trigger('change.select2');
        setSelectEnable(pnNacionalidad, false);

        //carga departamentos/ciudades de colombia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

        //departamentos de nacimiento, expedicion y residencia
        [pnEstadoNac, pnDepExpDoc, pnDepRes].forEach(depSelect => {
            fillSelect2(depSelect, departamentos, 'Seleccione departamento');
            setSelectEnable(depSelect, true);
        });

        handleDeptChange(pnEstadoNac, pnCiudadNac, ciudadByDep);
        handleDeptChange(pnDepExpDoc, pnCiuExpDoc, ciudadByDep);
        handleDeptChange(pnDepRes, pnCiudadRes, ciudadByDep);

    }
    else if (nac === 'Extranjero') {

        //carga paises
        const countries = await API.loadUbiExt();

        fillSelect2(pnNacionalidad, countries, 'Seleccione país', 'id', 'name');
        setSelectEnable(pnNacionalidad, true);

        //Departamentos y ciudades colombianas para expedicion y residencia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

        [pnDepExpDoc, pnDepRes].forEach(depSelect => {
            fillSelect2(depSelect, departamentos, 'Seleccione departamento');
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
            fillSelect2(pnEstadoNac, states, 'Seleccione estado', 'id', 'name');
            pnEstadoNac.disabled = false;
            document.querySelector('label[for="pnEstadoNac"]').classList.remove('disabled-label');

            //ciudades
            $(pnEstadoNac).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
                const stateId = this.value;
                const cities = await API.loadCities(stateId);
                fillSelect2(pnCiudadNac, cities, 'Seleccione ciudad', 'id', 'name');
                pnCiudadNac.disabled = false;
                document.querySelector('label[for="pnCiudadNac"]').classList.remove('disabled-label');
            });
        });
    }
}

//logica para mostrar/ocultar campos relacionados con PEP en el form de persona natural
export function handlePEPChange() {
    const pnPEPYes = document.getElementById('pnPEPSi');
    const pnPEPNo = document.getElementById('pnPEPNo');
    const pnPEPtypeGroup = document.getElementById('pnPEPtypeGroup');
    const pnPEP_Entidad_Cont = document.getElementById('pnPEP_Entidad_Container');
    const pnPEP_Entidad = document.getElementById('pnPEP_Entidad');
    const pnPEPChk = document.querySelectorAll('input[name="pnPEPType"]');

    if (pnPEPYes && pnPEPYes.checked) {
        pnPEPtypeGroup.style.display = 'block';
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

//funcion que gestiona los select de ubicacion de persona juridica (diligenciamiento, direccion principal)
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
    fillSelect2(pjDepartDilig, ubi_Departamentos, 'Seleccione departamento');
    setSelectEnable(pjDepartDilig, true);
    handleDeptChange(pjDepartDilig, pjCiudadDilig, ciudadByDep);

    //departamento y ciudad direccion principal
    fillSelect2(pjDepartDirPrincipal, ubi_Departamentos, 'Seleccione departamento');
    setSelectEnable(pjDepartDirPrincipal, true);
    handleDeptChange(pjDepartDirPrincipal, pjCiudadDirPrincipal, ciudadByDep);

}

//funcion que gestiona los select de ubicacion del representante legal de persona juridica
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
    fillSelect2(pjRLDepExpDoc, ubi_Departamentos, 'Seleccione departamento');
    setSelectEnable(pjRLDepExpDoc, true);
    handleDeptChange(pjRLDepExpDoc, pjRLCiuExpDoc, ciudadByDep);

    //ubicacion nacimiento de representante legal
    const nac = pjRLTipNacionalidad.value;
    if (nac === 'Nacional') {
        //pais fijo colombia
        fillSelect2(pjRLNacionalidad, [{ id: 'COLOMBIA', name: 'COLOMBIA' }]);
        $(pjRLNacionalidad).val('COLOMBIA').trigger('change.select2');
        setSelectEnable(pjRLNacionalidad, false);

        //depatamento y ciudad colombianos
        fillSelect2(pjRLDepartNac, ubi_Departamentos, 'Seleccione departamento');
        setSelectEnable(pjRLDepartNac, true);

        handleDeptChange(pjRLDepartNac, pjRLCiudadNac, ciudadByDep);
    }
    else if (nac === 'Extranjero') {
        //carga paises
        const countries = await API.loadUbiExt();
        fillSelect2(pjRLNacionalidad, countries, 'Seleccione país', 'id', 'name');
        setSelectEnable(pjRLNacionalidad, true);

        bindExtrUbi(pjRLNacionalidad, pjRLDepartNac, pjRLCiudadNac);
    }
}

//funcion que gestiona los select de ubicacion del provForm (Informacion Financiera)
export async function ubicProvFormHandler() {

    //si es autorellenado no limpia los selects de ubicacion, actividad economica y codigo CIIU
    if (!isAutoFilling) {
        [pvPorPais, pvDepartDec, pvCiudadDec].forEach(sel => {
            $(sel).empty();
            setSelectEnable(sel, false);
        });
    } else {
        [pvAcEconomica, pvCodCIIU, pvEntidad].forEach(sel => {
            Constant.dirtyFields.delete(sel.id);
            $(sel).val(null).trigger('change');
        });
    }

    //carga pais extranjero de porcentaje origen de capital
    const countries = await API.loadUbiExt();
    fillSelect2(pvPorPais, countries, 'Seleccione país', 'id', 'name');
    setSelectEnable(pvPorPais, true);

    //carga departamento y ciudad de declaracion
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

    fillSelect2(pvDepartDec, departamentos, 'Seleccione departamento');
    setSelectEnable(pvDepartDec, true);

    if (!pvDepartDec.value) setSelectEnable(pvCiudadDec, false);

    $(pvDepartDec).off('change.ubiNac').on('change.ubiNac', function () {
        const selectedDep = this.value.trim().toUpperCase();
        const municipios = ciudadByDep[selectedDep] || [];

        fillSelect2(pvCiudadDec, municipios, 'Seleccione ciudad');
        setSelectEnable(pvCiudadDec, municipios.length > 0);
    });

    if (isAutoFilling && pvDepartDec.value) {
        $(pvDepartDec).trigger('change.ubiNac');
    }

    togglePvPais();
    togglePvDIC();
}

//logica que habilita porcentaje extranjero y pais del form Informacion Financiera (provForm)
export function togglePvPais() {
    const hasNaVal = parseFloat(pvPorNacional.value.trim() || 0);
    const needExt = hasNaVal > 0 && hasNaVal < 100;

    pvPorExtranjero.classList.toggle('no-edit', !needExt);
    document.querySelector(`label[for="pvPorExtranjero"]`).classList.toggle('disabled-label', !needExt);

    if (!needExt) {
        pvPorExtranjero.value = '';
        hasValue();
        Constant.dirtyFields.delete('pvPorExtranjero');
        toggleValidInput(pvPorExtranjero, true);
    } 

    const hasVal = pvPorExtranjero.value.trim().length > 0;
    $(pvPorPais).prop('disabled', !hasVal).trigger('change.select2');
    document.querySelector(`label[for="pvPorPais"]`).classList.toggle('disabled-label', !hasVal);
    if (!hasVal) {
        Constant.dirtyFields.delete('pvPorPais');
        $(pvPorPais).val(null).trigger('change.select2');
        toggleValidInput(pvPorPais, true);
    }
}

//funcion generica para habilitar o deshabilitar campos dependientes (provForm)
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
            Constant.dirtyFields.delete(id);
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
            Constant.dirtyFields.delete(id);
            toggleValidInput(el, true);
        }
    });
    hasValue();
}
//Gran Contribuyente -> campos de resolucion (provForm)
export function togglePvGC() {
    tDependentFields(
        document.getElementById('pvGrConSi').checked,
        [{ id: 'pvFechResolGC' }, { id: 'pvNumResolGC' }]
    );
}
//Declarante industria y comercio -> departamento y ciudad (provForm)
export function togglePvDIC() {
    tDependentFields(
        document.getElementById('pvDeclIndComSi').checked,
        [{ id: 'pvDepartDec', type: 'select' }, { id: 'pvCiudadDec', type: 'select' }]
    );
}
//Auto retenedor -> numero de resolucion (provForm)
export function togglePvAR() {
    tDependentFields(
        document.getElementById('pvAutRetSi').checked,
        [{ id: 'pvNumResDIAN' }]
    );
}
//Comercio exterior -> forma de pago y benficiados (provform)
export function togglePvCoEx() {
    tDependentFields(
        document.getElementById('pvOpeCExtSi').checked,
        [{ id: 'pvForPag' }, { id: 'pvEntBenef' }]
    );
}
//Posee cuenta bancaria -> entidad bancaria, numero de cuenta, clase de cuenta (provForm)
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

//logica para crear select dinamico a sucursal y agregar sucursal (usada por el click y loadFormData)
window.initSucursalUbic = async function (index) {
    //asegura que los datos de ubicacion colombiana esten cargados
    await API.loadUbiData();

    const depSelect = document.getElementById(`pjDepartDirSucursal_${index}`);
    const citySelect = document.getElementById(`pjCiudadDirSucursal_${index}`);
    if (!depSelect || !citySelect) return;

    fillSelect2(depSelect, ubi_Departamentos, 'Seleccione departamento');
    depSelect.disabled = false;

    $(depSelect).off('change.ubiSUC').on('change.ubiSUC', function () {
        const dep = this.value.trim().toUpperCase();
        const municipios = ubi_CiudadByDep[dep] || [];
        fillSelect2(citySelect, municipios);
        citySelect.disabled = municipios.length === 0;
    });
};
export function addSucursalInternal(newIndex) {
    const sucursalesContainer = document.getElementById('sucursales-container');
    const currentSucursales = sucursalesContainer.querySelectorAll('.sucursal-item').length;
    newIndex = currentSucursales + 1;

    if (newIndex > maxSucursales) {
        Constant.alertBody.innerText = `Máximo ${maxSucursales} sucursales permitidas.`;
        Constant.alert.show();
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
        Constant.telInst[`pjTelDirSucursal_${newIndex}`].setNumber(newIndex.telefono);
    }

    //inicializa los selects de ubicacion para la nueva sucursal
    window.initSucursalUbic(newIndex);

    initSucursalIRT(newIndex);
}
//validacion en tiempo real de sucursales
function initSucursalIRT(index) {
    const textFields = [
        {
            id: `pjDirSucursal_${index}`, validate: (el, val) => {
                val === '' ? toggleValidInput(el, false, 'Este campo es obligatorio.') : HUI.parseDirection(el);
            }
        },
        {
            id: `pjEmailDirSucursal_${index}`, validate: (el, val) => {
                const ok = val !== '' && Constant.regexEmail.test(val);
                toggleValidInput(el, ok, val === '' ? 'Este campo es obligatorio.' : 'Ingrese un correo válido.');
            }
        },
        {
            id: `pjTelDirSucursal_${index}`, validate: (el, val) => {
                const iti = Constant.telInst[`pjTelDirSucursal_${index}`];
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

//logica para agregar y remover filas a la tabla de control Persona Juridica
export function addControlRow(newIndex) {
    const currencyAccionistas = controlTableBody.querySelectorAll('.control-row').length;
    newIndex = currencyAccionistas + 1;

    if (newIndex > maxAccionistas) {
        Constant.alertBody.innerText = `Máximo ${maxAccionistas} accionistas permitidos.`;
        Constant.alert.show();
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
//validacion en tiempo real para tabla de accionistas
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

//logica para campos excluyentes de uploadDocsForm (upContingMeMagnetico y upContingFirmada)
export function checkExclusiones() {
    const magnetic = document.getElementById('upContingMeMagnetico');
    const firmada = document.getElementById('upContingFirmada');

    if (!magnetic || !firmada) return;

    blockExcl('upContingFirmada', magnetic.value.trim() !== "");
    blockExcl('upContingMeMagnetico', firmada.value.trim() !== "");
}
export function blockExcl(targetId, bloquear) {
    const targInput = document.getElementById(targetId);
    if (!targInput) return;

    const container = targInput.closest('.custom-file-container');
    const label = container?.querySelector('label');

    if (bloquear) {
        targInput.classList.add('no-edit');
        targInput.required = false;
        targInput.style.pointerEvents = 'none';
        if (label) label.classList.add('disabled-label')
        toggleValidInput(targInput, true);
    } else {
        targInput.classList.remove('no-edit');
        targInput.required = true;
        targInput.style.pointerEvents = 'auto';
        if (label) label.classList.remove('disabled-label');
    }
}

export function toggleOEA() {
    const si = document.getElementById('upOEAsi').checked;
    const no = document.getElementById('upOEAno').checked;
    const containerYesOEA = document.getElementById('sectionYesOEA');
    if (si) {

        containerYesOEA.style.display = 'block';
        containerYesOEA.querySelectorAll('input').forEach(i => i.required = true);
    } else if (no) {
        containerYesOEA.style.display = 'none';
        containerYesOEA.querySelectorAll('input').forEach(i => {
            i.value = '';
            i.required = false;
            i.classList.remove('file-existing');
        });
    } else {
        containerYesOEA.style.display = 'none';
        containerYesOEA.querySelectorAll('input').forEach(i => {
            i.value = '';
            i.required = false;
            i.classList.remove('file-existing');
        });
    }


}

//visualizacion de formato para imprimir
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