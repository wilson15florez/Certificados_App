using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using iText.Forms;
using iText.Forms.Fields;
using iText.Kernel.Pdf;
using System.IO;
using CasaToro.Consulta.Certificados.Entities;
using Newtonsoft.Json;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class FormatService
    {
        public string FillFormatoPDF(dynamic datos, string webRootPath)
        {
            var juridica = datos.juridica as IDictionary<string, object>;
            var fucp = datos.fucp as IDictionary<string, object>;
            //var sucursales = datos.Sucursales as List<CasaToro.Consulta.Certificados.Entities.Sucursales_PJuridica>;
            //var accionistas = datos.Accionistas as List<CasaToro.Consulta.Certificados.Entities.AccionistasControlPJuridica>;

            if (juridica == null) throw new Exception("No se pudo obtener la información Jurídica del objeto datos.");

            string nit = juridica["Nit"]?.ToString() ?? "S_N";
            string templatePath = Path.Combine(webRootPath, "data", "ADM-FO-0002 V8", "ADM-FO-0002 V8 (PLANTILLA).pdf");
            string fileName = $"Formato_Unico_de_Conocimiento_de_Proveedores_{nit}.pdf";
            string outputPath = Path.Combine(webRootPath, "GeneratedFiles", fileName);

            if (!Directory.Exists(Path.GetDirectoryName(outputPath)))
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));

            using (PdfReader reader = new PdfReader(templatePath))
            {
                using (PdfWriter writer = new PdfWriter(outputPath))
                {
                    using (PdfDocument pdfDoc = new PdfDocument(reader, writer)) 
                    {
                        PdfAcroForm form = PdfAcroForm.GetAcroForm(pdfDoc, true);
                        //IDictionary<string, PdfFormField> fields = form.GetAllFormFields();
                        var fields = form.GetAllFormFields();

                        // Rellenar campos básicos
                        SetField(fields, "pjRazonSocial", juridica["pjRazSocial"]?.ToString());
                        SetField(fields, "pjNit", juridica["Nit"]?.ToString());
                        SetField(fields, "pjDirPrincipal", juridica["pjDirPrincipal"]?.ToString());
                        SetField(fields, "pjCiudadDirPri", juridica["pjCiudadDirPrincipal"]?.ToString());
                        SetField(fields, "pjEmailDirPri", juridica["pjEmailDirPrincipal"]?.ToString());
                        SetField(fields, "pjTelDirPri", juridica["pjTelDirPrincipal"]?.ToString());

                        // Rellenar sucursales
                        var sucursales = juridica["Sucursales"] as IEnumerable<dynamic>;
                        if (sucursales != null)
                        {
                            int i = 1;
                            foreach (var suc in sucursales)
                            {
                                if (i > 2) break;
                                SetField(fields, $"pjDirSuc{i}", suc.pjSucursalDir?.ToString());
                                SetField(fields, $"pjCiudadSuc{i}", suc.pjSucursalCiudad?.ToString());
                                SetField(fields, $"pjEmailSuc{i}", suc.pjSucursalEmail?.ToString());
                                SetField(fields, $"pjTelSuc{i}", suc.pjSucursalTel?.ToString());
                                i++;
                            }
                        }
                        

                        // Rellenar accionistas
                        var accionistas = juridica["ControlRow"] as IEnumerable<dynamic>;
                        if (accionistas != null)
                        {
                            int j = 1;
                            foreach (var acc in accionistas)
                            {
                                if (j > 5) break;
                                SetField(fields, $"pjNombAcc{j}", acc.razonSocial?.ToString());
                                SetField(fields, $"pjTipIdAcc{j}", acc.idType?.ToString());
                                SetField(fields, $"pjNumIdAcc{j}", acc.idNum?.ToString());
                                SetField(fields, $"pjPorcentajeAcc{j}", acc.porcentaje.ToString() + "%");
                                j++;
                            }
                        }

                        // Rellenar Representante Legal
                        //SetField(fields, "pjRLPrimApell", juridica.);
                        //SetField(fields, "pjRLSegApell", juridica.);
                        SetField(fields, "pjRLNombres", juridica["pjNomReLeg"]?.ToString());
                        SetField(fields, "pjRLFechNac", juridica["pjRLFechaNac"]?.ToString());
                        SetField(fields, "pjRLDepaNac", juridica["pjRLDepartNac"]?.ToString());
                        SetField(fields, "pjRLCiudadNac", juridica["pjRLCiudadNac"]?.ToString());
                        SetField(fields, "pjRLNacionalidad", juridica["pjRLNacionalidad"]?.ToString());
                        string rlTipNac = juridica["pjRLTipNacionalidad"]?.ToString();
                        if (rlTipNac == "Nacional")
                        {
                            //form.GetField("pjRLCkDocNacCC").SetValue("CC");
                            //SetField(fields, "pjRLNumIdNac", juridica.pjRLDocNum);
                            //if (fields.ContainsKey("pjRLCkDocNacCC")) form.GetField("pjRLCkDocNacCC").SetValue("CC");
                            SetCheckBox(form, "pjRLCkDocNacCC", true);
                            SetField(fields, "pjRLNumIdNac", juridica["pjRLDocNum"]?.ToString());
                        } else
                        {
                            string rlTipoDoc = juridica["pjRLTipoDoc"]?.ToString();
                            if (rlTipoDoc == "CE")
                            {
                                //form.GetField("pjRLCkDocExtCE").SetValue("CE");
                                //if (fields.ContainsKey("pjRLCkDocExtCE")) form.GetField("pjRLCkDocExtCE").SetValue("CE");
                                SetCheckBox(form, "pjRLCkDocExtCE", true);
                            } else if (rlTipoDoc == "PAS")
                            {
                                //form.GetField("pjRLCkDocExtPA").SetValue("PAS");
                                //if (fields.ContainsKey("pjRLCkDocExtPA")) form.GetField("pjRLCkDocExtPA").SetValue("PAS");
                                SetCheckBox(form, "pjRLCkDocExtPA", true);
                            } else
                            {
                                //form.GetField("pjRLCkDocExtCAR").SetValue("CAR");
                                //if (fields.ContainsKey("pjRLCkDocExtCAR")) form.GetField("pjRLCkDocExtCAR").SetValue("CAR");
                                SetCheckBox(form, "pjRLCkDocExtCAR", true);
                            }

                            SetField(fields, "pjRLNumIdExt", juridica["pjRLDocNum"]?.ToString());
                        }

                        SetField(fields, "pjRLFechExpeDoc", juridica["pjRLFechExpDoc"]?.ToString());
                        SetField(fields, "pjRLDepaExpDoc", juridica["pjRLDepExpDoc"]?.ToString());
                        SetField(fields, "pjRLCiudadExpDoc", juridica["pjRLCiuExpDoc"]?.ToString());


                        SetField(fields, "pvIngMen", fucp["pvIngrMens"]?.ToString());
                        SetField(fields, "pvEgrMen", fucp["pvEgrMens"]?.ToString());
                        SetField(fields, "pvActivos", fucp["pvActivos"]?.ToString());
                        SetField(fields, "pvPasivos", fucp["pvPasivos"]?.ToString());
                        SetField(fields, "pvPatrimonio", fucp["pvPatrimonio"]?.ToString());
                        SetField(fields, "pvOtroIngr", fucp["pvOtrIngr"]?.ToString());
                        SetField(fields, "pvPorceNac", fucp["pvPorNacional"]?.ToString());
                        SetField(fields, "pvPorceExt", fucp["pvPorExtranjero"]?.ToString());
                        SetField(fields, "pvPorcePaisExt", fucp["pvPorPais"]?.ToString());
                        string tipEmp = fucp["pvTipEmp"]?.ToString();
                        if (tipEmp == "EmPublica")
                        {
                            //form.GetField("pvTEPublic").SetValue("EmPublica");
                            //if (fields.ContainsKey("pvTEPublic")) form.GetField("pvTEPublic").SetValue("EmPublica");
                            SetCheckBox(form, "pvTEPublic", true);
                        } else if (tipEmp == "EmPrivada")
                        {
                            //form.GetField("pvTEPrivada").SetValue("EmPrivada");
                            //if (fields.ContainsKey("pvTEPrivada")) form.GetField("pvTEPrivada").SetValue("EmPrivada");
                            SetCheckBox(form, "pvTEPrivada", true);
                        } else if (tipEmp == "EmMixta")
                        {
                            //form.GetField("pvTEMixta").SetValue("EmMixta");
                            //if (fields.ContainsKey("pvTEMixta")) form.GetField("pvTEMixta").SetValue("EmMixta");
                            SetCheckBox(form, "pvTEMixta", true);
                        } else
                        {
                            //form.GetField("pvTEOtra").SetValue("pvEmOtra");
                            //if (fields.ContainsKey("pvTEOtra")) form.GetField("pvTEOtra").SetValue("pvEmOtra");
                            SetCheckBox(form, "pvTEOtra", true);
                        }
                        SetField(fields, "pvActividadEco", fucp["pvAcEconomica"]?.ToString());
                        SetField(fields, "pvCodCIIU", fucp["pvCodCIIU"]?.ToString());
                        SetField(fields, "pvCapSocialReg", fucp["pvCapSocReg"]?.ToString());
                        SetField(fields, "pvFechConst", fucp["pvFechConst"]?.ToString());
                        SetField(fields, "pvFechVenc", fucp["pvFechVen"]?.ToString());
                        if (fucp["pvGrCon"]?.ToString() == "Si")
                        {
                            //form.GetField("pvGranConSi").SetValue("Si");
                            //if (fields.ContainsKey("pvGranConSi")) form.GetField("pvGranConSi").SetValue("Si");
                            SetCheckBox(form, "pvGranConSi", true);
                        } else
                        {
                            //form.GetField("pvGranConNo").SetValue("No");
                            //if (fields.ContainsKey("pvGranConNo")) form.GetField("pvGranConNo").SetValue("No");
                            SetCheckBox(form, "pvGranConNo", true);
                        }
                        SetField(fields, "pvFechRes", fucp["pvFechResolGC"]?.ToString());
                        SetField(fields, "pvNumResol", fucp["pvNumResolGC"]?.ToString());
                        if (fucp["pvDeclIndCom"]?.ToString() == "Si")
                        {
                            //form.GetField("pvDecIndComSi").SetValue("Si");
                            //if (fields.ContainsKey("pvDecIndComSi")) form.GetField("pvDecIndComSi").SetValue("Si");
                            SetCheckBox(form, "pvDecIndComSi", true);
                        }
                        else
                        {
                            //form.GetField("pvDecIndComNo").SetValue("No");
                            //if (fields.ContainsKey("pvDecIndComNo")) form.GetField("pvDecIndComNo").SetValue("No");
                            SetCheckBox(form, "pvDecIndComNo", true);
                        }
                        SetField(fields, "pvDeparDecl", fucp["pvDepartDec"]?.ToString());
                        SetField(fields, "pvCiudadDecl", fucp["pvCiudadDec"]?.ToString());
                        if (fucp["pvAutRet"]?.ToString() == "Si")
                        {
                            //form.GetField("pvAutoRetSi").SetValue("Si");
                            //if (fields.ContainsKey("pvAutoRetSi")) form.GetField("pvAutoRetSi").SetValue("Si");
                            SetCheckBox(form, "pvAutoRetSi", true);
                        }
                        else
                        {
                            //form.GetField("pvAutoRetNo").SetValue("No");
                            //if (fields.ContainsKey("pvAutoRetNo")) form.GetField("pvAutoRetNo").SetValue("No");
                            SetCheckBox(form, "pvAutoRetNo", true);
                        }
                        SetField(fields, "pvNumResolDIAN", fucp["pvNumResDIAN"]?.ToString());
                        SetField(fields, "pvFormPagCE", fucp["pvForPag"]?.ToString());
                        SetField(fields, "pvBenefComExt", fucp["pvEntBenef"]?.ToString());
                        if (fucp["pvPosCuBan"]?.ToString() == "Si")
                        {
                            //form.GetField("pvCkPosCuentSi").SetValue("Si");
                            //if (fields.ContainsKey("pvCkPosCuentSi")) form.GetField("pvCkPosCuentSi").SetValue("Si");
                            SetCheckBox(form, "pvCkPosCuentSi", true);
                        }
                        else
                        {
                            //form.GetField("pvCkPosCuentNo").SetValue("No");
                            //if (fields.ContainsKey("pvCkPosCuentNo")) form.GetField("pvCkPosCuentNo").SetValue("No");
                            SetCheckBox(form, "pvCkPosCuentNo", true);
                        }
                        SetField(fields, "pvEntidadBanc", fucp["pvEntidad"]?.ToString());
                        SetField(fields, "pvNumCuentaBanc", fucp["pvNumCueBanc"]?.ToString());
                        SetField(fields, "pvClasCuentaBanc", fucp["pvClasCueBan"]?.ToString());

                        if (fucp["pvTDPMotMaq"]?.ToString() == "SI")
                        {
                            //form.GetField("pvAutMotorysaSi").SetValue("SI");
                            //if (fields.ContainsKey("pvAutMotorysaSi")) form.GetField("pvAutMotorysaSi").SetValue("SI");
                            SetCheckBox(form, "pvAutMotorysaSi", true);
                        }
                        else
                        {
                            //form.GetField("pvAutMotorysaNo").SetValue("NO");
                            //if (fields.ContainsKey("pvAutMotorysaNo")) form.GetField("pvAutMotorysaNo").SetValue("NO");
                            SetCheckBox(form, "pvAutMotorysaNo", true);
                        }

                        if (fucp["pvTDPCasTor"]?.ToString() == "SI")
                        {
                            //form.GetField("pvAutCasatoroSi").SetValue("SI");
                            //if (fields.ContainsKey("pvAutCasatoroSi")) form.GetField("pvAutCasatoroSi").SetValue("SI");
                            SetCheckBox(form, "pvAutCasatoroSi", true);
                        }
                        else
                        {
                            //form.GetField("pvAutCasatoroNo").SetValue("NO");
                            //if (fields.ContainsKey("pvAutCasatoroNo")) form.GetField("pvAutCasatoroNo").SetValue("NO");
                            SetCheckBox(form, "pvAutCasatoroNo", true);
                        }

                        if (fucp["pvTDPBonap"]?.ToString() == "SI")
                        {
                            //form.GetField("pvAutBonaparteSi").SetValue("SI");
                            //if (fields.ContainsKey("pvAutBonaparteSi")) form.GetField("pvAutBonaparteSi").SetValue("SI");
                            SetCheckBox(form, "pvAutBonaparteSi", true);
                        }
                        else
                        {
                            //form.GetField("pvAutBonaparteNo").SetValue("NO");
                            //if (fields.ContainsKey("pvAutBonaparteNo")) form.GetField("pvAutBonaparteNo").SetValue("NO");
                            SetCheckBox(form, "pvAutBonaparteNo", true);
                        }

                        if (fucp["pvRadAut"]?.ToString() == "SI")
                        {
                            //form.GetField("pvAutGeneralSi").SetValue("SI");
                            //if (fields.ContainsKey("pvAutGeneralSi")) form.GetField("pvAutGeneralSi").SetValue("SI");
                            SetCheckBox(form, "pvAutGeneralSi", true);
                        }
                        else
                        {
                            //form.GetField("pvAutGeneralNo").SetValue("NO");
                            //if (fields.ContainsKey("pvAutGeneralNo")) form.GetField("pvAutGeneralNo").SetValue("NO");
                            SetCheckBox(form, "pvAutGeneralNo", true);
                        }
                        SetField(fields, "pvRepleRazSocial", fucp["pvDeAuRepresentacion"]?.ToString());
                        SetField(fields, "pvOrigenFuentes", fucp["pvFuenteRecur"]?.ToString());

                        form.FlattenFields();
                    }
                }
            }

            return "/GeneratedFiles/" + fileName;
        }

        private void SetField(IDictionary<string, PdfFormField> fields, string name, string value)
        {
            if (fields.ContainsKey(name))
            {
                fields[name].SetValue(value ?? "");
            }
        }

        private void SetCheckBox(PdfAcroForm form, string fieldName, bool state)
        {
            var field = form.GetField(fieldName);
            if (field != null)
            {
                string[] possibleValues = field.GetAppearanceStates();
                if (state && possibleValues.Length > 0)
                {
                    string onValue = possibleValues.Length > 1 ? possibleValues[1] : possibleValues[0];
                    field.SetValue(onValue);
                }
            }
        }
    }
}
