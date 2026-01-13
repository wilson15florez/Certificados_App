//elemento para validacion con parametros
export const telInst = {};

//funcion de inicializacion de instancias de intl-tel-input
export function initTelInputs(element, required = false) {
    if (!element) return null;

    const iti = window.intlTelInput(element, {
        initialCountry: 'co',
        separateDialCode: true,
        autoPlaceholder: 'off',
        nationalMode: true,
        formatOnDisplay: false,
        utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js',
    });

    telInst[element.id] = iti;
    return iti;
}

export async function waitSafeSetPhone(inputId, fullNumber) {
    const iti = telInst[inputId];
    const input = document.getElementById(inputId);

    if (!iti || !input) return;

    const waitForUtils = () => {
        return new Promise((resolve) => {
            const check = () => {
                if (window.intlTelInputUtils) resolve();
                else setTimeout(check, 50);
            };
            check();
        });
    };

    await waitForUtils();

    if (!fullNumber) {
        iti.setNumber('');
        input.value = '';
        return;
    }

    iti.setNumber(fullNumber);
}
