//sistema de alertas
export const alertSuccesBody = document.getElementById('alertSuccessBody');
export const alertErrorBody = document.getElementById('alertErrorBody');
export const alertBody = document.getElementById('alertBody');

export const alertSuccess = new bootstrap.Modal(document.getElementById('alertSuccess'));
export const alertError = new bootstrap.Modal(document.getElementById('alertError'));
export const alert = new bootstrap.Modal(document.getElementById('alert'));


export const docNacionales = [
    { value: 'CC', text: 'CC' },
    { value: 'NIT', text: 'NIT' }
];
export const docExtranjeros = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];

export const pjRLDocNaci = [
    { value: 'CC', text: 'CC' }
];
export const pjRLDocExtr = [
    { value: 'CE', text: 'CE' },
    { value: 'PAS', text: 'Pasaporte' },
    { value: 'CAR', text: 'Carné Dir. Producido Min Rel. Ext' }
];

//elemento para validacion con parametros del email
export const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const regexDir = /^([a-zA-ZñÑ\s]+)\s+([0-9]+)\s*([a-zA-Z])?\s*#\s*([0-9]+)\s*([a-zA-Z])?\s*-\s*([0-9]+)(?:,\s*(.*))?$/i;

export const telInst = {};

export const dirtyFields = new Set();