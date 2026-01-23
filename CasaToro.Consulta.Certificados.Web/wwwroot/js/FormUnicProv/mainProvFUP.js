//import * as API from './api-client.js';
//import * as UI from './ui-handlers.js';
//import * as Collector from './collector.js';
//import * as Validator from './validators.js';
//import * as UtilsPhone from './utils-phone.js';

//document.addEventListener('DOMContentLoaded', async () => {
//    UI.firstBlock();
//    UtilsPhone.initTelInputs();

//    const openFormsBtn = document.getElementById('openFormsBtn');

//    openFormsBtn.addEventListener('click', async () => {
//        try {
//            const result = await API.dataProvider();

//            if (result.status === 'found') {
//                UI.formViewProvHandler(result);

//                document.getElementById('formContainer').scrollIntoView({ behavior: 'smooth' });
//            } else if (result.status === 'noType') {
//                alert(result.message);
//            } else {
//                alert("Error: ", + result.message);
//            }
//        } catch (error) {
//            alert("Ocurrió un error al cargar la información.");
//        }
//    });

//    document.getElementById('uploadDocsBtn').addEventListener('click', () => {
//        $('#sectionDocs').fadeIn();
//    });
//});