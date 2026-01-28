import { docNacionales, docExtranjeros, pjRLDocNaci, pjRLDocExtr, alertBody, alert } from './constant.js';
import * as API from './api-client.js';
import { waitSafeSetPhone, initTelInputs } from './utils-phone.js';

const controlTableBody = document.querySelector('#control-table tbody');
const maxSucursales = 2;
let isAutoFilling = false;
let originalPEPTypes = [];
let originalPEPEntidad = '';

//funcion que valida tipo de persona que proveedor habia seleccionado y despliega el form indicado (vista proveedor)
//export function formViewProvHandler(result) {
//    if (result.status === "noType") {
//        createAlert(result.message, 'warning'); cambiar al nuevo alert
//        return;
//    }

//    const personType = result.type.toLowerCase();

//    if (personType === 'natural') {
//        $('#sectionNatural').fadeIn();
//        $('#sectionJuridica').hide();

//        loadFormData_Natural(result.data);
//    } else {
//        $('#sectionJuridica').fadeIn();
//        $('#sectionNatural').hide();

//        loadFormData_Juridica(result.data);
//    }

//}

//funcion para boton de auto scroll
export function scrollButton() {
    const btn = document.getElementById('btnScrollAuto');
    const icon = document.getElementById('scrollIcon');

    if (!btn) return;

    window.addEventListener('scroll', () => {
        //calcula la posicion del scroll
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const fullHeight = document.body.offsetHeight;

        //si se esta a mas de la mitad de la pagina, el boton cambia a subir
        if (scrollPosition > (fullHeight / 4)) {
            icon.classList.replace('bi-arrow-down-circle-fill', 'bi-arrow-up-circle-fill');
            btn.classList.add('btn-up');
            btn.title = 'Ir al inicio';
        } else {
            icon.classList.replace('bi-arrow-up-circle-fill', 'bi-arrow-down-circle-fill');
            btn.classList.remove('btn-up');
            btn.title = 'Ir al final';
        }
    });

    btn.addEventListener('click', () => {
        const fullHeight = document.body.offsetHeight;
        const scrollPosition = window.scrollY;

        if (scrollPosition > (fullHeight / 4)) {
            //scroll hacia arriba
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            //scroll hacia abajo
            window.scrollTo({ top: fullHeight, behavior: 'smooth' });
        }
    });
}

//funcion para bloquear los selects al iniciar la carga de la pagina
export function firstBlock() {
    //bloqueo inicial form persona natural
    pnDepExpDoc.disabled = true;
    pnCiuExpDoc.disabled = true;
    pnNacionalidad.disabled = true;
    pnEstadoNac.disabled = true;
    pnCiudadNac.disabled = true;
    pnDepRes.disabled = true;
    pnCiudadRes.disabled = true;

    //bloqueo inicial form persona juridica
    pjCiudadDirPrincipal.disabled = true;
    pjRLCiuExpDoc.disabled = true;
    pjRLNacionalidad.disabled = true;
    pjRLDepartNac.disabled = true;
    pjRLCiudadNac.disabled = true;

    //bloqueo inicial form general
    pvPorPais.disabled = true;
    pvDepartDec.disabled = true;
    pvCiudadDec.disabled = true;
    pvClasCueBan.disabled = true;
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
        }
    });

    if (nac === 'Nacional') {
        //pais fijo colombia
        fillSelect2(pnNacionalidad, [{ id: 'CO', name: 'COLOMBIA' }]);

        $(pnNacionalidad).val('CO').trigger('change.select2');
        pnNacionalidad.disabled = true;

        //carga departamentos/ciudades de colombia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

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
        const countries = await API.loadUbiExt();

        fillSelect2(pnNacionalidad, countries, 'Seleccione país', 'id', 'name');
        pnNacionalidad.disabled = false;

        //Departamentos y ciudades colombianas para expedicion y residencia
        const { departamentos, ciudadByDep } = await API.loadUbiNac();

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
            const states = await API.loadStates(countryId);
            fillSelect2(pnEstadoNac, states, 'Seleccione estado', 'id', 'name');
            pnEstadoNac.disabled = false;

            //ciudades
            $(pnEstadoNac).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
                const stateId = this.value;
                const cities = await API.loadCities(stateId);
                fillSelect2(pnCiudadNac, cities, 'Seleccione ciudad', 'id', 'name');
                pnCiudadNac.disabled = false;
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

//funcion que gestiona los select de ubicacion de persona juridica
export async function ubicPJuHandler() {
    //asegura que los datos de ubicacion colombiana esten cargados
    await API.loadUbiData();

    $(pjRLNacionalidad).off('change.ubiExtrPais');
    $(pjRLDepartNac).off('change.ubiNac').off('change.ubiExtrEstado');

    //limpia selects y los deshabilita si no es autorellenado
    const selectClear = [pjDepartDirPrincipal, pjCiudadDirPrincipal, pjRLNacionalidad, pjRLDepartNac, pjRLCiudadNac, pjRLDepExpDoc, pjRLCiuExpDoc];
    selectClear.forEach(sel => {
        $(sel).empty();
        if (!isAutoFilling) {
            $(sel).prop("disabled", true);
        }
    });

    //datos de ubicacion colombiana
    const handleDeptChange = (depSelect, citySelect) => {
        $(depSelect).off('change.ubiNac').on('change.ubiNac', function () {
            const dep = this.value.trim().toUpperCase();
            const municipios = ubi_CiudadByDep[dep] || [];
            fillSelect2(citySelect, municipios, 'Seleccione ciudad');
            citySelect.disabled = municipios.length === 0;
        });
    };

    //departamento y ciudad direccion principal
    if (pjDepartDirPrincipal.options.length <= 1) {
        fillSelect2(pjDepartDirPrincipal, ubi_Departamentos, 'Seleccione departamento');
        pjDepartDirPrincipal.disabled = false;
    }

    handleDeptChange(pjDepartDirPrincipal, pjCiudadDirPrincipal);

    //departamento y ciudad expedicion documento representante legal
    fillSelect2(pjRLDepExpDoc, ubi_Departamentos, 'Seleccione departamento');
    pjRLDepExpDoc.disabled = false;
    handleDeptChange(pjRLDepExpDoc, pjRLCiuExpDoc);

    //ubicacion nacimiento de representante legal
    const nac = pjRLTipNacionalidad.value;
    if (nac === 'Nacional') {
        //pais fijo colombia
        fillSelect2(pjRLNacionalidad, [{ id: 'CO', name: 'COLOMBIA' }]);
        $(pjRLNacionalidad).val('CO').trigger('change.select2');
        pjRLNacionalidad.disabled = true;

        //depatamento y ciudad colombianos
        fillSelect2(pjRLDepartNac, ubi_Departamentos, 'Seleccione departamento');
        pjRLDepartNac.disabled = false;
        handleDeptChange(pjRLDepartNac, pjRLCiudadNac);
    }
    else if (nac === 'Extranjero') {
        //carga paises
        const countries = await API.loadUbiExt();
        fillSelect2(pjRLNacionalidad, countries, 'Seleccione país', 'id', 'name');
        pjRLNacionalidad.disabled = false;

        //Estados y ciudades para país seleccionado
        $(pjRLNacionalidad).off('change.ubiExtrPais').on('change.ubiExtrPais', async function () {

            const countryId = this.value;
            //estados
            const states = await API.loadStates(countryId);
            fillSelect2(pjRLDepartNac, states, 'Seleccione estado', 'id', 'name');
            pjRLDepartNac.disabled = false;

            //ciudades
            $(pjRLDepartNac).off('change.ubiExtrEstado').on('change.ubiExtrEstado', async function () {
                const stateId = this.value;
                const cities = await API.loadCities(stateId);
                fillSelect2(pjRLCiudadNac, cities, 'Seleccione ciudad', 'id', 'name');
                pjRLCiudadNac.disabled = false;
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
        input.addEventListener('blur', () => {
            if (input.value.trim() !== "") {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
}

//funcion que gestiona los select de ubicacion del provForm
export async function ubicProvFormHandler() {

    //si es autorellenado no limpia los selects de ubicacion
    if (!isAutoFilling) {
        [pvPorPais, pvDepartDec, pvCiudadDec].forEach(sel => {
            $(sel).empty().prop("disabled", true);
        });
    }

    //limpia actividad economica y codigo CIIU si no es autorellenado o si lo es
    if (!isAutoFilling || isAutoFilling) {
        [pvAcEconomica, pvCodCIIU, pvEntidad].forEach(sel => {
            $(sel).val(null).trigger('change');
        })
    }

    //carga pais extranjero de porcentaje origen de capital
    const countries = await API.loadUbiExt();
    fillSelect2(pvPorPais, countries, 'Seleccione país', 'id', 'name');
    pvPorPais.disabled = false;

    //carga departamento y ciudad de declaracion
    const { departamentos, ciudadByDep } = await API.loadUbiNac();

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

    //asigna los campos simples excepto los que requieren logica especial
    const skipCampos = [
        'pnTipoNacionalidad', 'pnTipoDoc', 'pnNacionalidad',
        'pnEstadoNac', 'pnCiudadNac', 'pnDepExpDoc',
        'pnCiuExpDoc', 'pnDepRes', 'pnCiudadRes', 'Nit',
        'pnCelular', 'pnTelefono'
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

    //ubicacion

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

//funcion para precargar datos en el formulario de proveedor general (provForm)
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

    //asigna los campos simples excepto los que requieren logica especial
    const skipCampos = [
        'pvPorPais', 'pvDepartDec', 'pvCiudadDec',
        'pvAcEconomica', 'pvCodCIIU', 'pvEntidad'
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

    togglePvTE();
    togglePvPais();
    togglePvGC();
    togglePvDIC();
    togglePvAR();
    togglePvCB();

    isAutoFilling = false;
}

//funcion para precargar datos de proveedores_Master
export async function loadMasterData(masterData, formId, idNum) {

    const cleanTel = masterData.telefono ? masterData.telefono.replace(/\s+/g, '') : "";

    if (formId === 'persNatuForm') {
        //precarga los campos que coincida con la data de master
        document.getElementById('pnNombreCompl').value = masterData.nombre || '';
        document.getElementById('pnDiResidencia').value = masterData.direccion || '';
        document.getElementById('pnEmail').value = masterData.correo || '';

        const pnInpNumId = document.getElementById('pnNumId');
        if (pnInpNumId) {
            document.getElementById('pnNumId').value = idNum;
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
        document.getElementById('pjDirPrincipal').value = masterData.direccion || '';
        document.getElementById('pjEmailDirPrincipal').value = masterData.correo || '';

        await waitSafeSetPhone('pjTelDirPrincipal', cleanTel);

        const pjInpNumId = document.getElementById('pjNIT');
        if (pjInpNumId) {
            document.getElementById('pjNIT').value = idNum;
        }

        document.getElementById('pvDeAuRepresentacion').value = masterData.nombre || '';
    }
}


//logica para campos form general (provForm)
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
export function togglePvTE() {
    const siOtra = document.getElementById('pvEmOtra').checked;
    const inpTE = document.getElementById('pvOtrTipEmp');
    const labTE = document.querySelector('label[for="pvOtrTipEmp"]');
    if (siOtra) {
        inpTE.classList.remove('no-edit');
        labTE.classList.remove('disabled-label');
        inpTE.required = true;
    } else {
        pvOtrTipEmp.value = '';
        inpTE.classList.add('no-edit');
        labTE.classList.add('disabled-label');
        inpTE.required = false;
    }
}
export function togglePvPais() {
    const hasValue = pvPorExtranjero.value.trim().length > 0;
    $(pvPorPais).prop('disabled', !hasValue).trigger('change.select2');
    if (!hasValue) {
        $(pvPorPais).val(null).trigger('change.select2');
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
        inpGC.forEach(el => el.classList.add('no-edit'));
        labGC.forEach(el => el.classList.add('disabled-label'));
        inpGC.forEach(el => el.required = false);
    }
}
export function togglePvDIC() {
    const si = document.getElementById('pvDeclIndComSi').checked;
    const selDIC = [document.getElementById('pvDepartDec'), document.getElementById('pvCiudadDec')];
    if (si) {
        selDIC.forEach(el => $(el).prop('disabled', false).trigger('change.select2'));
        selDIC.forEach(el => $(el).required = true);
    } else {
        selDIC.forEach(el => $(el).prop('disabled', true).trigger('change.select2'));
        selDIC.forEach(el => $(el).val(null).trigger('change.select2'));
        selDIC.forEach(el => $(el).required = false);
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
        inpAR.classList.add('no-edit');
        labAR.classList.add('disabled-label');
        inpAR.required = false;
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
        $(pvEntidad).prop('disabled', false).trigger('change.select2');
        pvEntidad.required = true;
        $(pvClasCueBan).prop('disabled', false).trigger('change');
        pvClasCueBan.required = true;
    } else {
        pvNumCueBanc.value = '';
        inpCB.classList.add('no-edit');
        labCB.classList.add('disabled-label');
        inpCB.required = false;
        $(pvEntidad).prop('disabled', true).trigger('change.select2');
        $(pvEntidad).val(null).trigger('change.select2');
        pvEntidad.required = false;
        $(pvClasCueBan).prop('disabled', true).trigger('change');
        $(pvClasCueBan).val(null).trigger('change');
        pvClasCueBan.required = false;
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
    newSucursalDiv.className = 'sucursal-item justify-content-around align-items-center flex-row m-2 p-2';
    newSucursalDiv.id = `sucursal_${newIndex}`;
    newSucursalDiv.innerHTML = `
                    <h4>Dirección sucursal ${newIndex}</h4>
                    <div class="d-flex">
                        <div class="col-md-4 form-group input-wrapper">
                            <input type="text" id="pjDirSucursal_${newIndex}" name="pjDirSucursal_${newIndex}" class="form-control" autocomplete="off" required />
                            <label for="pjDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="Dirección Sucursal *" alt="Dirección Sucursal *"></label>
                        </div>
                        <div class="col-md-4 form-group d-block custom-input-group">
                            <label for="pjDepartDirSucursal_${newIndex}" class="form-label">Departamento *</label>
                            <select id="pjDepartDirSucursal_${newIndex}" name="pjDepartDirSucursal_${newIndex}" class="form-control" required></select>
                        </div>
                        <div class="col-md-4 form-group d-block custom-input-group">
                            <label for="pjCiudadDirSucursal_${newIndex}" class="form-label">Ciudad *</label>
                            <select id="pjCiudadDirSucursal_${newIndex}" name="pjCiudadDirSucursal_${newIndex}" class="form-control" required></select>
                        </div>
                    </div>
                    <div class="d-flex justify-content-around align-items-center flex-row m-2 p-2">
                        <div class="col-md-6 form-group input-wrapper">
                            <input type="email" id="pjEmailDirSucursal_${newIndex}" name="pjEmailDirSucursal_${newIndex}" class="form-control" required />
                            <label for="pjEmailDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="E-mail *" alt="E-mail *"></label>
                        </div>
                        <div class="col-md-6 form-group input-wrapper">
                            <input type="tel" id="pjTelDirSucursal_${newIndex}" name="pjTelDirSucursal_${newIndex}" class="form-control" required />
                            <label for="pjTelDirSucursal_${newIndex}" class="form-label adaptive-label" placeholder="Teléfono *" alt="Teléfono *"></label>
                        </div>
                        <div class="form-group">
                            <button type="button" class="remove-sucursal-btn button-group btn btn-primary">Remover Sucursal</button>
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
}

//logica para agregar y remover filas a la tabla de control Persona Juridica
export function addControlRow() {
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

//funcion para precargar nombres de los docs de uploadDocsForm
export function loadDocsForm(data, isOEAValue) {
    const form = document.getElementById('uploadDocsForm');
    if (!form) return

    //limpieza inicial
    form.querySelectorAll('input').forEach(el => {
        if (el.type === 'radio' || el.type === 'checkbox') {
            el.checked = false;
        } else {
            el.value = '';
        }

        el.classList.remove('file-existing');
        el.removeAttribute('data-file-name');
    });

    form.querySelectorAll('.btn-clear-file').forEach(btn => btn.style.display = 'none');

    const containerYesOEA = document.getElementById('sectionYesOEA');
    if (containerYesOEA) containerYesOEA.style.display = 'none';

    const containerNoOEA = document.getElementById('sectionNoOEA');
    if (containerNoOEA) containerNoOEA.style.display = 'none';


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

            const input = document.getElementById(categoria);
            if (input) {
                input.setAttribute('data-file-name', nombre);
                input.classList.add('file-existing');

                const container = input.closest('.custom-file-container');
                if (container) {
                    const btn = container.querySelector('.btn-clear-file');
                    if (btn) btn.style.display = 'flex';
                }
            }
        });
    }

    const magnetic = document.getElementById('upContingMeMagnetico');
    const firmada = document.getElementById('upContingFirmada');

    if (magnetic && magnetic.classList.contains('file-existing')) {
        blockExcl('upContingFirmada', true);
    } else if (firmada && firmada.classList.contains('file-existing')) {
        blockExcl('upContingMeMagnetico', true);
    }
}

//logica para visualizacion de campos de uploadDocsForm y boton "x"
export function fileHandler() {
    const form = document.getElementById('uploadDocsForm');
    if (!form) return;

    const fileContainers = form.querySelectorAll('.custom-file-container');

    //campos excluyentes
    const exclusiones = {
        'upContingMeMagnetico': 'upContingFirmada',
        'upContingFirmada': 'upContingMeMagnetico'
    };

    fileContainers.forEach(f => {
        const input = f.querySelector('input[type="file"]');
        const btnClear = f.querySelector('.btn-clear-file');

        input.addEventListener('change', (e) => {
            const files = e.target.files;

            if (files.length > 0) {

                let displaytext = files.length > 1
                    ? `${files.length} archivos seleccionados`
                    : files[0].name;

                input.setAttribute('data-file-name', displaytext);
                input.classList.add('file-existing');

                if (btnClear) btnClear.style.display = 'flex';

                if (exclusiones[input.id]) {
                    blockExcl(exclusiones[input.id], true);
                }
            }
        });

        if (btnClear) {
            btnClear.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                input.value = '';
                input.classList.remove('file-existing');
                input.removeAttribute('data-file-name');
                btnClear.style.display = 'none';

                if (exclusiones[input.id]) {
                    blockExcl(exclusiones[input.id], false);
                }

                if (typeof hasValue === "function") hasValue();
            });
        }
    });
}
function blockExcl(targetId, bloquear) {
    const targInput = document.getElementById(targetId);
    if (!targInput) return;

    const container = targInput.closest('.custom-file-container');
    const label = container.querySelector('label');

    if (bloquear) {
        targInput.classList.add('no-edit');
        targInput.required = false;
        if (label) label.classList.add('disabled-label')
    } else {
        targInput.classList.remove('no-edit');
        targInput.required = true;
        if (label) label.classList.remove('disabled-label');
    }
}

export function toggleOEA() {
    const si = document.getElementById('upOEAsi').checked;
    const no = document.getElementById('upOEAno').checked;
    const containerYesOEA = document.getElementById('sectionYesOEA');
    const containerNoOEA = document.getElementById('sectionNoOEA');
    if (si) {
        containerNoOEA.style.display = 'none';
        containerNoOEA.querySelectorAll('input').forEach(i => i.value = '');
        containerNoOEA.querySelectorAll('input').forEach(i => i.required = false);

        containerYesOEA.style.display = 'block';
        containerYesOEA.querySelectorAll('input').forEach(i => i.required = true);
    } else if (no) {
        containerYesOEA.style.display = 'none';
        containerYesOEA.querySelectorAll('input').forEach(i => i.value = '');
        containerYesOEA.querySelectorAll('input').forEach(i => i.required = false);

        containerNoOEA.style.display = 'block';
        containerNoOEA.querySelectorAll('input').forEach(i => i.required = true);
    } else {
        containerYesOEA.style.display = 'none';
        containerYesOEA.querySelectorAll('input').forEach(i => i.value = '');
        containerYesOEA.querySelectorAll('input').forEach(i => i.required = false);

        containerNoOEA.style.display = 'none';
        containerNoOEA.querySelectorAll('input').forEach(i => i.value = '');
        containerNoOEA.querySelectorAll('input').forEach(i => i.required = false);
    }


}