using CasaToro.Consulta.Certificados.Entities;
using CasaToro.Consulta.Certificados.DAL;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.IO.Image;
using iText.Kernel.Font;
using Microsoft.AspNetCore.Http;
using System.Globalization;


namespace CasaToro.Consulta.Certificados.BL.Services
{
    /// <summary>
    /// Servicio para la generación de certificados de retención en formato PDF.
    /// Soporta tres tipos: IVA, ICA y Retención en la Fuente (RTF).
    /// Cada certificado se genera a partir de los datos almacenados en DB y se guarda
    /// en <c>wwwroot/Certificados/Generados/</c>.
    /// </summary>
    public class CertificatesService
    {
        private readonly ApplicationDbContext _context;
        private readonly string[] periods;

        /// <summary>
        /// Constructor. Inicializa el contexto de DB y el arreglo de periodos bimestrales.
        /// </summary>
        public CertificatesService(ApplicationDbContext context)
        {
            _context = context;
            periods = ["", "ENERO-FEBRERO", "MARZO-ABRIL", "MAYO-JUNIO", "JULIO-AGOSTO", "SEPTIEMBRE-OCTUBRE", "NOVIEMBRE-DICIEMBRE"];
        }

        /// <summary>
        /// Obtiene los años disponibles para consulta de certificados.
        /// Unifica los años presentes en las tablas de ICA, IVA y RTF.
        /// </summary>
        /// <returns>Conjunto de años ordenados ascendentemente.</returns>
        public HashSet<int> GetAvalibleYears()
        {
            HashSet<int> years = new HashSet<int>();
            years = _context.CertificadosIcas.Select(x => x.Ano).Distinct().ToHashSet();
            years.UnionWith(_context.CertificadosIvas.Select(x => x.Ano).Distinct().ToHashSet());
            years.UnionWith(_context.CertificadosRteftes.Select(x => x.Ano).Distinct().ToHashSet());

            return years.OrderBy(y => y).ToHashSet();

        }

        /// <summary>
        /// Obtiene los periodos bimestrales disponibles para consulta de certificados.
        /// Unifica los periodos de ICA e IVA y los convierte a su nombre legible
        /// usando el arreglo <c>periods</c>.
        /// </summary>
        /// <returns>Conjunto de nombres de periodos ordenados cronológicamente.</returns>
        public HashSet<string> GetAvalibleMonths()
        {
            HashSet<string> months = new HashSet<string>();
            var disticntPeriods = _context.CertificadosIcas.Select(x => x.Periodo).Distinct().ToHashSet();
            disticntPeriods.UnionWith(_context.CertificadosIvas.Select(x => x.Periodo).Distinct());

            foreach (var period in disticntPeriods)
            {
                months.Add(periods[period]);
            }

            return months.OrderBy(m => Array.IndexOf(periods,m)).ToHashSet();

        }

        /// <summary>
        /// Punto de entrada unificado para generar cualquier tipo de certificado.
        /// Filtra los registros según los parámetros, carga las navegaciones y delega
        /// la generación del PDF al método correspondiente según el tipo.
        /// </summary>
        /// <param name="certificateType">Tipo de certificado: "1" = IVA, "2" = ICA, "3" = RTF.</param>
        /// <param name="companyId">ID de la empresa retenedora.</param>
        /// <param name="year">Año del certificado.</param>
        /// <param name="period">Nombre del periodo bimestral (ej: "ENERO-FEBRERO"). No aplica para RTF.</param>
        /// <param name="nit">NIT del proveedor al que se le practicó la retención.</param>
        /// <returns>Ruta relativa del PDF generado, o cadena vacía si no hay registros o hay error.</returns>
        public string GenerateCertificate(string certificateType, string companyId, string year, string period, string nit)
        {
            try
            {
                int periodInt = Array.IndexOf(periods, period);
                string url = String.Empty;

                if (certificateType.Equals("1"))
                {
                    List<CertificadosIva> ivaCertificates = _context.CertificadosIvas
                                                            .Where(x => x.Nit == nit && x.IdEmpresa.ToString() == companyId && x.Ano.ToString() == year && x.Periodo == periodInt)
                                                            .ToList();
                    if (ivaCertificates.Count == 0)
                    {
                        return "";
                    }

                    foreach (var cert in ivaCertificates)
                    {
                        cert.IdEmpresaNavigation = _context.EmpresasMasters.FirstOrDefault(e => e.IdEmpresa == cert.IdEmpresa);
                        cert.NitNavigation = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == cert.Nit);
                    }

                    url = GenerateIvaCertificate(ivaCertificates);
                }
                else if (certificateType.Equals("2"))
                {
                    List<CertificadosIca> icaCertificates = _context.CertificadosIcas
                                                            .Where(x => x.Nit == nit && x.IdEmpresa.ToString() == companyId && x.Ano.ToString() == year && x.Periodo == periodInt)
                                                            .ToList();

                    foreach (var cert in icaCertificates)
                    {
                        cert.IdEmpresaNavigation = _context.EmpresasMasters.FirstOrDefault(e => e.IdEmpresa == cert.IdEmpresa);
                        cert.NitNavigation = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == cert.Nit);
                    }

                    url = GenerateIcaCertificate(icaCertificates);
                }
                else if (certificateType.Equals("3"))
                {
                    List<CertificadosRtefte> rtfteCertificates = _context.CertificadosRteftes
                                                            .Where(x => x.Nit == nit && x.IdEmpresa.ToString() == companyId && x.Ano.ToString() == year)
                                                            .ToList();

                    foreach (var cert in rtfteCertificates)
                    {
                        cert.IdEmpresaNavigation = _context.EmpresasMasters.FirstOrDefault(e => e.IdEmpresa == cert.IdEmpresa);
                        cert.NitNavigation = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == cert.Nit);
                    }

                    url = GenerateRtfCertificate(rtfteCertificates);
                }
                return url;
            }
            catch (Exception e)
            {
                return "";
            }

        }

        /// <summary>
        /// Genera el PDF del certificado IVA usando iText7.
        /// El archivo se guarda en <c>wwwroot/Certificados/Generados/</c> con nombre
        /// <c>{NIT}_{Empresa}_CertificadoIVA.pdf</c>.
        /// Incluye logo de la empresa si existe en <c>wwwroot/images/Logos_Empresas/</c>.
        /// </summary>
        /// <param name="certificates">Lista de registros IVA para el mismo NIT, empresa y periodo.</param>
        /// <returns>Ruta relativa del PDF (sin "wwwroot"), o cadena vacía si hay error.</returns>
        private string GenerateIvaCertificate(List<CertificadosIva> certificates)
        {
            try
            {
                string fileName = certificates[0].NitNavigation.Nit + "_" + certificates[0].IdEmpresaNavigation.Nombre + "_CertificadoIVA.pdf";
                string logoPath = Path.Combine("wwwroot", "images", "Logos_Empresas", certificates[0].IdEmpresaNavigation.Nombre + ".png");
                string path = Path.Combine("wwwroot", "Certificados", "Generados", fileName);
                using (PdfWriter writer = new PdfWriter(path))
                {
                    using (PdfDocument pdf = new PdfDocument(writer))
                    {
                        iText.Layout.Document document = new iText.Layout.Document(pdf);
                        PdfFont boldFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA_BOLD);
                        PdfFont normalFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);

                        if (File.Exists(logoPath))
                        {
                            ImageData imageData = ImageDataFactory.Create(logoPath);
                            Image image = new Image(imageData);


                            image.SetHeight(60);

                            image.SetHorizontalAlignment(HorizontalAlignment.CENTER);
                            document.Add(image);
                        }
                        Paragraph title = new Paragraph();
                        title.Add(new Text("CERTIFICADO DE RETENCIÓN DE IVA").SetFont(boldFont));
                        title.SetTextAlignment(TextAlignment.CENTER);

                        document.Add(title);

                        document.Add(new Paragraph("\n"));

                        Table dateInfo = new Table(5);

                        Cell yearHeader = new Cell();
                        yearHeader.Add(new Paragraph("Año").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        dateInfo.AddHeaderCell(yearHeader);

                        Cell periodHeader = new Cell();
                        periodHeader.Add(new Paragraph("Periodo").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        dateInfo.AddHeaderCell(periodHeader);

                        dateInfo.AddCell(certificates[0].Ano.ToString());
                        dateInfo.AddCell(periods[certificates[0].Periodo]);

                        Table infoAgents = new Table(5);

                        Cell headerRetentionAgent = new Cell(1, 2);
                        headerRetentionAgent.Add(new Paragraph("Apellidos y nombre o razón social del agente retenedor").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerRetentionAgent);

                        Cell headerAddressRetention = new Cell();
                        headerAddressRetention.Add(new Paragraph("Dirección").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerAddressRetention);

                        Cell headerNitRetention = new Cell();
                        headerNitRetention.Add(new Paragraph("NIT O C.C").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerNitRetention);

                        Cell headerVerificationCode = new Cell();
                        headerVerificationCode.Add(new Paragraph("CV").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerVerificationCode);

                        Cell nameRetention = new Cell(1, 2);
                        nameRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nombre.ToUpper()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nameRetention);

                        Cell addressRetention = new Cell();
                        addressRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Direccion).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(addressRetention);

                        Cell nitRetention = new Cell();
                        nitRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nit.Substring(0, certificates[0].IdEmpresaNavigation.Nit.Length - 1)).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nitRetention);

                        Cell verificationCode = new Cell();
                        verificationCode.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nit.Substring(certificates[0].IdEmpresaNavigation.Nit.Length - 1)).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(verificationCode);

                        Cell headerAgent = new Cell(1, 4);
                        headerAgent.Add(new Paragraph("Apellidos y nombre o razón social a quien se le practicó la retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerAgent);

                        Cell headerNitAgent = new Cell();
                        headerNitAgent.Add(new Paragraph("NIT O C.C").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerNitAgent);

                        Cell nameAgent = new Cell(1, 4);
                        nameAgent.Add(new Paragraph(certificates[0].NitNavigation.Nombre.ToUpper()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nameAgent);

                        Cell nitAgent = new Cell();
                        nitAgent.Add(new Paragraph(certificates[0].NitNavigation.Nit).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nitAgent);

                        Cell headerConcept = new Cell();
                        headerConcept.Add(new Paragraph("Concepto de retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerConcept);

                        Cell headerCity = new Cell();
                        headerCity.Add(new Paragraph("Ciudad donde se consigno la retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerCity);

                        Cell headerBase = new Cell();
                        headerBase.Add(new Paragraph("Monto de IVA generado").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerBase);

                        Cell percentage = new Cell();
                        percentage.Add(new Paragraph("Porcentaje de retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(percentage);

                        Cell retainedValue = new Cell();
                        retainedValue.Add(new Paragraph("Valor retenido").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(retainedValue);


                        foreach (var cert in certificates)
                        {
                            infoAgents.AddCell(cert.Concepto).SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell(cert.CiudadPago.ToUpper()).SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell("$" + cert.Iva.ToString("#,##0")).SetTextAlignment(TextAlignment.CENTER);
                            var percentageInt = cert.Porcentaje * 100;
                            infoAgents.AddCell(percentageInt.ToString("0.##") + "%").SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell("$" + cert.Retenido.ToString("#,##0")).SetTextAlignment(TextAlignment.CENTER);
                        }

                        document.Add(dateInfo);
                        document.Add(infoAgents);

                        Paragraph expeditionDate = new Paragraph();
                        expeditionDate.Add(new Text("Fecha de expedición: " + certificates[0].FechaExpedicion.ToString("dd/MM/yyyy")));
                        expeditionDate.SetTextAlignment(TextAlignment.RIGHT);

                        document.Add(expeditionDate);

                        document.Add(new Paragraph("\n"));

                        Paragraph footer = new Paragraph();
                        footer.Add("De acuerdo con el artículo 7 del Decreto 380 de 1996, recopilado en el artículo 1.6.1.12.13 del DUR 1625 de octubre\r\nde 2016, los certificados expedidos por computador no requieren firma autógrafa.");
                        footer.SetTextAlignment(TextAlignment.CENTER);
                        footer.SetFont(boldFont);
                        footer.SetFontSize(9);
                        document.Add(footer);
                    }
                }
                return path.Replace("wwwroot", string.Empty);
            }
            catch (Exception e)
            {
                return string.Empty;
            }

        }

        /// <summary>
        /// Genera el PDF del certificado ICA.
        /// Misma estructura que IVA pero con columna "Base" en lugar de "Monto de IVA generado".
        /// Archivo guardado como <c>{NIT}_{Empresa}_CertificadoICA.pdf</c>.
        /// </summary>
        /// <param name="certificates">Lista de registros ICA para el mismo NIT, empresa y periodo.</param>
        /// <returns>Ruta relativa del PDF, o cadena vacía si hay error.</returns>
        private string GenerateIcaCertificate(List<CertificadosIca> certificates)
        {
            try
            {
                string fileName = certificates[0].NitNavigation.Nit + "_" + certificates[0].IdEmpresaNavigation.Nombre + "_CertificadoICA.pdf";
                string logoPath = Path.Combine("wwwroot", "images", "Logos_Empresas", certificates[0].IdEmpresaNavigation.Nombre + ".png");
                string path = Path.Combine("wwwroot", "Certificados", "Generados", fileName);
                using (PdfWriter writer = new PdfWriter(path))
                {
                    using (PdfDocument pdf = new PdfDocument(writer))
                    {
                        iText.Layout.Document document = new iText.Layout.Document(pdf);
                        PdfFont boldFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA_BOLD);
                        PdfFont normalFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);

                        if (File.Exists(logoPath))
                        {
                            ImageData imageData = ImageDataFactory.Create(logoPath);
                            Image image = new Image(imageData);


                            image.SetHeight(60);

                            image.SetHorizontalAlignment(HorizontalAlignment.CENTER);
                            document.Add(image);
                        }
                        Paragraph title = new Paragraph();
                        title.Add(new Text("CERTIFICADO DE RETENCIÓN DE ICA").SetFont(boldFont));
                        title.SetTextAlignment(TextAlignment.CENTER);

                        document.Add(title);

                        document.Add(new Paragraph("\n"));

                        Table dateInfo = new Table(5);

                        Cell yearHeader = new Cell();
                        yearHeader.Add(new Paragraph("Año").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        dateInfo.AddHeaderCell(yearHeader);

                        Cell periodHeader = new Cell();
                        periodHeader.Add(new Paragraph("Periodo").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        dateInfo.AddHeaderCell(periodHeader);

                        dateInfo.AddCell(certificates[0].Ano.ToString());
                        dateInfo.AddCell(periods[certificates[0].Periodo]);

                        Table infoAgents = new Table(5);

                        Cell headerRetentionAgent = new Cell(1, 2);
                        headerRetentionAgent.Add(new Paragraph("Apellidos y nombre o razón social del agente retenedor").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerRetentionAgent);

                        Cell headerAddressRetention = new Cell();
                        headerAddressRetention.Add(new Paragraph("Dirección").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerAddressRetention);

                        Cell headerNitRetention = new Cell();
                        headerNitRetention.Add(new Paragraph("NIT O C.C").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerNitRetention);

                        Cell headerVerificationCode = new Cell();
                        headerVerificationCode.Add(new Paragraph("CV").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerVerificationCode);

                        Cell nameRetention = new Cell(1, 2);
                        nameRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nombre.ToUpper()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nameRetention);

                        Cell addressRetention = new Cell();
                        addressRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Direccion).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(addressRetention);

                        Cell nitRetention = new Cell();
                        nitRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nit.Substring(0, certificates[0].IdEmpresaNavigation.Nit.Length - 1)).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nitRetention);

                        Cell verificationCode = new Cell();
                        verificationCode.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nit.Substring(certificates[0].IdEmpresaNavigation.Nit.Length - 1)).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(verificationCode);

                        Cell headerAgent = new Cell(1, 4);
                        headerAgent.Add(new Paragraph("Apellidos y nombre o razón social a quien se le practicó la retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerAgent);

                        Cell headerNitAgent = new Cell();
                        headerNitAgent.Add(new Paragraph("NIT O C.C").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerNitAgent);

                        Cell nameAgent = new Cell(1, 4);
                        nameAgent.Add(new Paragraph(certificates[0].NitNavigation.Nombre.ToUpper()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nameAgent);

                        Cell nitAgent = new Cell();
                        nitAgent.Add(new Paragraph(certificates[0].NitNavigation.Nit).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nitAgent);

                        Cell headerConcept = new Cell();
                        headerConcept.Add(new Paragraph("Concepto de retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerConcept);

                        Cell headerCity = new Cell();
                        headerCity.Add(new Paragraph("Ciudad donde se consigno la retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerCity);

                        Cell headerBase = new Cell();
                        headerBase.Add(new Paragraph("Base").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerBase);

                        Cell percentage = new Cell();
                        percentage.Add(new Paragraph("Porcentaje de retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(percentage);

                        Cell retainedValue = new Cell();
                        retainedValue.Add(new Paragraph("Valor retenido").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(retainedValue);


                        foreach (var cert in certificates)
                        {
                            infoAgents.AddCell(cert.Concepto).SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell(cert.CiudadPago.ToUpper()).SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell("$" + cert.Base.ToString("#,##0")).SetTextAlignment(TextAlignment.CENTER);
                            var percentageInt = cert.Porcentaje * 100;
                            infoAgents.AddCell(percentageInt.ToString("0.##") + "%").SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell("$" + cert.Retenido.ToString("#,##0")).SetTextAlignment(TextAlignment.CENTER);
                        }

                        document.Add(dateInfo);
                        document.Add(infoAgents);

                        Paragraph expeditionDate = new Paragraph();
                        expeditionDate.Add(new Text("Fecha de expedición: " + certificates[0].FechaExpedicion.ToString("dd/MM/yyyy")));
                        expeditionDate.SetTextAlignment(TextAlignment.RIGHT);

                        document.Add(expeditionDate);

                        document.Add(new Paragraph("\n"));

                        Paragraph footer = new Paragraph();
                        footer.Add("De acuerdo con el artículo 7 del Decreto 380 de 1996, recopilado en el artículo 1.6.1.12.13 del DUR 1625 de octubre\r\nde 2016, los certificados expedidos por computador no requieren firma autógrafa.");
                        footer.SetTextAlignment(TextAlignment.CENTER);
                        footer.SetFont(boldFont);
                        footer.SetFontSize(9);
                        document.Add(footer);
                    }
                }
                return path.Replace("wwwroot", string.Empty);
            }
            catch (Exception e)
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Genera el PDF del certificado de Retención en la Fuente (RTF).
        /// A diferencia de IVA e ICA, RTF no tiene periodo bimestral — filtra solo por año.
        /// Archivo guardado como <c>{NIT}_{Empresa}_CertificadoRTF.pdf</c>.
        /// </summary>
        /// <param name="certificates">Lista de registros RTF para el mismo NIT, empresa y año.</param>
        /// <returns>Ruta relativa del PDF, o cadena vacía si hay error.</returns>
        private string GenerateRtfCertificate(List<CertificadosRtefte> certificates)
        {
            try
            {
                string fileName = certificates[0].NitNavigation.Nit + "_" + certificates[0].IdEmpresaNavigation.Nombre + "_CertificadoRTF.pdf";
                string logoPath = Path.Combine("wwwroot", "images", "Logos_Empresas", certificates[0].IdEmpresaNavigation.Nombre + ".png");
                string path = Path.Combine("wwwroot", "Certificados", "Generados", fileName);
                using (PdfWriter writer = new PdfWriter(path))
                {
                    using (PdfDocument pdf = new PdfDocument(writer))
                    {
                        iText.Layout.Document document = new iText.Layout.Document(pdf);
                        PdfFont boldFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA_BOLD);
                        PdfFont normalFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);

                        if (File.Exists(logoPath))
                        {
                            ImageData imageData = ImageDataFactory.Create(logoPath);
                            Image image = new Image(imageData);


                            image.SetHeight(60);

                            image.SetHorizontalAlignment(HorizontalAlignment.CENTER);
                            document.Add(image);
                        }
                        Paragraph title = new Paragraph();
                        title.Add(new Text("CERTIFICADO DE RETENCIÓN EN LA FUENTE").SetFont(boldFont));
                        title.SetTextAlignment(TextAlignment.CENTER);

                        document.Add(title);

                        document.Add(new Paragraph("\n"));

                        Table infoAgents = new Table(4);

                        Cell headerRetentionAgent = new Cell(1, 2);
                        headerRetentionAgent.Add(new Paragraph("Apellidos y nombre o razón social del agente retenedor").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerRetentionAgent);

                        Cell headerNitRetention = new Cell();
                        headerNitRetention.Add(new Paragraph("NIT O C.C").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerNitRetention);

                        Cell headerVerificationCode = new Cell();
                        headerVerificationCode.Add(new Paragraph("CV").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddHeaderCell(headerVerificationCode);


                        Cell nameRetention = new Cell(1, 2);
                        nameRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nombre.ToUpper()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nameRetention);


                        Cell nitRetention = new Cell();
                        nitRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nit.Substring(0, certificates[0].IdEmpresaNavigation.Nit.Length - 1)).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nitRetention);

                        Cell verificationCode = new Cell();
                        verificationCode.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Nit.Substring(certificates[0].IdEmpresaNavigation.Nit.Length - 1)).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(verificationCode);

                        Cell headerAddressRetention = new Cell(1, 2);
                        headerAddressRetention.Add(new Paragraph("Dirección del agente retenedor").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerAddressRetention);

                        Cell headerYear = new Cell();
                        headerYear.Add(new Paragraph("Año gravable").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerYear);

                        Cell headerCity = new Cell();
                        headerCity.Add(new Paragraph("Ciudad o municipio").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerCity);

                        Cell addressRetention = new Cell(1, 2);
                        addressRetention.Add(new Paragraph(certificates[0].IdEmpresaNavigation.Direccion).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(addressRetention);

                        Cell year = new Cell();
                        year.Add(new Paragraph(certificates[0].Ano.ToString()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(year);

                        Cell city = new Cell();
                        city.Add(new Paragraph(certificates[0].CiudadPago).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(city);

                        Cell headerAgent = new Cell(1, 2);
                        headerAgent.Add(new Paragraph("Apellidos y nombre o razón social a quien se le practicó la retención").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerAgent);

                        Cell headerNitAgent = new Cell(1, 2);
                        headerNitAgent.Add(new Paragraph("NIT O C.C").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerNitAgent);

                        Cell nameAgent = new Cell(1, 2);
                        nameAgent.Add(new Paragraph(certificates[0].NitNavigation.Nombre.ToUpper()).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nameAgent);

                        Cell nitAgent = new Cell(1, 2);
                        nitAgent.Add(new Paragraph(certificates[0].NitNavigation.Nit).SetTextAlignment(TextAlignment.CENTER));
                        infoAgents.AddCell(nitAgent);

                        Cell headerPercentage = new Cell();
                        headerPercentage.Add(new Paragraph("Porcentaje").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerPercentage);

                        Cell headerDescription = new Cell();
                        headerDescription.Add(new Paragraph("Descripción").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(headerDescription);

                        Cell baseRetention = new Cell();
                        baseRetention.Add(new Paragraph("Base").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(baseRetention);

                        Cell retainedValue = new Cell();
                        retainedValue.Add(new Paragraph("Valor retenido").SetTextAlignment(TextAlignment.CENTER).SetFont(boldFont));
                        infoAgents.AddCell(retainedValue);

                        var totalRetained = 0.0m;
                        foreach (var cert in certificates)
                        {
                            totalRetained += cert.Retenido;
                            var percentageInt = cert.Porcentaje * 100;
                            infoAgents.AddCell(percentageInt.ToString("0.##") + "%").SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell(cert.Concepto).SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell("$" + cert.Base.ToString("#,##0")).SetTextAlignment(TextAlignment.CENTER);
                            infoAgents.AddCell("$" + cert.Retenido.ToString("#,##0")).SetTextAlignment(TextAlignment.CENTER);
                        }

                        document.Add(infoAgents);
                        Paragraph expeditionDate = new Paragraph();
                        expeditionDate.Add(new Text("Fecha de expedición: " + certificates[0].FechaExpedicion.ToString("dd/MM/yyyy")));
                        expeditionDate.SetTextAlignment(TextAlignment.RIGHT);

                        document.Add(expeditionDate);

                        document.Add(new Paragraph("\n"));

                        Paragraph footer = new Paragraph();
                        footer.Add("Este documento no requiere para su validez firma autógrafa de acuerdo con el artículo 10 del Decreto 836 de 1991, recopilado en el artículo 1.6.1.12.12 del DUT 1625 de octubre de 2016, que regula el contenido del certificado de retenciones a título de renta». Estas retenciones fueron declaradas y consignadas en Bogotá D.C");
                        footer.SetTextAlignment(TextAlignment.CENTER);
                        footer.SetFont(boldFont);
                        footer.SetFontSize(9);
                        document.Add(footer);
                    }
                }
                return path.Replace("wwwroot", string.Empty);
            }
            catch (Exception e)
            {
                return string.Empty;
            }
        }


    }
}
