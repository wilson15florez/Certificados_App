import { telInst, tempFiles } from './form-helpers.js';
import { unformatCurrency } from './ui-handlers.js'

//funcion para recopilar los datos del formulario persona natural
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

//funcion para recopilar los datos del formulario persona juridica
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
            telefono: telInst[`pjTelDirSucursal_${i}`]?.getNumber() || null
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

//funcion para recopilar los datos del formulario de informacion financiera
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
    //'pvTipEmp', 
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
        data[campo] = unformatCurrency(el);
    });

    return data;
}

//funcion para recopilar los documentos cargados en el formulario de documentos
export function collectDocsForm(personType = null) {
    const form = document.getElementById('uploadDocsForm');
    const formData = new FormData();

    if (personType) {
        formData.append('Nit', document.getElementById('idNum').value.trim());
        formData.append('personType', document.getElementById('personType').value === 'natural' ? 'PersonaNatural' : 'PersonaJuridica');
    }
    

    const checked = form.querySelector('input[name="upOEA"]:checked');
    formData.append('isOEA', checked ? checked.value : 'No');

    //form.querySelectorAll('input[type="file"]').forEach(input => {
    //    if (input.files.length > 0) {
    //        for (let i = 0; i < input.files.length; i++) {
    //            formData.append(input.id, input.files[i]);
    //        }
    //    }
    //});

    Object.keys(tempFiles).forEach(inputId => {
        const fileArray = tempFiles[inputId];
        fileArray.forEach(file => {
            formData.append(inputId, file);
        });
    });

    return formData;
}