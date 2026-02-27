import { alertErrorBody, alertBody, alertError, alert, regexEmail } from './constant.js';
import { telInst } from './form-helpers.js';


//validacion para una fecha de un mayor de 18 años
function isAdult(dateString) {
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
 * valida si proveedor debe actualizar el Formato Unico de Conocimiento de Proveedores,
 * en base a la fecha de diligenciamiento del formato en la tabla proveedores_master
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
export async function validityFUCP(fechaMaster) {
    const isInvalid = shouldUpdateFUCP(fechaMaster);

    if (isInvalid) {
        alertBody.innerText = 'El formato único de conocimiento de proveedores (FUCP) que se encuentra registrado en el sistema, fue diligenciado en el año anterior. Por favor, revise y actualice la información correspondiente al año vigente.';
        alert.show();
        return true;
    }
    return false;
}

//configuracion de los limites del calendario para los inputs date
export function dateLimits() {
    const today = new Date().toISOString().split('T')[0];

    //selecciona todos los inputs date
    const dateInputs = document.querySelectorAll('input[type="date"]');

    dateInputs.forEach(i => {
        //si no corresponde a la fecha de vencimiento en el form informacion financiera, la fecha maxima es hoy
        if (i.id !== 'pvFechVen') {
            i.setAttribute('max', today);
        }
        //else {
        //    // Para el de vencimiento, opcionalmente podrías ponerle un mínimo (hoy)
        //    // para que no elijan fechas pasadas
        //    input.setAttribute('min', today);
        //}
    });
}

//muestra u oculta el error visual en un campo
export function toggleValidInput(el, isValid, message = 'Este campo es obligatorio.') {
    console.log('toggleValidInput en Validators iniciado');
    if (!el) return;

    //elimina mensajes previos
    const existingError = el.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();

    if (isValid) {
        el.classList.remove('is-invalid-custom');
    } else {
        el.classList.add('is-invalid-custom');
        //crea un elemento para mostrar el mensaje de error
        const errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.innerText = message;
        el.parentNode.appendChild(errorEl);
    }
    console.log('toggleValidInput en Validators ejecutado');
}

//Validacion de campos del form Persona natural
export function validateNaturalForm() {
    const form = document.getElementById('persNatuForm');

    //verifica que sea nacional o extranjero
    if (!pnTipoNacionalidad.value) {
        alertErrorBody.innerText = 'Por favor seleccione si es Nacional o Extranjero.';
        alertError.show();
        pnTipoNacionalidad.focus();
        return false;
    }

    //verifica que tipo de documento este seleccionado
    if (!pnTipoDoc.value) {
        alertErrorBody.innerText = 'Por favor seleccione el tipo de documento correspondiente.';
        alertError.show();
        pnTipoDoc.focus();
        return false;
    }

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pnPrimerApell', 'pnSegundoApell', 'pnNombres', 'pnFechaExpDoc', 
        'pnDepExpDoc', 'pnCiuExpDoc', 'pnNacionalidad', 'pnEstadoNac', 
        'pnCiudadNac', 'pnDiResidencia', 'pnDepRes', 'pnCiudadRes', 
        'pnCelular', 'pnEmail', 'pnActividad'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            alertError.show();
            el.focus();
            return false;
        }
    }

    //valida que fecha de nacimiento corresponda a un mayor de edad(>=18)
    const pnFechaNac = document.getElementById('pnFechaNac').value;
    if (pnFechaNac && !isAdult(pnFechaNac)) {
        alertErrorBody.innerText = 'La persona natural debe ser mayor de edad.';
        alertError.show();
        document.getElementById('pnFechaNac').focus();
        return false;
    }

    const itiTel = telInst['pnTelefono'];
    const itiCel = telInst['pnCelular'];

    //valida celular (obligatorio)
    if (!itiCel.isValidNumber()) {
        alertErrorBody.innerText = 'Por favor ingrese un número de celular válido para el país seleccionado.';
        alertError.show();
        document.getElementById('pnCelular').focus();
        return false;
    }

    //valida telefono fijo (si fue diligenciado)
    if (document.getElementById('pnTelefono').value.trim() !== '') {
        if (!itiTel.isValidNumber()) {
            alertErrorBody.innerText = 'Por favor ingrese un número de teléfono fijo válido para el país seleccionado.';
            alertError.show();
            document.getElementById('pnTelefono').focus();
            return false;
        }
    }

    // verifica email
    const email = document.getElementById('pnEmail').value.trim();

    if (email && !regexEmail.test(email)) {
        alertErrorBody.innerHTML = 'Por favor ingrese un correo electrónico válido.';
        alertError.show();
        return false;
    }

    //verificacion reconocimiento publico
    if (!form.querySelector('input[name="pnReconoPublic"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si tiene reconocimiento publico.';
        alertError.show();
        return false;
    }
    //verificacion manejo de recursos publico
    if (!form.querySelector('input[name="pnManRePub"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si maneja recursos de origen publico.';
        alertError.show();
        return false;
    }

    //verifica PEP y de ser si, valida el check y entidad
    const pepSi = document.getElementById('pnPEPSi').checked;
    const pepNo = document.getElementById('pnPEPNo').checked;

    if (!pepSi && !pepNo) {
        alertErrorBody.innerText = 'Por favor seleccione si es PEP.';
        alertError.show();
        return false;
    }

    if (pepSi) {
        const pepChecks = form.querySelectorAll('input[name="pnPEPType"]:checked');
        const penEntidad = document.getElementById('pnPEP_Entidad').value.trim();

        if (pepChecks.length === 0) {
            alertErrorBody.innerText = 'Por favor seleccione al menos un tipo de PEP.';
            alertError.show();
            return false;
        }
        if (!penEntidad) {
            alertErrorBody.innerText = 'Por favor ingrese la entidad relacionada con el PEP.';
            alertError.show();
            return false;
        }
    }

    return true;
}

//validacion de campos del form persona juridica
export function validateJuridicaForm() {
    const form = document.getElementById('persJuriForm');

    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pjRazSocial', 'pjDepartDilig', 'pjCiudadDilig', 'pjDirPrincipal', 'pjDepartDirPrincipal', 'pjCiudadDirPrincipal',
        'pjEmailDirPrincipal', 'pjTelDirPrincipal', 'pjPrimApeRL', 'pjSegApeRL', 'pjNomReLeg', 
        'pjRLDocNum', 'pjRLFechExpDoc', 'pjRLDepExpDoc', 'pjRLCiuExpDoc', 'pjRLNacionalidad',
        'pjRLDepartNac', 'pjRLCiudadNac'
    ];

    for (const id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            alertError.show();
            el.focus();
            return false;
        }
    }

    //valida telefono principal (fijo o celular)
    const itiTelPrinc = telInst['pjTelDirPrincipal'];
    if (!itiTelPrinc.isValidNumber()) {
        alertErrorBody.innerText = 'Por favor ingrese un número de teléfono válido para el país seleccionado en dirección principal.';
        alertError.show();
        return false;
    }

    //validar email
    const emailPrincipal = document.getElementById('pjEmailDirPrincipal').value.trim();

    if (emailPrincipal && !regexEmail.test(emailPrincipal)) {
        alertErrorBody.innerText = 'Por favor ingrese un correo electrónico válido para la dirección principal.';
        alertError.show();
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
            alertErrorBody.innerText = `Por favor complete todos los campos de la sucursal ${idx}.`;
            alertError.show();
            return false;
        }

        if (!regexEmail.test(email)) {
            alertErrorBody.innerText = `Por favor ingrese un correo electrónico válido para la sucursal ${idx}.`;
            alertError.show();
            return false;
        }

        const itiTelSucur = telInst[`pjTelDirSucursal_${idx}`];
        if (!itiTelSucur.isValidNumber()) {
            alertErrorBody.innerText = `Por favor ingrese un número de teléfono válido para el país seleccionado en la sucursal ${idx}.`;
            alertError.show();
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
            alertErrorBody.innerText = `Por favor complete todos los campos de la fila ${i + 1} en la tabla de accionistas.`;
            alertError.show();
            return false;
        }

        //se rquiere porcentaje minimo del 5%
        if (porcentaje < 5) {
            alertErrorBody.innerText = `El porcentaje de participación debe ser al menos del 5% en la fila ${i + 1}.`;
            alertError.show();
            return false;
        }

        totalPorc += porcentaje;
    }

    if (totalPorc < 100) {
        alertErrorBody.innerText = `La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), es menor al 100%.
                      Por favor ajuste los valores antes de guardar.`;
        alertError.show();
        return false;
    }

    if (totalPorc > 100) {
        alertErrorBody.innerText = `La suma total de los porcentajes de participación es: (${totalPorc.toFixed(2)}%), supera el 100%.
                    Por favor ajuste los valores antes de guardar.`;
        alertError.show();
        return false;
    }

    //valida que representante legal sea nacional o extranjero
    if (!pjRLTipNacionalidad.value) {
        alertErrorBody.innerText = 'Seleccione si el representante legal es Nacional o Extranjero.';
        alertError.show();
        pjRLTipNacionalidad.focus();
        return false;
    }

    //verifica tipo de documento
    if (!pjRLTipoDoc.value) {
        alertErrorBody.innerText = 'Por favos seleccione el tipo de documento correspondiente.';
        alertError.show();
        pjRLTipoDoc.focus();
        return false;
    }

    const pjRLFechaNac = document.getElementById('pjRLFechaNac').value;
    if (pjRLFechaNac && !isAdult(pjRLFechaNac)) {
        alertErrorBody.innerText = 'El respresentante legal debe ser mayor de edad.';
        alertError.show();
        document.getElementById('pjRLFechaNac').focus();
        return false;
    }

    return true;
}

//validacion de campos del provForm (informacion financiera)
export function validateProvForm(personType) {

    const form = document.getElementById('provForm');


    //verifica que los demas campos esten diligenciados
    const requiredFields = [
        'pvIngrMens', 'pvEgrMens', 'pvActivos', 'pvPasivos',
        'pvPatrimonio', 'pvOtrIngr', 'pvTipEmp', 'pvOtrTipEmp', 'pvPorNacional', 'pvPorPais',
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
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            alertError.show();
            el.focus();
            return false;
        }
    }

    //verifica porcentaje capital nacional y/o extranjero
    let totalPorc = 0;
    const porcNac = parseFloat(pvPorNacional.value.trim() || 0);
    const porcExtr = parseFloat(pvPorExtranjero.value.trim() || 0);
    if (porcNac == 0) {
        alertErrorBody.innerText = 'El porcentaje de capital nacional no puede ser cero (0).';
        alertError.show();
        return false;
    }
    if (porcExtr != 0) {
        totalPorc = porcNac + porcExtr;
        if (totalPorc !== 100) {
            alertErrorBody.innerText = 'La suma del porcentaje de capital nacional y extranjero debe ser igual a cien (100).';
            alertError.show();
            return false;
        }
    } else if (porcNac !== 100) {
        alertErrorBody.innerText = 'El porcentaje de capital nacional debe ser igual a cien (100) si no hay capital extranjero.';
        alertError.show();
        return false;
    }

    //verifica tipo de empresa
    //if (!form.querySelector('input[name="pvTipEmp"]:checked')) {
    //    alertErrorBody.innerText = 'Por favor seleccione el tipo de empresa.';
    //    alertError.show();
    //    return false;
    //}

    //verifica gran contribuyente
    if (!form.querySelector('input[name="pvGrCon"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si es gran contribuyente.';
        alertError.show();
        return false;
    }

    //verifica declaracion de industria y comercio
    if (!form.querySelector('input[name="pvDeclIndCom"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si declara impuesto de industria y comercio.';
        alertError.show();
        return false;
    }

    //verifica auto retenedor
    if (!form.querySelector('input[name="pvAutRet"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si es auto retenedor.';
        alertError.show();
        return false;
    }

    //verifica posecion cuenta bancaria
    if (!form.querySelector('input[name="pvPosCuBan"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si posee cuenta bancaria.';
        alertError.show();
        return false;
    }

    //verifica certificaciones

    if (personType === 'juridica') {
        //OEA
        if (!form.querySelector('input[name="pvCeOEA"]:checked')) {
            alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación OEA.';
            alertError.show();
            return false;
        }

        //Calidad ISO 9001
        if (!form.querySelector('input[name="pvCeCal"]:checked')) {
            alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación de Calidad ISO 9001.';
            alertError.show();
            return false;
        }

        //BASC
        if (!form.querySelector('input[name="pvCeBASC"]:checked')) {
            alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación BASC.';
            alertError.show();
            return false;
        }

        //Ambiental ISO 14001
        if (!form.querySelector('input[name="pvCeAmb"]:checked')) {
            alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación Ambiental ISO 14001.';
            alertError.show();
            return false;
        }

        //ISO 28000
        if (!form.querySelector('input[name="pvCe28000"]:checked')) {
            alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación ISO 28000.';
            alertError.show();
            return false;
        }

        //SST ISO 45000
        if (!form.querySelector('input[name="pvCeSST"]:checked')) {
            alertErrorBody.innerText = 'Por favor seleccione si cuenta con certificación SST ISO 45000.';
            alertError.show();
            return false;
        }
    }
    
    //verifica autorizaciones
    const pvTDPMotMaq = document.querySelector('input[name="pvTDPMotMaq"]:checked');
    if (!pvTDPMotMaq) {
        alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para MOTORYSA S.A.';
        alertError.show();
        return false;
    }

    const pvTDPCasTor = document.querySelector('input[name="pvTDPCasTor"]:checked');
    if (!pvTDPCasTor) {
        alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para CASATORO S.A.';
        alertError.show();
        return false;
    }

    const pvTDPBonap = document.querySelector('input[name="pvTDPBonap"]:checked');
    if (!pvTDPBonap) {
        alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para BONAPARTE S.A.S.';
        alertError.show();
        return false;
    }

    //const pvTDPBellpi = document.querySelector('input[name="pvTDPBellpi"]:checked');
    //if (!pvTDPBellpi) {
    //    alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos para BELLPI S.A.S.';
    //    alertError.show();
    //    return false;
    //}

    const pvRadAut = document.querySelector('input[name="pvRadAut"]:checked');
    if (!pvRadAut) {
        alertErrorBody.innerText = 'Por favor seleccione si autoriza el tratamiento de datos.';
        alertError.show();
        return false;
    }

    const pvCumCSIn = document.querySelector('input[name="pvCumCSIn"]:checked');
    if (!pvCumCSIn) {
        alertErrorBody.innerText = 'Por favor marque si cumple con lo dispuesto en el Capítulo X de la Circular Básica Jurídica de la Superintendencia de Sociedades.';
        alertError.show();
        return false;
    }

    return true;
}

//validacion de documentos cargados en form documentos
export function validateDocsForm() {
    const form = document.getElementById('uploadDocsForm');
    //const files = form.querySelectorAll('input[type="file"]');
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

        //const hasNewFile = el.files.length > 0;
        //const hasExistFile = el.classList.contains('file-existing');

        //if (!hasNewFile && !hasExistFile) {
        //    const label = document.querySelector(`label[for="${id}"]`);
        //    const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
        //    alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
        //    alertError.show();
        //    el.focus();
        //    return false;
        //}

        const hasContent = el.value.trim() !== '';

        if (!hasContent) {
            const label = document.querySelector(`label[for="${id}"]`);
            const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;

            alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            alertError.show();
            el.focus();
            return false;
        }
    }

    //verifica que sean dos referencias comerciales
    const refComerc = document.getElementById('upRefeComerciales');
    //if (!refComerc.classList.contains('file-existing') && refComerc.files.length !== 2) {
    //    if (refComerc.files.length > 0 && refComerc.files.length !== 2) {
    //        alertErrorBody.innerText = 'Por favor ingrese dos (2) referencias comerciales';
    //        alertError.show();
    //        return false;
    //    }
    //}
    if (refComerc) {
        const fileNames = refComerc.value.split(', ').filter(name => name.trim() !== '');

        if (fileNames.length < 2) {
            alertErrorBody.innerText = 'Por favor ingrese dos (2) referencias comerciales';
            alertError.show();
            refComerc.focus();
            return false;
        }
    }

    //verifica si es OEA y de ser asi verifica documentos
    if (!form.querySelector('input[name="upOEA"]:checked')) {
        alertErrorBody.innerText = 'Por favor seleccione si es Operador Económico Autorizado (OEA).';
        alertError.show();
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

            //const hasNewFile = el.files.length > 0;
            //const hasExistFile = el.classList.contains('file-existing');

            //if (!hasNewFile && !hasExistFile) {
            //    const label = document.querySelector(`label[for="${id}"]`);
            //    const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
            //    alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
            //    alertError.show();
            //    el.focus();
            //    return false;
            //}

            const hasContent = el.value.trim() !== '';
            if (!hasContent) {
                const label = document.querySelector(`label[for="${id}"]`);
                const labelText = label ? (label.getAttribute('placeholder') || label.textContent) : id;
                alertErrorBody.innerText = `El campo "${labelText}" es obligatorio.`;
                alertError.show();
                el.focus();
                return false;
            }
        }
    }

    //verifica extencion del doc y el peso
    //for (const input of files) {
    //    if (input.files.length > 0) {
    //        for (const file of input.files) {
    //            //valida extencion
    //            if (!exptensionVal.exec(file.name)) {
    //                alertErrorBody.innerText = `El archivo ${file.name} no es un PDF valido.`;
    //                alertError.show();
    //                input.value = '';
    //                return false;
    //            }

    //            //valida el peso
    //            if (file.size > maxSizeMB) {
    //                alertErrorBody.innerText = `El archivo ${file.name} supera los 4MB.`;
    //                alertError.show();
    //                input.value = '';
    //                return false;
    //            }
    //        }
    //    }
    //}

    if (typeof tempFiles !== 'undefined') {
        for (const inputId in tempFiles) {
            const files = tempFiles[inputId];
            for (const file of files) {
                if (!exptensionVal.exec(file.name)) {
                    alertErrorBody.innerText = `El archivo "${file.name}" no es un PDF válido.`;
                    alertError.show();
                    return false;
                }

                if (file.size > maxSizeMB) {
                    alertErrorBody.innerText = `El archivo "${file.name}" supera el límite de 4MB.`;
                    alertError.show();
                    return false;
                }
            }
        }
    }

    return true;
}