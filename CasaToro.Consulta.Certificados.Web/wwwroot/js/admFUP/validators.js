import { createAlert } from './ui-handlers.js';
import { regexEmail } from './constant.js';
import { telInst } from './utils-phone.js';

//Validacion de campos del form Persona natural
export function validateNaturalForm() {
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
        'pnDiResidencia', 'pnDepRes', 'pnCiudadRes', 'pnCelular',
        'pnEmail', 'pnActividad'
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

    const itiTel = telInst['pnTelefono'];
    const itiCel = telInst['pnCelular'];

    //valida celular (obligatorio)
    if (!itiCel.isValidNumber()) {
        createAlert('Por favor ingrese un número de celular válido para el país seleccionado.', 'danger');
        return false;
    }

    //valida telefono fijo (si fue diligenciado)
    if (document.getElementById('pnTelefono').value.trim() !== '') {
        if (!itiTel.isValidNumber()) {
            createAlert('Por favor ingrese un número de teléfono fijo válido para el país seleccionado.', 'danger');
            return false;
        }
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
export function validateJuridicaForm() {
    const form = document.getElementById('persJuriForm');
    alertContainer.innerHTML = '';

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pjRazSocial', 'pjDirPrincipal', 'pjDepartDirPrincipal', 'pjCiudadDirPrincipal',
        'pjEmailDirPrincipal', 'pjTelDirPrincipal', 'pjNomReLeg', 'pjRLDocNum',
        'pjRLFechExpDoc', 'pjRLFechaNac', 'pjRLDepExpDoc', 'pjRLCiuExpDoc',
        'pjRLNacionalidad', 'pjRLDepartNac', 'pjRLCiudadNac'
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
    const itiTelPrinc = telInst['pjTelDirPrincipal'];
    if (!itiTelPrinc.isValidNumber()) {
        createAlert('Por favor ingrese un número de teléfono válido para el país seleccionado.', 'danger');
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

        const itiTelSucur = telInst[`pjTelDirSucursal_${idx}`];
        if (!itiTelSucur.isValidNumber()) {
            createAlert(`Por favor ingrese un número de teléfono válido para el país seleccionado en la sucursal ${idx}.`, 'danger');
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

        //se rquiere porcentaje minimo del 5%
        if (porcentaje < 5) {
            createAlert(`El porcentaje de participación debe ser al menos del 5% en la fila ${i + 1}.`, 'danger');
            return false;
        }

        totalPorc += porcentaje;
    }

    if (totalPorc < 100) {
        createAlert(`La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), es menor al 100%.
                    Por favor ajuste los valores antes de guardar.`, 'danger');
        return false;
    }

    if (totalPorc > 100) {
        createAlert(`La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), supera el 100%.
                    Por favor ajuste los valores antes de guardar.`, 'danger');
        return false;
    }

    //valida que representante legal sea nacional o extranjero
    if (!pjRLTipNacionalidad.value) {
        createAlert('Seleccione si el representante legal es Nacional o Extranjero.', 'danger');
        pjRLTipNacionalidad.focus();
        return false;
    }

    //verifica tipo de documento
    if (!pjRLTipoDoc.value) {
        createAlert('Por favos seleccione el tipo de documento correspondiente.', 'danger');
        pjRLTipoDoc.focus();
        return false;
    }

    return true;
}

//validacion de campos del form formato unico
export function validateProvForm() {

    const form = document.getElementById('provForm');
    alertContainer.innerHTML = '';

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos',
        'pvPatrimonio', 'pvOtrIngr', 'pvOtrTipEmp', 'pvPorNacional', 'pvPorPais',
        'pvAcEconomica', 'pvCodCIIU', 'pvCapSocReg', 'pvFechConst',
        'pvFechVen', 'pvFechResolGC', 'pvNumResolGC', 'pvDepartDec',
        'pvCiudadDec', 'pvNumResDIAN', 'pvEntidad',
        'pvNumCueBanc', 'pvClasCueBan', 'pvDeAuRepresentacion', 'pvFuenteRecur'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || el.disabled || !el.required) continue;
        if (!el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? label.textContent.replace(':', '').trim() : id;
            createAlert(`El campo "${labelText}" es obligatorio.`, 'danger');
            el.focus();
            return false;
        }
    }

    //verifica porcentaje capital nacional y/o extranjero
    let totalPorc = 0;
    const porcNac = parseFloat(pvPorNacional.value.trim() || 0);
    const porcExtr = parseFloat(pvPorExtranjero.value.trim() || 0);
    if (porcNac == 0) {
        createAlert('El porcentaje de capital nacional no puede ser cero (0).', 'danger');
        return false;
    }
    if (porcExtr != 0) {
        totalPorc = porcNac + porcExtr;
        if (totalPorc !== 100) {
            createAlert('La suma del porcentaje de capital nacional y extranjero debe ser igual a cien (100).', 'danger');
            return false;
        }
    } else if (porcNac !== 100) {
        createAlert('El porcentaje de capital nacional debe ser igual a cien (100) si no hay capital extranjero.', 'danger');
        return false;
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
    const pvTDPMotMaq = document.querySelectorAll('input[name="pvTDPMotMaq"]');
    if (!pvTDPMotMaq) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para MOTORYSA S.A.', 'danger');
        return false;
    }

    const pvTDPCasTor = document.querySelectorAll('input[name="pvTDPCasTor"]');
    if (!pvTDPCasTor) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para CASATORO S.A.', 'danger');
        return false;
    }

    const pvTDPBonap = document.querySelectorAll('input[name="pvTDPBonap"]');
    if (!pvTDPBonap) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para BONAPARTE S.A.S.', 'danger');
        return false;
    }

    const pvTDPBellpi = document.querySelectorAll('input[name="pvTDPBellpi"]');
    if (!pvTDPBellpi) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos para BELLPI S.A.S.', 'danger');
        return false;
    }

    const pvRadAut = document.querySelectorAll('input[name="pvRadAut"]');
    if (!pvRadAut) {
        createAlert('Por favor seleccione si autoriza el tratamiento de datos.', 'danger');
        return false;
    }

    return true;
}

//validacion de documentos cargados en form documentos
export function validateDocsForm() {
    const form = document.getElementById('uploadDocsForm');
    const files = form.querySelectorAll('input[type="file"]');
    const maxSizeMB = 4 * 1024 * 1024;
    const exptensionVal = /(\.pdf)$/i;

    //verifica que los inputs esten llenos
    const requiredFields = [
        'upCamaraComercio', 'upCertifiBancaria', 'upRUTActualizado', 
        'upComposicionAccionaria', 'upFotocopiaCC', 'upEstadoFinanciero', 'upCertificacionesVarias'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el) continue;

        const hasNewFile = el.files.length > 0;
        const hasExistFile = el.classList.contains('file-existing');

        if (!hasNewFile && !hasExistFile) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            createAlert(`El campo "${labelText}" es obligatorio.`, 'danger');
            el.focus();
            return false;
        }
    }

    //verifica que sean dos referencias comerciales
    const refComerc = document.getElementById('upRefeComerciales');
    if (!refComerc.classList.contains('file-existing') && refComerc.files.length !== 2) {
        if (refComerc.files.length > 0 && refComerc.files.length !== 2) {
            createAlert('Por favor ingrese dos (2) referencias comerciales', 'danger');
            return false;
        }
    }

    //verifica si es OEA y de ser asi verifica documentos
    if (!form.querySelector('input[name="upOEA"]:checked')) {
        createAlert('Por favor seleccione si es Operador Económico Autorizado (OEA).', 'danger');
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
            if (!el) continue;

            const hasNewFile = el.files.length > 0;
            const hasExistFile = el.classList.contains('file-existing');

            if (!hasNewFile && !hasExistFile) {
                const label = document.querySelector(`label[for="${id}"]`);
                const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
                createAlert(`El campo "${labelText}" es obligatorio.`, 'danger');
                el.focus();
                return false;
            }
        }
    }

    //verifica extencion del doc y el peso
    for (const input of files) {
        if (input.files.length > 0) {
            for (const file of input.files) {
                //valida extencion
                if (!exptensionVal.exec(file.name)) {
                    createAlert(`El archivo ${file.name} no es un PDF valido.`, 'danger');
                    input.value = '';
                    return false;
                }

                //valida el peso
                if (file.size > maxSizeMB) {
                    createAlert(`El archivo ${file.name} supera los 4MB.`, 'danger');
                    input.value = '';
                    return false;
                }
            }
        }
    }

    return true;
}