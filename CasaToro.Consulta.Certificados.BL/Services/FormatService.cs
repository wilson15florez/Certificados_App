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
using System.Globalization;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class FormatService
    {
        public string FillFormatoPDF(dynamic datos, string webRootPath)
        {
            var master = datos.master as CasaToro.Consulta.Certificados.Entities.Proveedores_Master;
            var juridica = datos.juridica as IDictionary<string, object>;
            var finanInf = datos.finanInf as IDictionary<string, object>;

            if (juridica == null) throw new Exception("No se pudo obtener la información Jurídica del objeto datos.");

            string nit = juridica["Nit"]?.ToString() ?? "S_N";
            string templatePath = Path.Combine(webRootPath, "data", "ADM-FO-0002 V8", "ADM-FO-0002 V8-0602.pdf");
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

                        // Rellenar campos del encabezado
                        SetSplitDate(fields, master.FechaDiligencia, "tramFechAno", "tramFechMes", "tramFechDia");
                        if (master.TipoTramite == "VINCULACION")
                        {
                            SetCheckBox(form, "tramCheckVinc", true);
                        }
                        else if (master.TipoTramite == "ACTUALIZACION")
                        {
                            SetCheckBox(form, "tramCkActua", true);
                        }

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
                        SetField(fields, "pjRLPrimApell", juridica["pjPrimApeRL"]?.ToString());
                        SetField(fields, "pjRLSegApell", juridica["pjSegApeRL"]?.ToString());
                        SetField(fields, "pjRLNombres", juridica["pjNomReLeg"]?.ToString());
                        SetSplitDate(fields, juridica["pjRLFechaNac"], "pjRLFeNaAno", "pjRLFeNaMes", "pjRLFeNaDia"); 
                        SetField(fields, "pjRLDepaNac", juridica["pjRLDepartNac"]?.ToString());
                        SetField(fields, "pjRLCiudadNac", juridica["pjRLCiudadNac"]?.ToString());
                        SetField(fields, "pjRLNacionalidad", juridica["pjRLNacionalidad"]?.ToString());
                        string rlTipNac = juridica["pjRLTipNacionalidad"]?.ToString();
                        if (rlTipNac == "Nacional")
                        {
                            SetCheckBox(form, "pjRLCkDocNacCC", true);
                            SetField(fields, "pjRLNumIdNac", juridica["pjRLDocNum"]?.ToString());
                        } 
                        else
                        {
                            string rlTipoDoc = juridica["pjRLTipoDoc"]?.ToString();
                            if (rlTipoDoc == "CE")
                            {
                                SetCheckBox(form, "pjRLCkDocExtCE", true);
                            } else if (rlTipoDoc == "PAS")
                            {
                                SetCheckBox(form, "pjRLCkDocExtPA", true);
                            } else
                            {
                                SetCheckBox(form, "pjRLCkDocExtCAR", true);
                            }

                            SetField(fields, "pjRLNumIdExt", juridica["pjRLDocNum"]?.ToString());
                        }

                        SetSplitDate(fields, juridica["pjRLFechExpDoc"], "pjRLFeExDoAno", "pjRLFeExDoMes", "pjRLFeExDoDia");
                        SetField(fields, "pjRLDepaExpDoc", juridica["pjRLDepExpDoc"]?.ToString());
                        SetField(fields, "pjRLCiudadExpDoc", juridica["pjRLCiuExpDoc"]?.ToString());


                        //rellena informacion financiera

                        SetField(fields, "pvIngMen", FormatMoney(finanInf["pvIngrMens"]));
                        SetField(fields, "pvEgrMen", FormatMoney(finanInf["pvEgrMens"]));
                        SetField(fields, "pvActivos", FormatMoney(finanInf["pvActivos"]));
                        SetField(fields, "pvPasivos", FormatMoney(finanInf["pvPasivos"]));
                        SetField(fields, "pvPatrimonio", FormatMoney(finanInf["pvPatrimonio"]));
                        SetField(fields, "pvOtroIngr", FormatMoney(finanInf["pvOtrIngr"]));
                        SetField(fields, "pvPorceNac", finanInf["pvPorNacional"]?.ToString());
                        SetField(fields, "pvPorceExt", finanInf["pvPorExtranjero"]?.ToString());
                        SetField(fields, "pvPorcePaisExt", finanInf["pvPorPais"]?.ToString());
                        string tipEmp = finanInf["pvTipEmp"]?.ToString();
                        if (tipEmp == "EmPublica")
                        {
                            SetCheckBox(form, "pvTEPublic", true);
                        } 
                        else if (tipEmp == "EmPrivada")
                        {
                            SetCheckBox(form, "pvTEPrivada", true);
                        } 
                        else if (tipEmp == "EmMixta")
                        {
                            SetCheckBox(form, "pvTEMixta", true);
                        } 
                        else
                        {
                            SetCheckBox(form, "pvTEOtra", true);
                        }
                        SetField(fields, "pvActividadEco", finanInf["pvAcEconomica"]?.ToString());
                        SetField(fields, "pvCodCIIU", finanInf["pvCodCIIU"]?.ToString());
                        SetField(fields, "pvCapSocialReg", FormatMoney(finanInf["pvCapSocReg"]));
                        SetSplitDate(fields, finanInf["pvFechConst"], "pvFeConAno", "pvFeConMes", "pvFeConDia");
                        SetSplitDate(fields, finanInf["pvFechVen"], "pvFeVenAno", "pvFeVenMes", "pvFeVenDia");
                        if (finanInf["pvGrCon"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvGranConSi", true);
                        } 
                        else
                        {
                            SetCheckBox(form, "pvGranConNo", true);
                        }
                        SetSplitDate(fields, finanInf["pvFechResolGC"], "pvFeResAno", "pvFeResMes", "pvFeResDia");
                        SetField(fields, "pvNumResol", finanInf["pvNumResolGC"]?.ToString());
                        if (finanInf["pvDeclIndCom"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvDecIndComSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvDecIndComNo", true);
                        }
                        SetField(fields, "pvDeparDecl", finanInf["pvDepartDec"]?.ToString());
                        SetField(fields, "pvCiudadDecl", finanInf["pvCiudadDec"]?.ToString());
                        if (finanInf["pvAutRet"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvAutoRetSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvAutoRetNo", true);
                        }
                        SetField(fields, "pvNumResolDIAN", finanInf["pvNumResDIAN"]?.ToString());
                        if (finanInf["pvOpeCExt"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkComExtSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvCkComExtNo", true);
                        }
                        SetField(fields, "pvFormPagCE", finanInf["pvForPag"]?.ToString());
                        SetField(fields, "pvBenefComExt", finanInf["pvEntBenef"]?.ToString());
                        if (finanInf["pvPosCuBan"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkPosCuentSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvCkPosCuentNo", true);
                        }
                        SetField(fields, "pvEntidadBanc", finanInf["pvEntidad"]?.ToString());
                        SetField(fields, "pvNumCuentaBanc", finanInf["pvNumCueBanc"]?.ToString());
                        SetField(fields, "pvClasCuentaBanc", finanInf["pvClasCueBan"]?.ToString());
                        if (finanInf["pvCeOEA"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkOEASi", true);
                        }
                        else if (finanInf["pvCeOEA"]?.ToString() == "No")
                        {
                            SetCheckBox(form, "pvCkOEANo", true);
                        }
                        else if (finanInf["pvCeOEA"]?.ToString() == "EP")
                        {
                            SetCheckBox(form, "pvCkOEAProces", true);
                        }

                        if (finanInf["pvCeCal"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkCalidadSi", true);
                        }
                        else if (finanInf["pvCeCal"]?.ToString() == "No")
                        {
                            SetCheckBox(form, "pvCkCalidadNo", true);
                        }
                        else if (finanInf["pvCeCal"]?.ToString() == "EP")
                        {
                            SetCheckBox(form, "pvCkCalidadProces", true);
                        }

                        if (finanInf["pvCeBASC"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkBASCSi", true);
                        }
                        else if (finanInf["pvCeBASC"]?.ToString() == "No")
                        {
                            SetCheckBox(form, "pvCkBASCNo", true);
                        }
                        else if (finanInf["pvCeBASC"]?.ToString() == "EP")
                        {
                            SetCheckBox(form, "pvCkBASCProces", true);
                        }

                        if (finanInf["pvCeAmb"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkAmbientalSi", true);
                        }
                        else if (finanInf["pvCeAmb"]?.ToString() == "No")
                        {
                            SetCheckBox(form, "pvCkAmbientalNo", true);
                        }
                        else if (finanInf["pvCeAmb"]?.ToString() == "EP")
                        {
                            SetCheckBox(form, "pvCkAmbientalProces", true);
                        }

                        if (finanInf["pvCe28000"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCk28000Si", true);
                        }
                        else if (finanInf["pvCe28000"]?.ToString() == "No")
                        {
                            SetCheckBox(form, "pvCk28000No", true);
                        }
                        else if (finanInf["pvCe28000"]?.ToString() == "EP")
                        {
                            SetCheckBox(form, "pvCk28000Proces", true);
                        }

                        if (finanInf["pvCeSST"]?.ToString() == "Si")
                        {
                            SetCheckBox(form, "pvCkSSTSi", true);
                        }
                        else if (finanInf["pvCeSST"]?.ToString() == "No")
                        {
                            SetCheckBox(form, "pvCkSSTNo", true);
                        }
                        else if (finanInf["pvCeSST"]?.ToString() == "EP")
                        {
                            SetCheckBox(form, "pvCkSSTProces", true);
                        }

                        SetField(fields, "pvCertAdicional", finanInf["pvAdiCert"]?.ToString());

                        // Rellenar Declaraciones y Autorizaciones

                        if (finanInf["pvTDPMotMaq"]?.ToString() == "SI")
                        {
                            SetCheckBox(form, "pvAutMotorysaSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvAutMotorysaNo", true);
                        }

                        if (finanInf["pvTDPCasTor"]?.ToString() == "SI")
                        {
                            SetCheckBox(form, "pvAutCasatoroSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvAutCasatoroNo", true);
                        }

                        if (finanInf["pvTDPBonap"]?.ToString() == "SI")
                        {
                            SetCheckBox(form, "pvAutBonaparteSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvAutBonaparteNo", true);
                        }

                        if (finanInf["pvRadAut"]?.ToString() == "SI")
                        {
                            SetCheckBox(form, "pvAutGeneralSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvAutGeneralNo", true);
                        }
                        SetField(fields, "pvRepleRazSocial", finanInf["pvDeAuRepresentacion"]?.ToString());
                        SetField(fields, "pvOrigenFuentes", finanInf["pvFuenteRecur"]?.ToString());
                        if (finanInf["pvCumCSIn"]?.ToString() == "SI")
                        {
                            SetCheckBox(form, "pvCumplSi", true);
                        }
                        else
                        {
                            SetCheckBox(form, "pvCumplNo", true);
                        }

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

        private void SetSplitDate(IDictionary<string, iText.Forms.Fields.PdfFormField> fields, object? dataValue, string fileDateYear, string fileDateMonth, string fileDateDay)
        {
            if (fields == null) return;

            if (dataValue != null && DateTime.TryParse(dataValue.ToString(), out DateTime dt))
            {
                SetField(fields, fileDateYear, dt.Year.ToString());
                SetField(fields, fileDateMonth, dt.ToString("MM"));
                SetField(fields, fileDateDay, dt.ToString("dd"));
            }
            else
            {
                SetField(fields, fileDateYear, "");
                SetField(fields, fileDateMonth, "");
                SetField(fields, fileDateDay, "");
            }
        }

        //metodo para dar formato de dinero a los campos del informacion financiera en el pdf
        private string FormatMoney(object value)
        {
            if (value == null || string.IsNullOrEmpty(value.ToString())) 
                return "$ 0";

            //intentar convertir a decimal, eliminando caracteres no numéricos por si acaso
            if (decimal.TryParse(value.ToString(), out decimal moneyVal))
            {
                return moneyVal.ToString("C0", CultureInfo.CreateSpecificCulture("es-CO"));
            }

            return "$ 0";
        }
    }
}
