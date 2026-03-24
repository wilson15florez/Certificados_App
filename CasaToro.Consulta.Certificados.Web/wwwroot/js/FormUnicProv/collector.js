import { existingFiles, tempFiles, unformatCurrency } from './helpers-ui.js';
import { telInst } from './constant.js';

/**
 * Recopila todos los datos del formulario de persona natural (persNatuForm)
 * y los estructura en un objeto listo para enviar al backend.
 * Campos con valor vacío se mapean a null para evitar enviar strings vacíos a la DB.
 * Teléfonos se obtienen con getNumber() de intl-tel-input (formato E.164).
 * PEP: si pnPEP !== 'Si', fuerza PEPTypes=[] y pnPEP_Entidad=null.
 * Ubicaciones: fuerza null si el valor está vacío (select no seleccionado).
 * @returns {Object} Datos del formulario listos para el endpoint AddProviderNatural/UpdateProviderNatural.
 */
export function collectFormData_Natural() {
    const form = document.getElementById('persNatuForm');
    const data = {};

    //recopila campos simples
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], select, textarea')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = el.value.trim() !== "" ? el.value.toUpperCase().trim() : null;
        });

    //recopila campos de telefono con el plugin intl-tel-input
    form.querySelectorAll('input[type="tel"]')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = telInst[el.name].getNumber() !== "" ? telInst[el.name].getNumber() : null;
        });

    //recopila Nacionalidad, Tipo de Documento y Nit
    data.pnTipoNacionalidad = document.getElementById('pnTipoNacionalidad').value || null;
    data.pnTipoDoc = document.getElementById('pnTipoDoc').value || null;
    data.Nit = document.getElementById('pnNumId').value.trim() !== "" ? document.getElementById('pnNumId').value.trim() : null;

    //radios y checkboxes
    const radioGroups = [
        'pnReconoPublic',
        'pnManRePub',
        'pnPEP'
    ];
    //recopila radios
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
        data.pnPEP_Entidad = entidad !== "" ? entidad.toUpperCase() : null;
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

    return data;
}

/**
 * Recopila todos los datos del formulario de persona jurídica (persJuriForm)
 * incluyendo sucursales y accionistas, y los estructura para el backend.
 * Sucursales: solo se incluyen las que tienen Dirección informada (filter).
 * Accionistas: solo se incluyen los que tienen razonSocial informada (filter).
 * Teléfonos usan intl-tel-input. Ubicaciones vacías se fuerzan a null.
 * @returns {Object} Datos listos para AddProviderJuridica/UpdateProviderJuridica.
 */
export function collectFormData_Juridica() {
    const form = document.getElementById('persJuriForm');
    const data = {};

    //recopila campos simples
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], select, textarea')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = el.value.trim() !== "" ? el.value.toUpperCase().trim() : null;
        });

    //recopila campos de telefono con el plugin intl-tel-input
    form.querySelectorAll('input[type="tel"]')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = telInst[el.name].getNumber() !== "" ? telInst[el.name].getNumber() : null;
        });

    //recopila las sucursales
    data.Sucursales_PJuridica = Array.from(document.querySelectorAll('#sucursales-container .sucursal-item')).map((s, idx) => {
        const i = idx + 1;
        return {
            Direccion: document.getElementById(`pjDirSucursal_${i}`)?.value.toUpperCase() || null,
            Departamento: document.getElementById(`pjDepartDirSucursal_${i}`)?.value || null,
            Ciudad: document.getElementById(`pjCiudadDirSucursal_${i}`)?.value || null,
            Email: document.getElementById(`pjEmailDirSucursal_${i}`)?.value.toUpperCase() || null,
            Telefono: telInst[`pjTelDirSucursal_${i}`]?.getNumber() || null
        };
    }).filter(s => s.Direccion);

    //recopila accionistas
    data.AccionistasControlPJuridica = Array.from(document.querySelector('#control-table tbody').querySelectorAll('.control-row')).map(row => ({
        razonSocial: row.querySelector('[name="controlRazonSocial[]"]')?.value.toUpperCase() || null,
        idType: row.querySelector('[name="controlIdType[]"]')?.value || null,
        idNum: row.querySelector('[name="controlIdNum[]"]')?.value || null,
        porcentaje: row.querySelector('[name="controlPorcentaje[]"]')?.value || null
    })).filter(a => a.razonSocial);

    //recopila Nacionalidad, Tipo de Documento y Nit
    data.Nit = document.getElementById('pjNIT').value.trim() !== "" ? document.getElementById('pjNIT').value.trim() : null;
    data.pjRLTipNacionalidad = document.getElementById('pjRLTipNacionalidad').value || null;
    data.pjRLTipoDoc = document.getElementById('pjRLTipoDoc').value || null;
    data.pjRLDocNum = document.getElementById('pjRLDocNum').value || null;

    //forzar ubicaciones a null por seguridad si estan vacias
    [
        'pjRLDepExpDoc', 'pjRLCiuExpDoc',
        'pjRLDepartNac', 'pjRLCiudadNac',
        'pjRLNacionalidad'
    ].forEach(name => {
        if (!data[name] || data[name] === "") data[name] = null;
    });

    return data;
}

/**
 * Recopila los datos del formulario de información financiera (provForm).
 * Los campos de dinero (pvIngrMens, pvActivos, etc.) se desformatean a número puro
 * usando unformatCurrency antes de enviar.
 * Los radios del subform de declaraciones y autorizaciones se recogen aparte
 * porque viven fuera del form principal.
 * El NIT se toma del formulario de persona correspondiente según typePerson.
 * @param {'natural'|'juridica'} typePerson - Determina de qué form tomar el NIT.
 * @returns {Object} Datos listos para AddProvFinanceInfo/UpdateProvFinanceInfo.
 */
export function collectProvFormData(typePerson) {
    const form = document.getElementById('provForm');
    const data = {};

    //recopila campos simples
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], select, textarea')
        .forEach(el => {
            if (!el.name) return;
            data[el.name] = el.value.trim() !== "" ? el.value.toUpperCase().trim() : null;
        });

    //radios
    const radioGroups = [
        'pvGrCon', 'pvDeclIndCom',
        'pvAutRet', 'pvPosCuBan',
        'pvOpeCExt', 'pvCeOEA', 'pvCeCal', 'pvCeBASC', 'pvCeAmb', 'pvCe28000', 'pvCeSST'
    ];

    radioGroups.forEach(rname => {
        const checked = form.querySelector(`input[name="${rname}"]:checked`);
        data[rname] = checked ? checked.value : null;
    });


    //Agrega datos del subform declaraciones y autorizaciones
    data["pvDeAuRepresentacion"] = document.getElementById('pvDeAuRepresentacion').value.toUpperCase().trim();
    data["pvFuenteRecur"] = document.getElementById('pvFuenteRecur').value.toUpperCase().trim();

    const sbFormRadios = [
        'pvTDPMotMaq', 'pvTDPCasTor', 'pvTDPBonap',
        'pvRadAut', 'pvCumCSIn'
    ];

    sbFormRadios.forEach(rname => {
        const checked = document.querySelector(`input[name="${rname}"]:checked`);
        data[rname] = checked ? checked.value : null;
    });


    //Agrega Nit desde el campo id del respectivo form para el foreign key en DB
    if (typePerson === 'natural') {
        data["Nit"] = document.getElementById('pnNumId').value.trim() !== "" ? document.getElementById('pnNumId').value.trim() : null;
    } else if (typePerson === 'juridica') {
        data["Nit"] = document.getElementById('pjNIT').value.trim() !== "" ? document.getElementById('pjNIT').value.trim() : null;
    }
    

    //forzar ubicaciones a null por seguridad si estan vacias
    [
        'pvPorPais', 'pvDepartDec', 'pvCiudadDec'
    ].forEach(name => {
        if (!data[name] || data[name] === "") data[name] = null;
    });

    //formatea campos de dinero a solo numeros
    const skpCamposDinero = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos',
        'pvPasivos', 'pvPatrimonio', 'pvOtrIngr',
        'pvCapSocReg'
    ];
    skpCamposDinero.forEach(campo => {
        const el = document.getElementById(campo).value;
        data[campo] = el !== '' ? unformatCurrency(el) : null;
    });

    return data;
}

/**
 * Recopila los datos del formulario de documentos (uploadDocsForm) y los
 * estructura en un FormData para envío multipart al backend.
 * - Archivos nuevos: se toman de tempFiles (archivos seleccionados pero aún no guardados).
 * - Archivos existentes: se envía existingFilesJSON con el mapa de archivos a conservar
 *   (el backend marca como Inactivo los que no aparezcan en esta lista).
 * - Si personType es null (flujo proveedor), el backend obtiene el NIT del claim de sesión.
 * @param {string|null} [personType=null] - Tipo de persona. Si tiene valor, agrega Nit y personType al FormData.
 * @returns {FormData} FormData listo para sendFiles.
 */
export function collectDocsForm(personType = null) {
    const form = document.getElementById('uploadDocsForm');
    const formData = new FormData();

    if (personType) {
        formData.append('Nit', document.getElementById('idNum').value.trim());
        formData.append('personType', document.getElementById('personType').value === 'natural' ? 'PersonaNatural' : 'PersonaJuridica');
    }
    
    const checked = form.querySelector('input[name="upOEA"]:checked');
    formData.append('isOEA', checked ? checked.value : 'No');

    // Enviar Archivos nuevos
    Object.keys(tempFiles).forEach(inputId => {
        tempFiles[inputId].forEach(file => {
            formData.append(inputId, file);
        });
    });

    // Enviar lista de archivos que permanecen (no eliminados), si esta en la DB pero no en la lista lo eliminamos
    formData.append('existingFilesJSON', JSON.stringify(existingFiles));

    return formData;
}