import * as API from './api-client.js';
import * as HUI from './helpers-ui.js';
import * as UI from './ui-handlers.js';
import * as CNS from './constant.js';

//funcion para precargar los datos del formulario persona natural
export async function loadFormData_Natural(data) {
    //bloquea los eventos de cambio para evitar conflictos durante el auto llenado
    UI.setAutoFilling(true);

    const form = document.getElementById('persNatuForm');

    //limpieza inicial
    UI.clearForm(form);

    if (!data) {
        UI.setAutoFilling(false);
        return;
    }

    //tipo nacionalidad
    if (data.pnTipoNacionalidad) {
        $(pnTipoNacionalidad).val(data.pnTipoNacionalidad);

        //tipo de documento segun nacionalidad
        UI.tipDocument();

        await UI.ubicPNaHandler();

        if (data.pnTipoDoc) {
            pnTipoDoc.value = data.pnTipoDoc;
        }
    } else {
        UI.tipDocument();
        await UI.ubicPNaHandler();
    }
    //mapea nit al campo de identificacion
    if (data.Nit) document.getElementById('pnNumId').value = data.Nit;

    await HUI.waitSafeSetPhone('pnCelular', data.pnCelular);
    await HUI.waitSafeSetPhone('pnTelefono', data.pnTelefono);


    //ubicaciones

    //nacimiento
    if (data.pnNacionalidad) {
        const nac = data.pnTipoNacionalidad === 'Nacional' ? 'ubiNac' : 'ubiExtrPais';
        const est = data.pnTipoNacionalidad === 'Nacional' ? 'ubiNac' : 'ubiExtrEstado';
        await UI.loadDepCity(pnNacionalidad, pnEstadoNac, data.pnNacionalidad, nac);

        if (data.pnEstadoNac) {
            await UI.loadDepCity(pnEstadoNac, pnCiudadNac, data.pnEstadoNac, est);
            if (data.pnCiudadNac) await UI.setSelect2Val(pnCiudadNac, data.pnCiudadNac);
        }
    }

    //expedicion
    if (data.pnDepExpDoc) await UI.loadDepCity(pnDepExpDoc, pnCiuExpDoc, data.pnDepExpDoc, 'ubiNac');
    if (data.pnCiuExpDoc) await UI.setSelect2Val(pnCiuExpDoc, data.pnCiuExpDoc);

    //residencia
    if (data.pnDepRes) await UI.loadDepCity(pnDepRes, pnCiudadRes, data.pnDepRes, 'ubiNac');
    if (data.pnCiudadRes) await UI.setSelect2Val(pnCiudadRes, data.pnCiudadRes);

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

    UI.setOriginalPEP(Array.isArray(data.PEPTypes) ? [...data.PEPTypes] : [], data.pnPEP_Entidad || '');

    const entidadInput = document.getElementById('pnPEP_Entidad');
    if (entidadInput) entidadInput.value = data.pnPEP_Entidad || '';

    UI.handlePEPChange();

    UI.setAutoFilling(false);
}

//funcion para precargar los datos del formulario persona juridica
export async function loadFormData_Juridica(data) {
    //bloquea los eventos de cambio para evitar conflictos durante el auto llenado
    UI.setAutoFilling(true);

    const form = document.getElementById('persJuriForm');

    //limpieza
    UI.clearForm(form);

    if (!data) {
        UI.setAutoFilling(false);
        return;
    }

    //mapea nit
    if (data.Nit) document.getElementById('pjNIT').value = data.Nit;

    await HUI.waitSafeSetPhone('pjTelDirPrincipal', data.pjTelDirPrincipal);

    //precarga las sucursales
    document.querySelectorAll('.sucursal-item').forEach(item => item.remove());
    if (data.Sucursales && Array.isArray(data.Sucursales) && data.Sucursales.length > 0) {

        for (let index = 0; index < data.Sucursales.length; index++) {
            addSucursalBtn.click();
            const suc = data.Sucursales[index];
            const i = index + 1;

            //limite de seguridad para el autorellenado
            if (i > UI.maxSucursales) break;

            if (i > 1) {
                await UI.waitForOptions(document.getElementById(`pjDepartDirSucursal_${i}`));
            }

            //llenar campos de texto
            document.getElementById(`pjDirSucursal_${i}`).value = suc.pjSucursalDir || '';
            document.getElementById(`pjEmailDirSucursal_${i}`).value = suc.pjSucursalEmail || '';
            await HUI.waitSafeSetPhone(`pjTelDirSucursal_${i}`, suc.pjSucursalTel);

            //llenar selects de ubicacion de sucursales
            const depSelect = document.getElementById(`pjDepartDirSucursal_${i}`);
            const citySelect = document.getElementById(`pjCiudadDirSucursal_${i}`);

            if (suc.pjSucursalDepart) {
                await UI.setSelect2Val(depSelect, suc.pjSucursalDepart);
                $(depSelect).trigger("change.ubiSUC");
                await UI.waitForOptions(citySelect);
            }
            if (suc.pjSucursalCiudad) {
                await UI.setSelect2Val(citySelect, suc.pjSucursalCiudad);
            }
        }
    }

    //precarga de tabla de accionistas
    UI.controlTableBody.querySelectorAll('.control-row').forEach(item => item.remove());

    if (data.ControlRow && Array.isArray(data.ControlRow) && data.ControlRow.length > 0) {
        data.ControlRow.forEach((row) => {
            UI.addControlRow();

            const currentRow = UI.controlTableBody.lastElementChild;

            currentRow.querySelector('[name="controlRazonSocial[]"]').value = row.razonSocial || '';
            currentRow.querySelector('[name="controlIdType[]"]').value = row.idType || '';
            currentRow.querySelector('[name="controlIdNum[]"]').value = row.idNum || '';
            currentRow.querySelector('[name="controlPorcentaje[]"]').value = row.porcentaje || '';
        });
    } else {
        UI.addControlRow({});
    }

    //precarga de representante legal
    //tipo nacionalidad
    if (data.pjRLTipNacionalidad) {
        $(pjRLTipNacionalidad).val(data.pjRLTipNacionalidad);

        //tipo documento segun nacionalidad
        UI.pjTipDocument();

        if (data.pjRLTipoDoc) {
            pjRLTipoDoc.value = data.pjRLTipoDoc;
        }
    } else {
        UI.pjTipDocument();
    }
    await UI.ubicPJuHandler();
    await UI.ubicPJuReLeHandler();

    //ubicacion

    //diligenciamiento
    if (data.pjDepartDilig) await UI.loadDepCity(pjDepartDilig, pjCiudadDilig, data.pjDepartDilig, 'ubiNac');
    if (data.pjCiudadDilig) await UI.setSelect2Val(pjCiudadDilig, data.pjCiudadDilig);

    //direccion principal
    if (data.pjDepartDirPrincipal) await UI.loadDepCity(pjDepartDirPrincipal, pjCiudadDirPrincipal, data.pjDepartDirPrincipal, 'ubiNac');
    if (data.pjCiudadDirPrincipal) await UI.setSelect2Val(pjCiudadDirPrincipal, data.pjCiudadDirPrincipal);

    //nacimiento
    if (data.pjRLNacionalidad) {
        const rlNac = data.pjRLTipNacionalidad === 'Nacional' ? 'ubiNac' : 'ubiExtrPais';
        const rlEst = data.pjRLTipNacionalidad === 'Nacional' ? 'ubiNac' : 'ubiExtrEstado';
        await UI.loadDepCity(pjRLNacionalidad, pjRLDepartNac, data.pjRLNacionalidad, rlNac);

        if (data.pjRLDepartNac) {
            await UI.loadDepCity(pjRLDepartNac, pjRLCiudadNac, data.pjRLDepartNac, rlEst);
            if (data.pjRLCiudadNac) await UI.setSelect2Val(pjRLCiudadNac, data.pjRLCiudadNac);
        }
    }

    //expedicion
    if (data.pjRLDepExpDoc) await UI.loadDepCity(pjRLDepExpDoc, pjRLCiuExpDoc, data.pjRLDepExpDoc, 'ubiNac');
    if (data.pjRLCiuExpDoc) await UI.setSelect2Val(pjRLCiuExpDoc, data.pjRLCiuExpDoc);

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

    UI.setAutoFilling(false);
}

//funcion para precargar datos en el formulario de informacion financiera (provForm)
export async function loadProvFormData(data) {

    UI.setAutoFilling(true);

    const form = document.getElementById('provForm');

    //limpieza inicial
    UI.clearForm(form);

    if (!data) {
        UI.setAutoFilling(false);
        return;
    }

    //permite que se cargue selects de ubicacion
    await UI.ubicProvFormHandler();

    await UI.waitForOptions(pvDepartDec);
    await UI.waitForOptions(pvCiudadDec);

    //ubicacion pais
    if (data.pvPorPais) await UI.setSelect2Val(pvPorPais, data.pvPorPais);

    //ubicaciones departamento y ciudad de declaracion
    if (data.pvDepartDec) await UI.loadDepCity(pvDepartDec, pvCiudadDec, data.pvDepartDec, 'ubiNac');
    if (data.pvCiudadDec) await UI.setSelect2Val(pvCiudadDec, data.pvCiudadDec);

    //actividad economica y codigo CIIU
    if (data.pvAcEconomica) await UI.setSelect2Val(pvAcEconomica, data.pvAcEconomica);
    if (data.pvCodCIIU) await UI.setSelect2Val(pvCodCIIU, data.pvCodCIIU);

    //entidad bancaria
    if (data.pvEntidad) await UI.setSelect2Val(pvEntidad, data.pvEntidad);

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
            el.value = HUI.formatCurrency(data[campo]);
        }
    });

    //select tipo empresa
    if (data.pvTipEmp) {
        let pvTipoEmpr = data.pvTipEmp;
        pvTipoEmpr = pvTipoEmpr.charAt(0).toUpperCase() + pvTipoEmpr.slice(1).toLowerCase();
        pvTipEmp.value = pvTipoEmpr;
    }

    //radios
    const pvRadiosNames = [
        'pvGrCon', 'pvDeclIndCom', 'pvAutRet', 'pvPosCuBan', 'pvOpeCExt', 'pvCeOEA',
        'pvCeCal', 'pvCeBASC', 'pvCeAmb', 'pvCe28000', 'pvCeSST', 'pvTDPMotMaq',
        'pvTDPCasTor', 'pvTDPBonap', 'pvCumCSIn', 'pvRadAut'
    ];
    pvRadiosNames.forEach(name => {
        if (data[name]) {
            const r = document.querySelector(`input[name="${name}"][value="${data[name]}"]`);
            if (r) r.checked = true;
        }
    })

    UI.togglePvPais();
    UI.togglePvGC();
    UI.togglePvDIC();
    UI.togglePvAR();
    UI.togglePvCB();
    UI.togglePvCoEx();

    UI.setAutoFilling(false);
}

//funcion para precargar datos de proveedores_Master
export async function loadMasterData(masterData, formId, idNum, suggest) {

    const cleanTel = masterData.telefono ? masterData.telefono.replace(/\s+/g, '') : "";

    if (formId === 'persNatuForm') {
        //precarga los campos que coincida con la data de master
        document.getElementById('pnPrimerApell').value = suggest.firstSurname || '';
        document.getElementById('pnSegundoApell').value = suggest.secondSurname || '';
        document.getElementById('pnNombres').value = suggest.names || '';
        document.getElementById('pnEmail').value = masterData.correo || '';

        const pnInpNumId = document.getElementById('pnNumId');
        if (pnInpNumId) document.getElementById('pnNumId').value = idNum;

        const inputDir = document.getElementById('pnDiResidencia');
        if (inputDir && masterData.direccion) {
            inputDir.value = masterData.direccion;
            // LLAMADA CLAVE: Validar apenas se pone el valor
            HUI.parseDirection(inputDir);
        }

        const isFijo = cleanTel.startsWith('60') || cleanTel.startsWith('+5760');

        //asigna el telefono al campo correspondiente
        if (isFijo) {
            await HUI.waitSafeSetPhone('pnTelefono', cleanTel);
            await HUI.waitSafeSetPhone('pnCelular', '');
        } else {
            await HUI.waitSafeSetPhone('pnCelular', cleanTel);
            await HUI.waitSafeSetPhone('pnTelefono', '');
        }

        document.getElementById('pvDeAuRepresentacion').value = masterData.nombre || '';
    }
    else if (formId === 'persJuriForm') {
        //precarga los campos que coincida con la data de master
        document.getElementById('pjRazSocial').value = masterData.nombre || '';
        document.getElementById('pjEmailDirPrincipal').value = masterData.correo || '';

        await HUI.waitSafeSetPhone('pjTelDirPrincipal', cleanTel);

        const pjInpNumId = document.getElementById('pjNIT');
        if (pjInpNumId) document.getElementById('pjNIT').value = idNum;

        const inputDir = document.getElementById('pjDirPrincipal');
        if (inputDir && masterData.direccion) {
            inputDir.value = masterData.direccion;
            // LLAMADA CLAVE: Validar apenas se pone el valor
            HUI.parseDirection(inputDir);
        }

        document.getElementById('pvDeAuRepresentacion').value = masterData.nombre || '';
    }
}

//funcion para precargar nombres de los docs de uploadDocsForm
export function loadDocsForm(data, isOEAValue) {
    const form = document.getElementById('uploadDocsForm');
    if (!form) return

    //limpieza de arrays para evitar duplicacion al re-consultar
    for (let key in HUI.existingFiles) delete HUI.existingFiles[key];
    for (let key in HUI.tempFiles) delete HUI.tempFiles[key];
    for (let key in CNS.filePaths) delete CNS.filePaths[key];

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
            UI.toggleOEA();
        }
    }

    if (data && data.length > 0) {
        data.forEach(doc => {
            const categoria = doc.categoriaDOC || doc.CategoriaDOC;
            const nombre = doc.nombreArchivo || doc.NombreArchivo;
            const ruta = doc.rutaArchivo || doc.RutaArchivo;

            if (categoria) {
                if (!HUI.existingFiles[categoria]) HUI.existingFiles[categoria] = [];
                HUI.existingFiles[categoria].push(nombre);

                //se guarda la ruta asociada al nombre del archivo
                if (!CNS.filePaths[categoria]) CNS.filePaths[categoria] = {};
                CNS.filePaths[categoria][nombre] = ruta;
            }
        });

        Object.keys(HUI.existingFiles).forEach(categoria => {
            const input = document.getElementById(categoria);
            if (input) {
                input.value = HUI.existingFiles[categoria].join(', ');
                input.classList.add('file-existing');
            }
        });
    }

    CNS.checkExclusiones();
}
