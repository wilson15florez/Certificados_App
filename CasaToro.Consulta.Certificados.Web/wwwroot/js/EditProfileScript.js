let saveBtn = document.getElementById('saveChanges');
let saveBtnPass = document.getElementById('save-btn');
const alertContainer = document.getElementById('alerts-container');
const alertEditPass = document.getElementById('alerts-container-edit');

//logica para actualizar constraseña
saveBtnPass.addEventListener('click', () => {
    const oldPass = document.getElementById('old-password-input').value;
    const newPass = document.getElementById('new-password-input').value;
    const confirmPass = document.getElementById('confirm-password-input').value;

    if (newPass !== confirmPass) {
        appendAlert('Las contraseñas no coinciden', 'danger', alertEditPass);
        return;
    }

    // Verificar la contraseña actual
    fetch('/Provider/VerifyPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(oldPass)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                appendAlert(data.error, 'danger', alertEditPass);
                return;
            }

            // Si la contraseña es correcta, proceder a actualizar la contraseña
            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;
            if (!regex.test(newPass)) {
                appendAlert('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial (#, $, %, &, *, etc.)', 'danger', alertEditPass);
                return;
            }

            fetch('/Provider/UpdatePassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPass)
            }).then(response => response.json())
                .then(data => {
                    if (data.error) {
                        appendAlert(data.error, 'danger', alertEditPass);
                        return;
                    }
                    appendAlert(data.message, 'success', alertEditPass);
                })
                .catch(error => console.log("Error:", error));
        })
        .catch(error => console.log("Error:", error));
});

saveBtn.addEventListener('click', () => {
    const name = document.getElementById('name-input').value;
    const address = document.getElementById('address-input').value.trim() !== "" ? document.getElementById('address-input').value.toUpperCase().trim() : null;
    const email = document.getElementById('email-input').value.trim() !== "" ? document.getElementById('email-input').value.toUpperCase().trim() : null;
    const phone = document.getElementById('phone-input').value.trim() !== "" ? document.getElementById('phone-input').value.trim() : null;
    const typePerson = document.getElementById('tipo_Persona').value.trim() !== "" ? document.getElementById('tipo_Persona').value.trim() : null;

    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regexTelFijo = /^60[1-9]\d{7}$/;
    const regexTelCelular = /^3\d{9}$/;

    if (!regexEmail.test(email) && email) {
        appendAlert('Correo electrónico inválido', 'danger', alertContainer);
        var emailInput = document.getElementById('email-input');
        emailInput.focus();
        emailInput.style.border = '1px solid red';
        return;
    }

    if (!regexTelFijo.test(phone) && !regexTelCelular.test(phone) && phone) {
        appendAlert('Teléfono inválido', 'danger', alertContainer);
        var phoneInput = document.getElementById('phone-input');
        phoneInput.focus();
        phoneInput.style.border = '1px solid red';
        return;
    }

    let provider = {
        Nombre: name,
        Direccion: address,
        Correo: email,
        Telefono: phone,
        TipoPersona: typePerson
    }
    console.log("Enviando datos: ", provider);
    fetch('/Provider/UpdateProvider', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(provider)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                appendAlert(data.error, 'danger', alertContainer);
                return;
            };

            var emailInput = document.getElementById('email-input');
            emailInput.style.border = '1px solid #ced4da';

            var phoneInput = document.getElementById('phone-input');
            phoneInput.style.border = '1px solid #ced4da';

            appendAlert(data.message, 'success', alertContainer);

        })
        .catch(error => console.log("Error:", error));

    selectTypePerson();
});

function appendAlert(message, type, container) {

    const wrapper = document.createElement('div');

    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade-out" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');

    container.append(wrapper);

    setTimeout(() => {
        wrapper.classList.add('hide');
        setTimeout(() => {
            wrapper.remove();
        }, 1000);
    }, 3000);

}

function selectTypePerson() {
    const tipPers = document.getElementById('tipo_Persona');
    if (tipPers.value === ('NATURAL' && 'JURIDICA')) {
        tipPers.disabled = true;
    } else {
        tipPers.disabled = false;
    }
}

selectTypePerson();
