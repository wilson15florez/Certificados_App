import { docNacionales, docExtranjeros, pjRLDocNaci, pjRLDocExtr, alertBody, alert, regexEmail, dirtyFields, telInst } from './constant.js';
import * as API from './api-client.js';
import { waitSafeSetPhone, initTelInputs, existingFiles, tempFiles, parseDirection } from './form-helpers.js';
import { toggleValidInput, isAdult } from './validators.js';

const controlTableBody = document.querySelector('#control-table tbody');
const maxSucursales = 2;
const maxAccionistas = 4;
let isAutoFilling = false;
let originalPEPTypes = [];
let originalPEPEntidad = '';
export let filePaths = {};

//funcion para boton de auto scroll
export function scrollButton() {
    const btn = document.getElementById('btnScrollAuto');
    const icon = document.getElementById('scrollIcon');
    let lastScrollTop = 0;
    let action = 'down';

    if (!btn) return;

    window.addEventListener('scroll', () => {
        //calcula la posicion del scroll
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const fullHeight = document.documentElement.scrollHeight;

        //logica de direccion
        if (scrollPosition + windowHeight >= fullHeight - 10) {
            //caso: al final de la pagina -> forzar subir
            action = 'up';

        } else if (scrollPosition <= 10) {
            //caso: al inicio de la pagina -> forzar bajar
            action = 'down';

        } else {
            //caso: entre medio -> definir segun ultima direccion
            if (scrollPosition > lastScrollTop) {
                action = 'down';
            } else {
                action = 'up';
            }
        }

        //cambio visual del icono segun accion
        if (action === 'up') {
            icon.classList.replace('bi-arrow-down-circle-fill', 'bi-arrow-up-circle-fill');
            btn.title = 'Ir al inicio';
        } else {
            icon.classList.replace('bi-arrow-up-circle-fill', 'bi-arrow-down-circle-fill');
            btn.title = 'Ir al final';
        }

        lastScrollTop = scrollPosition <= 0 ? 0 : scrollPosition;
    }, { passive: true });

    btn.addEventListener('click', () => {
        if (action === 'up') {
            //scroll hacia arriba
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            //scroll hacia abajo
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }
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

//funcion que espera a que select2 tenga opciones cargadas
export function waitForSelec2(select, timeout = 800) {
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

    await waitForSelec2(select);

    const exists = [...select.options].some(o => o.value == value);

    if (!exists) {
        console.warn(`El valor no encontrado en el select2.`, { select, value });
        return false;
    }

    $(select).val(value).trigger('change.select2');
    return true;

}

//espera a que select2 tenga opciones cargadas
export const awaitOpt = (selectEl) => {
    return new Promise(resolve => {
        const check = () => {
            if ($(selectEl).find('option').length > 0) {
                resolve();
            } else {
                setTimeout(check, 50)
            }
        };
        check();
    });
};

//funcion que identifica tipo de nacionalidad en form persona natural
export function tipDocument() {
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
export function pjTipDocument() {
    const tipoNac = pjRLTipNacionalidad.value;

    pjRLTipoDoc.innerHTML = '<option value="" disabled selected>Seleccione un documento</option>';

    let listTipDoc = tipoNac === 'Nacional'
        ? pjRLDocNaci
        : tipoNac === 'Extranjero'
            ? pjRLDocExtr
            : [];

    listTipDoc.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.value;
        option.textContent = doc.text;
        pjRLTipoDoc.appendChild(option);
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
        pnNacionalidad.disabled = true;
        document.querySelector('label[for="pnNacionalidad"]').classList.add('disabled-label');

        //carga departamentos/ciudades de colombia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

        //departamentos de nacimiento, expedicion y residencia
        [pnEstadoNac, pnDepExpDoc, pnDepRes].forEach(depSelect => {
            fillSelect2(depSelect, departamentos, 'Seleccione departamento');
            depSelect.disabled = false;
            document.querySelector(`label[for="${depSelect.id}"]`).classList.remove('disabled-label');
        });

        const handleDeptChange = (depSelect, citySelect) => {
            $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
                const dep = this.value.trim().toUpperCase();
                const municipios = ciudadByDep[dep] || [];
                fillSelect2(citySelect, municipios, 'Seleccione ciudad');
                citySelect.disabled = municipios.length === 0;
                document.querySelector(`label[for="${citySelect.id}"]`).classList.remove('disabled-label');
            });
        };

        handleDeptChange(pnEstadoNac, pnCiudadNac);
        handleDeptChange(pnDepExpDoc, pnCiuExpDoc);
        handleDeptChange(pnDepRes, pnCiudadRes);

    }
    else if (nac === 'Extranjero') {

        //carga paises
        const countries = await API.loadUbiExt();

        fillSelect2(pnNacionalidad, countries, 'Seleccione país', 'id', 'name');
        pnNacionalidad.disabled = false;
        document.querySelector('label[for="pnNacionalidad"]').classList.remove('disabled-label');

        //Departamentos y ciudades colombianas para expedicion y residencia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

        [pnDepExpDoc, pnDepRes].forEach(depSelect => {
            fillSelect2(depSelect, departamentos, 'Seleccione departamento');
            depSelect.disabled = false;
            document.querySelector(`label[for="${depSelect.id}"]`).classList.remove('disabled-label');
        });

        const handleDeptChange = (depSelect, citySelect) => {
            $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
                const dep = this.value.trim().toUpperCase();
                const municipios = ciudadByDep[dep] || [];
                fillSelect2(citySelect, municipios, 'Seleccione ciudad');
                citySelect.disabled = municipios.length === 0;
                document.querySelector(`label[for="${citySelect.id}"]`).classList.remove('disabled-label');
            });
        };

        handleDeptChange(pnDepExpDoc, pnCiuExpDoc);
        handleDeptChange(pnDepRes, pnCiudadRes);

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

    const handleDeptChange = (depSelect, citySelect) => {
        $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
            const dep = this.value.trim().toUpperCase();
            const municipios = ciudadByDep[dep] || [];
            fillSelect2(citySelect, municipios, 'Seleccione ciudad');
            citySelect.disabled = municipios.length === 0;
            document.querySelector(`label[for="${citySelect.id}"]`).classList.remove('disabled-label');
        });
    };

    //limpia selects y los deshabilita si no es autorellenado del representante legal
    const selectClear = [pjDepartDilig, pjCiudadDilig, pjDepartDirPrincipal, pjCiudadDirPrincipal];
    selectClear.forEach(sel => {
        const $sel = $(sel);
        $sel.val(null).trigger('change.select2');
        $sel.empty();
        if (!isAutoFilling) {
            sel.disabled = true;
            document.querySelector(`label[for="${sel.id}"]`).classList.add('disabled-label');
        }
    });

    //departamento y ciudad de diligenciamiento
    fillSelect2(pjDepartDilig, ubi_Departamentos, 'Seleccione departamento');
    pjDepartDilig.disabled = false;
    document.querySelector(`label[for="pjDepartDilig"]`).classList.remove('disabled-label');
    handleDeptChange(pjDepartDilig, pjCiudadDilig);

    //departamento y ciudad direccion principal
    fillSelect2(pjDepartDirPrincipal, ubi_Departamentos, 'Seleccione departamento');
    pjDepartDirPrincipal.disabled = false;
    document.querySelector(`label[for="pjDepartDirPrincipal"]`).classList.remove('disabled-label');
    handleDeptChange(pjDepartDirPrincipal, pjCiudadDirPrincipal);

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
        if (!isAutoFilling) {
            sel.disabled = true;
            document.querySelector(`label[for="${sel.id}"]`).classList.add('disabled-label');
        }
    });

    //datos de ubicacion colombiana
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

    const handleDeptChange = (depSelect, citySelect) => {
        $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
            const dep = this.value.trim().toUpperCase();
            const municipios = ciudadByDep[dep] || [];
            fillSelect2(citySelect, municipios, 'Seleccione ciudad');
            citySelect.disabled = municipios.length === 0;
            document.querySelector(`label[for="${citySelect.id}"]`).classList.remove('disabled-label');
        });
    };

    //departamento y ciudad expedicion documento representante legal
    fillSelect2(pjRLDepExpDoc, ubi_Departamentos, 'Seleccione departamento');
    pjRLDepExpDoc.disabled = false;
    document.querySelector(`label[for="pjRLDepExpDoc"]`).classList.remove('disabled-label');
    handleDeptChange(pjRLDepExpDoc, pjRLCiuExpDoc);

    //ubicacion nacimiento de representante legal
    const nac = pjRLTipNacionalidad.value;
    if (nac === 'Nacional') {
        //pais fijo colombia
        fillSelect2(pjRLNacionalidad, [{ id: 'COLOMBIA', name: 'COLOMBIA' }]);
        $(pjRLNacionalidad).val('COLOMBIA').trigger('change.select2');
        pjRLNacionalidad.disabled = true;
        document.querySelector('label[for="pjRLNacionalidad"]').classList.add('disabled-label');

        //depatamento y ciudad colombianos
        fillSelect2(pjRLDepartNac, ubi_Departamentos, 'Seleccione departamento');
        pjRLDepartNac.disabled = false;
        document.querySelector(`label[for="pjRLDepartNac"]`).classList.remove('disabled-label');

        handleDeptChange(pjRLDepartNac, pjRLCiudadNac);
    }
    else if (nac === 'Extranjero') {
        //carga paises
        const countries = await API.loadUbiExt();
        fillSelect2(pjRLNacionalidad, countries, 'Seleccione país', 'id', 'name');
        pjRLNacionalidad.disabled = false;
        document.querySelector('label[for="pjRLNacionalidad"]').classList.remove('disabled-label');

        //Estados y ciudades para país seleccionado
        $(pjRLNacionalidad).off('change.ubiExtrPais').on('change.ubiExtrPais', async function () {

            const countryId = this.value;
            //estados
            const states = await API.loadStates(countryId);
            fillSelect2(pjRLDepartNac, states, 'Seleccione estado', 'id', 'name');
            pjRLDepartNac.disabled = false;
            document.querySelector('label[for="pjRLDepartNac"]').classList.remove('disabled-label');

            //ciudades
            $(pjRLDepartNac).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
                const stateId = this.value;
                const cities = await API.loadCities(stateId);
                fillSelect2(pjRLCiudadNac, cities, 'Seleccione ciudad', 'id', 'name');
                pjRLCiudadNac.disabled = false;
                document.querySelector('label[for="pjRLCiudadNac"]').classList.remove('disabled-label');
            });
        });
    }
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
    dirtyFields.clear();
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
        'pjRLDepartNac', 'pjRLCiudadNac', 'pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos', 'pvPatrimonio', 'pvOtrIngr', 'pvPorNacional', 'pvPorExtranjero', 'pvPorPais',
        'pvTipEmp', 'pvAcEconomica', 'pvCodCIIU', 'pvCapSocReg', 'pvFechConst', 'pvFechVen', 'pvGrConSi', 'pvFechResolGC', 'pvNumResolGC', 'pvDeclIndComSi',
        'pvDepartDec', 'pvCiudadDec', 'pvAutRetSi', 'pvNumResDIAN', 'pvOpeCExtSi', 'pvForPag', 'pvEntBenef', 'pvPosCuBanSi', 'pvEntidad', 'pvNumCueBanc',
        'pvClasCueBan', 'pvCeOEASi', 'pvCeCalSi', 'pvCeBASCSi', 'pvCeAmbSi', 'pvCe28000Si', 'pvCeSSTSi', 'pvTDPMotMaqSI', 'pvTDPCasTorSI', 'pvTDPBonapSI',
        'pvRadAutSI', 'pvDeAuRepresentacion', 'pvFuenteRecur', 'pvCumCSInSI', 'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 'upComposicionAccionaria',
        'upFotocopiaCC', 'upRefeComerciales', 'upEstadoFinanciero', 'upCertificacionesVarias', 'upFUCPfirmado', 'upOEAsi', 'upContingMeMagnetico',
        'upContingFirmada', 'upCertifiOEA', 'upAcuerdoSeguridad'
    ];

    const docsFieldIds = new Set ([
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
                    dirtyFields.add(elName);
                    const isChecked = document.querySelector(`input[name="${elName}"]:checked`);
                    toggleValidInput(el, !!isChecked, 'Seleccione una opción.');
                });
            });
            return;
        }

        //eventos 'blur' y 'change'
        const validateEvent = () => {
            if (isAutoFilling) return;
            if (!dirtyFields.has(id)) return;
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
                const isValid = regexEmail.test(value);
                toggleValidInput(el, isValid, 'Ingrese un correo valido.');
            }
            else if (el.type === 'tel') {
                const iti = telInst[id];
                const isValid = value === '' ? false : iti.isValidNumber();
                toggleValidInput(el, isValid, 'Ingrese un número de teléfono válido.');
            }
            else if (id === 'pnDiResidencia' || id === 'pjDirPrincipal' || id.includes('pjDirSucursal_')) {
                value === '' ? toggleValidInput(el, false, 'Este campo es obligatorio.') : parseDirection(el);
            }
            else if (id === 'pvPorNacional' || id === 'pvPorExtranjero') {
                if (!dirtyFields.has('pvPorNacional') && !dirtyFields.has('pvPorExtranjero')) return;

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
                    if (dirtyFields.has('pvPorExtranjero')) {
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
            else {
                toggleValidInput(el, value !== '', 'Este campo es obligatorio.');
            }
        };

        //'blur' -> marca como "tocado" y lo valida (excepto los panel de docs que no se han abierto o los que estan abiertos)
        el.addEventListener('blur', function () {
            if (isDocsField && !el.dataset.panelVisited) return;
            if (isDocsField && el.dataset.panelOpen) return;
            dirtyFields.add(id);
            validateEvent();
        });

        //change (select/select2) -> marca como "tocado" y valida
        $(el).on('change', function () {
            if (isAutoFilling) return;
            if (isDocsField && !el.dataset.panelVisited) return;
            dirtyFields.add(id);
            validateEvent();

            if (id === 'pvAcEconomica' || id === 'pvCodCIIU') {
                const otherId = id === 'pvAcEconomica' ? 'pvCodCIIU' : 'pvAcEconomica';
                const otherEl = document.getElementById(otherId);
                if (el.value !== '') toggleValidInput(otherEl, true);
            }
        });

        el.addEventListener('input', function () {
            if (!dirtyFields.has(id)) return;
            validateEvent();
        });
    });
}

//funcion que gestiona los select de ubicacion del provForm (Informacion Financiera)
export async function ubicProvFormHandler() {

    //si es autorellenado no limpia los selects de ubicacion
    if (!isAutoFilling) {
        [pvPorPais, pvDepartDec, pvCiudadDec].forEach(sel => {
            $(sel).empty().prop("disabled", true);
            document.querySelector(`label[for="${sel.id}"]`).classList.add('disabled-label');
        });
    }

    //limpia actividad economica y codigo CIIU si no es autorellenado o si lo es
    if (!isAutoFilling || isAutoFilling) {
        [pvAcEconomica, pvCodCIIU, pvEntidad].forEach(sel => {
            dirtyFields.delete(sel.id);
            $(sel).val(null).trigger('change');
        })
    }

    //carga pais extranjero de porcentaje origen de capital
    const countries = await API.loadUbiExt();
    fillSelect2(pvPorPais, countries, 'Seleccione país', 'id', 'name');
    pvPorPais.disabled = false;
    document.querySelector(`label[for="pvPorPais"]`).classList.remove('disabled-label');

    //carga departamento y ciudad de declaracion
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

    fillSelect2(pvDepartDec, departamentos, 'Seleccione departamento');
    pvDepartDec.disabled = false;
    document.querySelector(`label[for="pvDepartDec"]`).classList.remove('disabled-label');

    if (!pvDepartDec.value) {
        pvCiudadDec.disabled = true;
        document.querySelector(`label[for="pvCiudadDec"]`).classList.add('disabled-label');
    }

    $(pvDepartDec).off('change.ubiNac').on('change.ubiNac', function () {
        const selectedDep = this.value.trim().toUpperCase();
        const municipios = ciudadByDep[selectedDep] || [];

        fillSelect2(pvCiudadDec, municipios, 'Seleccione ciudad');
        pvCiudadDec.disabled = municipios.length === 0;
        document.querySelector(`label[for="pvCiudadDec"]`).classList.remove('disabled-label');
    });

    if (isAutoFilling && pvDepartDec.value) {
        $(pvDepartDec).trigger('change.ubiNac');
    }
        
    togglePvPais();
    togglePvDIC();
}

//funcion para precargar los datos del formulario persona natural
export async function loadFormData_Natural(data) {
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
        $(pnTipoNacionalidad).val(data.pnTipoNacionalidad);

        //tipo de documento segun nacionalidad
        tipDocument();

        await ubicPNaHandler();

        if (data.pnTipoDoc) {
            pnTipoDoc.value = data.pnTipoDoc;
        }
    } else {
        tipDocument();
        await ubicPNaHandler();
    }
    //mapea nit al campo de identificacion
    if (data.Nit) document.getElementById('pnNumId').value = data.Nit;

    await waitSafeSetPhone('pnCelular', data.pnCelular);
    await waitSafeSetPhone('pnTelefono', data.pnTelefono);


    //ubicaciones

    //nacimiento
    if (data.pnNacionalidad) {
        await setSelect2Val(pnNacionalidad, data.pnNacionalidad);

        if (data.pnTipoNacionalidad === 'Nacional') {
            $(pnNacionalidad).trigger("change.ubiNac");
        } else if (data.pnTipoNacionalidad === 'Extranjero') {
            $(pnNacionalidad).trigger("change.ubiExtrPais");
        }

        await awaitOpt(pnEstadoNac);

        if (data.pnEstadoNac) {
            await setSelect2Val(pnEstadoNac, data.pnEstadoNac);

            if (data.pnTipoNacionalidad === 'Nacional') {
                $(pnEstadoNac).trigger("change.ubiNac");
            } else if (data.pnTipoNacionalidad === 'Extranjero') {
                $(pnEstadoNac).trigger("change.ubiExtrEstado");
            }

            await awaitOpt(pnCiudadNac);

            if (data.pnCiudadNac) {
                await setSelect2Val(pnCiudadNac, data.pnCiudadNac);
            }
        }
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

    //select Actividad
    if (data.pnActividad) {
        let pnActivity = data.pnActividad;
        pnActivity = pnActivity.charAt(0).toUpperCase() + pnActivity.slice(1).toLowerCase();
        pnActividad.value = pnActivity;
    }

    //asigna los campos simples excepto los que requieren logica especial
    const skipCampos = [
        'pnTipoNacionalidad', 'pnTipoDoc', 'pnNacionalidad',
        'pnEstadoNac', 'pnCiudadNac', 'pnDepExpDoc',
        'pnCiuExpDoc', 'pnDepRes', 'pnCiudadRes', 'Nit',
        'pnCelular', 'pnTelefono', 'pnActividad'
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
export async function loadFormData_Juridica(data) {
    //bloquea los eventos de cambio para evitar conflictos durante el auto llenado
    isAutoFilling = true;

    const form = document.getElementById('persJuriForm');

    //limpieza
    form.querySelectorAll('input,select, textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
    });

    if (!data) {
        isAutoFilling = false;
        return;
    }

    //mapea nit
    if (data.Nit) document.getElementById('pjNIT').value = data.Nit;

    await waitSafeSetPhone('pjTelDirPrincipal', data.pjTelDirPrincipal);

    //precarga las sucursales
    document.querySelectorAll('.sucursal-item').forEach(item => item.remove());
    if (data.Sucursales && Array.isArray(data.Sucursales) && data.Sucursales.length > 0) {

        for (let index = 0; index < data.Sucursales.length; index++) {
            addSucursalBtn.click();
            const suc = data.Sucursales[index];
            const i = index + 1;

            //limite de seguridad para el autorellenado
            if (i > maxSucursales) break;

            if (i > 1) {
                await awaitOpt(document.getElementById(`pjDepartDirSucursal_${i}`));
            }

            //llenar campos de texto
            document.getElementById(`pjDirSucursal_${i}`).value = suc.pjSucursalDir || '';
            document.getElementById(`pjEmailDirSucursal_${i}`).value = suc.pjSucursalEmail || '';
            await waitSafeSetPhone(`pjTelDirSucursal_${i}`, suc.pjSucursalTel);
            
            //llenar selects de ubicacion de sucursales
            const depSelect = document.getElementById(`pjDepartDirSucursal_${i}`);
            const citySelect = document.getElementById(`pjCiudadDirSucursal_${i}`);

            if (suc.pjSucursalDepart) {
                await setSelect2Val(depSelect, suc.pjSucursalDepart);
                $(depSelect).trigger("change.ubiSUC");
                await waitForSelec2(citySelect);
            }
            if (suc.pjSucursalCiudad) {
                await setSelect2Val(citySelect, suc.pjSucursalCiudad);
            }
        }
    }

    //precarga de tabla de accionistas
    controlTableBody.querySelectorAll('.control-row').forEach(item => item.remove());

    if (data.ControlRow && Array.isArray(data.ControlRow) && data.ControlRow.length > 0) {
        data.ControlRow.forEach((row) => {
            addControlRow();

            const currentRow = controlTableBody.lastElementChild;

            currentRow.querySelector('[name="controlRazonSocial[]"]').value = row.razonSocial || '';
            currentRow.querySelector('[name="controlIdType[]"]').value = row.idType || '';
            currentRow.querySelector('[name="controlIdNum[]"]').value = row.idNum || '';
            currentRow.querySelector('[name="controlPorcentaje[]"]').value = row.porcentaje || '';
        });
    } else {
        addControlRow({});
    }

    //precarga de representante legal
    //tipo nacionalidad
    if (data.pjRLTipNacionalidad) {
        $(pjRLTipNacionalidad).val(data.pjRLTipNacionalidad);

        //tipo documento segun nacionalidad
        pjTipDocument();

        if (data.pjRLTipoDoc) {
            pjRLTipoDoc.value = data.pjRLTipoDoc;
        }
    } else {
        pjTipDocument();
    }
    await ubicPJuHandler();
    await ubicPJuReLeHandler();

    //ubicacion

    //diligenciamiento
    if (data.pjDepartDilig) {
        await setSelect2Val(pjDepartDilig, data.pjDepartDilig);
        $(pjDepartDilig).trigger("change.ubiNac");
        await waitForSelec2(pjCiudadDilig)
    }
    if (data.pjCiudadDilig) {
        await setSelect2Val(pjCiudadDilig, data.pjCiudadDilig);
    }

    //direccion principal
    if (data.pjDepartDirPrincipal) {
        await setSelect2Val(pjDepartDirPrincipal, data.pjDepartDirPrincipal);
        $(pjDepartDirPrincipal).trigger("change.ubiNac");
        await waitForSelec2(pjCiudadDirPrincipal);
    }
    if (data.pjCiudadDirPrincipal) {
        await setSelect2Val(pjCiudadDirPrincipal, data.pjCiudadDirPrincipal);
    }

    //nacimiento
    if (data.pjRLNacionalidad) {
        await setSelect2Val(pjRLNacionalidad, data.pjRLNacionalidad);

        if (data.pjRLTipNacionalidad === 'Nacional') {
            $(pjRLNacionalidad).trigger("change.ubiNac");
        } else if (data.pjRLTipNacionalidad === 'Extranjero') {
            $(pjRLNacionalidad).trigger("change.ubiExtrPais");
        }

        await awaitOpt(pjRLDepartNac);

        if (data.pjRLDepartNac) {
            await setSelect2Val(pjRLDepartNac, data.pjRLDepartNac);

            if (data.pjRLTipNacionalidad === 'Nacional') {
                $(pjRLDepartNac).trigger("change.ubiNac");
            } else if (data.pjRLTipNacionalidad === 'Extranjero') {
                $(pjRLDepartNac).trigger("change.ubiExtrEstado");
            }

            await awaitOpt(pjRLCiudadNac);

            if (data.pjRLCiudadNac) {
                await setSelect2Val(pjRLCiudadNac, data.pjRLCiudadNac);
            }
        }
    }

    //expedicion
    if (data.pjRLDepExpDoc) {
        await setSelect2Val(pjRLDepExpDoc, data.pjRLDepExpDoc);
        $(pjRLDepExpDoc).trigger("change.ubiNac");
        await waitForSelec2(pjRLCiuExpDoc);
    }
    if (data.pjRLCiuExpDoc) {
        await setSelect2Val(pjRLCiuExpDoc, data.pjRLCiuExpDoc);
    }

    //asigna los campos simples excepto los que requieren logica especial
    const skitCampos = [
        'pjRLTipNacionalidad', 'pjRLTipoDoc', 'pjRLNacionalidad', 'pjRLDepartNac',
        'pjRLCiudadNac', 'pjRLDepExpDoc', 'pjRLCiuExpDoc', 'Nit', 'pjTelDirPrincipal'
    ];

    for (const key in data) {
        if (!skitCampos.includes(key)) {
            const el = document.getElementById(key);
            if (el && data[key] != null) el.value = data[key];
        }
    }

    isAutoFilling = false;
}

//funcion para precargar datos en el formulario de informacion financiera (provForm)
export async function loadProvFormData(data) {

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

    //actividad economica y codigo CIIU
    if (data.pvAcEconomica) {
        await setSelect2Val(pvAcEconomica, data.pvAcEconomica);
    }
    if (data.pvCodCIIU) {
        await setSelect2Val(pvCodCIIU, data.pvCodCIIU);
    }

    //entidad bancaria
    if (data.pvEntidad) {
        await setSelect2Val(pvEntidad, data.pvEntidad);
    }

    //select tipo de cuenta bancaria
    if (data.pvClasCueBan) {
        let pvCCB = data.pvClasCueBan;
        pvCCB = pvCCB.charAt(0).toUpperCase() + pvCCB.slice(1).toLowerCase();
        pvClasCueBan.value = pvCCB;
    }

    //asigna los campos simples excepto los que requieren logica especial
    const skipCampos = [
        'pvPorPais', 'pvDepartDec', 'pvCiudadDec',
        'pvAcEconomica', 'pvCodCIIU', 'pvEntidad',
        'pvClasCueBan'
    ];

    for (const key in data) {
        if (!skipCampos.includes(key)) {
            const el = document.getElementById(key);
            if (el && data[key] != null) el.value = data[key];
        }
    }

    //campos numericos con formato dinero
    const skpCamposDinero = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos',
        'pvPasivos', 'pvPatrimonio', 'pvOtrIngr',
        'pvCapSocReg'
    ];
    skpCamposDinero.forEach(campo => {
        const el = document.getElementById(campo);
        if (el && data[campo]) {
            el.value = formatCurrency(data[campo]);
        }
    });

    //select tipo empresa
    if (data.pvTipEmp) {
        let pvTipoEmpr = data.pvTipEmp;
        pvTipoEmpr = pvTipoEmpr.charAt(0).toUpperCase() + pvTipoEmpr.slice(1).toLowerCase();
        pvTipEmp.value = pvTipoEmpr;
    }

    //radios
    //if (data.pvTipEmp) {
    //    const r = form.querySelector(`input[name="pvTipEmp"][value="${data.pvTipEmp}"]`);
    //    if (r) r.checked = true;
    //}
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
    if (data.pvOpeCExt) {
        const r = form.querySelector(`input[name="pvOpeCExt"][value="${data.pvOpeCExt}"]`);
        if (r) r.checked = true;
    }
    if (data.pvCeOEA) {
        const r = form.querySelector(`input[name="pvCeOEA"][value="${data.pvCeOEA}"]`);
        if (r) r.checked = true;
    }
    if (data.pvCeCal) {
        const r = form.querySelector(`input[name="pvCeCal"][value="${data.pvCeCal}"]`);
        if (r) r.checked = true;
    }
    if (data.pvCeBASC) {
        const r = form.querySelector(`input[name="pvCeBASC"][value="${data.pvCeBASC}"]`);
        if (r) r.checked = true;
    }
    if (data.pvCeAmb) {
        const r = form.querySelector(`input[name="pvCeAmb"][value="${data.pvCeAmb}"]`);
        if (r) r.checked = true;
    }
    if (data.pvCe28000) {
        const r = form.querySelector(`input[name="pvCe28000"][value="${data.pvCe28000}"]`);
        if (r) r.checked = true;
    }
    if (data.pvCeSST) {
        const r = document.querySelector(`input[name="pvCeSST"][value="${data.pvCeSST}"]`);
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
    if (data.pvCumCSIn) {
        const r = document.querySelector(`input[name="pvCumCSIn"][value="${data.pvCumCSIn}"]`);
        if (r) r.checked = true;
    }
    if (data.pvRadAut) {
        const r = document.querySelector(`input[name="pvRadAut"][value="${data.pvRadAut}"]`);
        if (r) r.checked = true;
    }

    //togglePvTE();
    togglePvPais();
    togglePvGC();
    togglePvDIC();
    togglePvAR();
    togglePvCB();
    togglePvCoEx();

    isAutoFilling = false;
}

//funcion para precargar datos de proveedores_Master
export async function loadMasterData(masterData, formId, idNum, suggest) {

    const cleanTel = masterData.telefono ? masterData.telefono.replace(/\s+/g, '') : "";

    if (formId === 'persNatuForm') {
        //precarga los campos que coincida con la data de master
        document.getElementById('pnPrimerApell').value = suggest.firstSurname || '';
        document.getElementById('pnSegundoApell').value = suggest.secondSurname || '';
        document.getElementById('pnNombres').value = suggest.names || '';
        //document.getElementById('pnDiResidencia').value = masterData.direccion || '';
        document.getElementById('pnEmail').value = masterData.correo || '';

        const pnInpNumId = document.getElementById('pnNumId');
        if (pnInpNumId) {
            document.getElementById('pnNumId').value = idNum;
        }

        const inputDir = document.getElementById('pnDiResidencia');
        if (inputDir && masterData.direccion) {
            inputDir.value = masterData.direccion;

            // LLAMADA CLAVE: Validar apenas se pone el valor
            parseDirection(inputDir);
        }

        const isFijo = cleanTel.startsWith('60') || cleanTel.startsWith('+5760');

        //asigna el telefono al campo correspondiente
        if (isFijo) {
            await waitSafeSetPhone('pnTelefono', cleanTel);
            await waitSafeSetPhone('pnCelular', '');
        } else {
            await waitSafeSetPhone('pnCelular', cleanTel);
            await waitSafeSetPhone('pnTelefono', '');
        }

        document.getElementById('pvDeAuRepresentacion').value = masterData.nombre || '';
    }
    else if (formId === 'persJuriForm') {
        //precarga los campos que coincida con la data de master
        document.getElementById('pjRazSocial').value = masterData.nombre || '';
        //document.getElementById('pjDirPrincipal').value = masterData.direccion || '';
        document.getElementById('pjEmailDirPrincipal').value = masterData.correo || '';

        await waitSafeSetPhone('pjTelDirPrincipal', cleanTel);

        const pjInpNumId = document.getElementById('pjNIT');
        if (pjInpNumId) {
            document.getElementById('pjNIT').value = idNum;
        }

        const inputDir = document.getElementById('pjDirPrincipal');
        if (inputDir && masterData.direccion) {
            inputDir.value = masterData.direccion;

            // LLAMADA CLAVE: Validar apenas se pone el valor
            parseDirection(inputDir);
        }

        document.getElementById('pvDeAuRepresentacion').value = masterData.nombre || '';
    }
}


//logica para campos form Informacion Financiera (provForm)
export const formatCurrency = (value) => {
    if (!value) return '';

    const cleanValue = value.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(cleanValue);
};
export const unformatCurrency = (value) => {
    return value.replace(/\D/g, '');
};
//export function togglePvTE() {
//    const siOtra = document.getElementById('pvEmOtra').checked;
//    const inpTE = document.getElementById('pvOtrTipEmp');
//    const labTE = document.querySelector('label[for="pvOtrTipEmp"]');
//    if (siOtra) {
//        inpTE.classList.remove('no-edit');
//        labTE.classList.remove('disabled-label');
//        inpTE.required = true;
//    } else {
//        pvOtrTipEmp.value = '';
//        inpTE.classList.add('no-edit');
//        labTE.classList.add('disabled-label');
//        inpTE.required = false;
//    }
//}
export function togglePvPais() {
    const hasNaVal = parseFloat(pvPorNacional.value.trim() || 0);
    const needExt = hasNaVal > 0 && hasNaVal < 100;

    pvPorExtranjero.classList.toggle('no-edit', !needExt);
    document.querySelector(`label[for="pvPorExtranjero"]`).classList.toggle('disabled-label', !needExt);

    if (!needExt) {
        pvPorExtranjero.value = '';
        hasValue();
        dirtyFields.delete('pvPorExtranjero');
        toggleValidInput(pvPorExtranjero, true);
    } 

    const hasVal = pvPorExtranjero.value.trim().length > 0;
    $(pvPorPais).prop('disabled', !hasVal).trigger('change.select2');
    document.querySelector(`label[for="pvPorPais"]`).classList.toggle('disabled-label', !hasVal);
    if (!hasVal) {
        dirtyFields.delete('pvPorPais');
        $(pvPorPais).val(null).trigger('change.select2');
        toggleValidInput(pvPorPais, true);
    }
}
export function togglePvGC() {
    const si = document.getElementById('pvGrConSi').checked;
    const inpGC = [document.getElementById('pvFechResolGC'), document.getElementById('pvNumResolGC')];
    const labGC = [document.querySelector('label[for="pvFechResolGC"]'), document.querySelector('label[for="pvNumResolGC"]')];
    if (si) {
        inpGC.forEach(el => el.classList.remove('no-edit'));
        labGC.forEach(el => el.classList.remove('disabled-label'));
        inpGC.forEach(el => el.required = true);
    } else {
        pvFechResolGC.value = '';
        pvNumResolGC.value = '';
        hasValue();
        inpGC.forEach(el => el.classList.add('no-edit'));
        labGC.forEach(el => el.classList.add('disabled-label'));
        inpGC.forEach(el => {
            el.required = false
            toggleValidInput(el, true)
        });
    }
}
export function togglePvDIC() {
    const si = document.getElementById('pvDeclIndComSi').checked;
    const selDIC = [document.getElementById('pvDepartDec'), document.getElementById('pvCiudadDec')];
    if (si) {
        selDIC[0].disabled = false;
        document.querySelector(`label[for="pvDepartDec"]`).classList.remove('disabled-label');
        //.trigger('change.select2');

        selDIC.forEach(el => el.required = true);
    } else {
        selDIC.forEach(el => {
            $(el).prop('disabled', true).trigger('change.select2')
            document.querySelector(`label[for="${el.id}"]`).classList.add('disabled-label');
            toggleValidInput(el, true);
        });
        selDIC.forEach(el => $(el).val(null).trigger('change.select2'));
        selDIC.forEach(el => el.required = false);
    }
}
export function togglePvAR() {
    const si = document.getElementById('pvAutRetSi').checked;
    const inpAR = document.getElementById('pvNumResDIAN');
    const labAR = document.querySelector('label[for="pvNumResDIAN"]');
    if (si) {
        inpAR.classList.remove('no-edit');
        labAR.classList.remove('disabled-label');
        inpAR.required = true;
    } else {
        pvNumResDIAN.value = '';
        hasValue();
        inpAR.classList.add('no-edit');
        labAR.classList.add('disabled-label');
        inpAR.required = false;
        toggleValidInput(inpAR, true);
    }
}
export function togglePvCB() {
    const si = document.getElementById('pvPosCuBanSi').checked;
    const inpCB = document.getElementById('pvNumCueBanc');
    const labCB = document.querySelector('label[for="pvNumCueBanc"]');

    if (si) {
        inpCB.classList.remove('no-edit');
        labCB.classList.remove('disabled-label');
        inpCB.required = true;

        dirtyFields.delete('pvEntidad');
        dirtyFields.delete('pvClasCueBan');

        $(pvEntidad).prop('disabled', false).trigger('change.select2');
        document.querySelector(`label[for="pvEntidad"]`).classList.remove('disabled-label');
        pvEntidad.required = true;
        toggleValidInput(pvEntidad, true);

        $(pvClasCueBan).prop('disabled', false);
        document.querySelector(`label[for="pvClasCueBan"]`).classList.remove('disabled-label');
        pvClasCueBan.required = true;
        toggleValidInput(pvClasCueBan, true);
    } else {
        pvNumCueBanc.value = '';
        hasValue();
        inpCB.classList.add('no-edit');
        labCB.classList.add('disabled-label');
        inpCB.required = false;
        toggleValidInput(inpCB, true);

        dirtyFields.add('pvEntidad');
        dirtyFields.add('pvClasCueBan');

        $(pvEntidad).prop('disabled', true).trigger('change.select2');
        document.querySelector(`label[for="pvEntidad"]`).classList.add('disabled-label');
        $(pvEntidad).val(null).trigger('change.select2');
        pvEntidad.required = false;
        toggleValidInput(pvEntidad, true);

        $(pvClasCueBan).prop('disabled', true);
        document.querySelector(`label[for="pvClasCueBan"]`).classList.add('disabled-label');
        $(pvClasCueBan).val(null);
        pvClasCueBan.required = false;
        toggleValidInput(pvClasCueBan, true);
    }
}
export function togglePvCoEx() {
    const si = document.getElementById('pvOpeCExtSi').checked;
    const inpFPCoEx = document.getElementById('pvForPag');
    const labFPCoEx = document.querySelector('label[for="pvForPag"]');
    const inpBenCoEx = document.getElementById('pvEntBenef');
    const labBenCoEx = document.querySelector('label[for="pvEntBenef"]');

    if (si) {
        inpFPCoEx.classList.remove('no-edit');
        labFPCoEx.classList.remove('disabled-label');
        inpFPCoEx.required = true;
        inpBenCoEx.classList.remove('no-edit');
        labBenCoEx.classList.remove('disabled-label');
        inpBenCoEx.required = true;
    } else {
        pvForPag.value = '';
        inpFPCoEx.classList.add('no-edit');
        labFPCoEx.classList.add('disabled-label');
        inpFPCoEx.required = false;
        toggleValidInput(inpFPCoEx, true);
        pvEntBenef.value = '';
        inpBenCoEx.classList.add('no-edit');
        labBenCoEx.classList.add('disabled-label');
        inpBenCoEx.required = false;
        toggleValidInput(inpBenCoEx, true);

        hasValue();
    }
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
        alertBody.innerText = `Máximo ${maxSucursales} sucursales permitidas.`;
        alert.show();
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
    initTelInputs(newTelInput, false);

    if (newIndex && newIndex.telefono) {
        telInst[`pjTelDirSucursal_${newIndex}`].setNumber(newIndex.telefono);
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
                val === '' ? toggleValidInput(el, false, 'Este campo es obligatorio.') : parseDirection(el);
            }
        },
        {
            id: `pjEmailDirSucursal_${index}`, validate: (el, val) => {
                const ok = val !== '' && regexEmail.test(val);
                toggleValidInput(el, ok, val === '' ? 'Este campo es obligatorio.' : 'Ingrese un correo válido.');
            }
        },
        {
            id: `pjTelDirSucursal_${index}`, validate: (el, val) => {
                const iti = telInst[`pjTelDirSucursal_${index}`];
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
        alertBody.innerText = `Máximo ${maxAccionistas} accionistas permitidos.`;
        alert.show();
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
                toggleValidInput(elPorc, false, 'Ingrese un porcentaje v\u00e1lido.');
            } else if (val < 5) {
                toggleValidInput(elPorc, false, 'El porcentaje m\u00ednimo es 5%.');
            } else {
                toggleValidInput(elPorc, true);
                validateTotalPorcentaje();
            }
        };
        elPorc.addEventListener('blur', () => { dirty = true; validate(); });
        elPorc.addEventListener('input', () => { if (dirty) validate(); });
    }
}

//funcion para precargar nombres de los docs de uploadDocsForm
export function loadDocsForm(data, isOEAValue) {
    const form = document.getElementById('uploadDocsForm');
    if (!form) return

    //limpieza de arrays para evitar duplicacion al re-consultar
    for (let key in existingFiles) delete existingFiles[key];
    for (let key in tempFiles) delete tempFiles[key];
    for (let key in filePaths) delete filePaths[key];

    //limpieza inicial
    form.querySelectorAll('input').forEach(el => {
        if (el.type === 'radio' || el.type === 'checkbox') {
            el.checked = false;
        } else {
            el.value = '';
        }

        el.classList.remove('file-existing', 'no-edit');
    });

    //carga de datos
    if (isOEAValue) {
        const r = form.querySelector(`input[name="upOEA"][value="${isOEAValue}"]`);
        if (r) {
            r.checked = true;
            toggleOEA();
        }
    }

    if (data && data.length > 0) {
        data.forEach(doc => {
            const categoria = doc.categoriaDOC || doc.CategoriaDOC;
            const nombre = doc.nombreArchivo || doc.NombreArchivo;
            const ruta = doc.rutaArchivo || doc.RutaArchivo;

            if (categoria) {
                if (!existingFiles[categoria]) existingFiles[categoria] = [];
                existingFiles[categoria].push(nombre);

                //se guarda la ruta asociada al nombre del archivo
                if (!filePaths[categoria]) filePaths[categoria] = {};
                filePaths[categoria][nombre] = ruta;
            }
        });

        Object.keys(existingFiles).forEach(categoria => {
            const input = document.getElementById(categoria);
            if (input) {
                input.value = existingFiles[categoria].join(', ');
                input.classList.add('file-existing');
            }
        });
    }

    checkExclusiones();
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
    /*const containerNoOEA = document.getElementById('sectionNoOEA');*/
    if (si) {
        //containerNoOEA.style.display = 'none';
        //containerNoOEA.querySelectorAll('input').forEach(i => i.value = '');
        //containerNoOEA.querySelectorAll('input').forEach(i => i.required = false);

        containerYesOEA.style.display = 'block';
        containerYesOEA.querySelectorAll('input').forEach(i => i.required = true);
    } else if (no) {
        containerYesOEA.style.display = 'none';
        //containerYesOEA.querySelectorAll('input').forEach(i => i.value = '');
        //containerYesOEA.querySelectorAll('input').forEach(i => i.required = false);
        containerYesOEA.querySelectorAll('input').forEach(i => {
            i.value = '';
            i.required = false;
            i.classList.remove('file-existing');
        });
        

        //containerNoOEA.style.display = 'block';
        //containerNoOEA.querySelectorAll('input').forEach(i => i.required = true);
    } else {
        containerYesOEA.style.display = 'none';
        //containerYesOEA.querySelectorAll('input').forEach(i => i.value = '');
        //containerYesOEA.querySelectorAll('input').forEach(i => i.required = false);
        containerYesOEA.querySelectorAll('input').forEach(i => {
            i.value = '';
            i.required = false;
            i.classList.remove('file-existing');
        });

        //containerNoOEA.style.display = 'none';
        //containerNoOEA.querySelectorAll('input').forEach(i => i.value = '');
        //containerNoOEA.querySelectorAll('input').forEach(i => i.required = false);
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