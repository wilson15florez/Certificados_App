
using Microsoft.Data.SqlClient;
using System.Globalization;
using System.Text.RegularExpressions;
using CasaToro.Consulta.Certificados.DAL;
using CasaToro.Consulta.Certificados.Entities;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Http;



namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class CertificateServiceExcel
    {
        private readonly ApplicationDbContext _context;

        //Constructor del servicio que recibe una instancia de ApplicationDbContext (bd)
        public CertificateServiceExcel(ApplicationDbContext context)
        {
            _context = context;
        }

        //Método que agrega información de certificados de IVA desde un archivo Excel
        public (string message, bool success) AddInfoIvaFromExcel(IFormFile file)
        {
            try
            {
                using (var stream = new MemoryStream())
                {
                    file.CopyTo(stream);
                    stream.Position = 0;

                    // Abrir el archivo Excel con OpenXML
                    using (SpreadsheetDocument document = SpreadsheetDocument.Open(stream, false))
                    {
                        WorkbookPart workbookPart = document.WorkbookPart;
                        Sheet sheet = workbookPart.Workbook.Sheets.GetFirstChild<Sheet>();
                        WorksheetPart worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id);
                        SheetData sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();

                        // Obtener la fila de encabezados y verificar que sean correctos
                        Row headersIva = sheetData.Elements<Row>().FirstOrDefault();

                        if (headersIva == null)
                        {
                            throw new InvalidExcelFormatException("⚠️ El archivo no contiene encabezados. Asegúrese de que el archivo tenga la información correcta antes de intentar subirlo.");
                        }

                        if (!IsHeadersRight(headersIva, "IVA", workbookPart))
                        {
                            throw new InvalidExcelFormatException("⚠️ El archivo no tiene la estructura correcta.\n\n" +
                                "📌 Formato esperado para el archivo de IVA:\n\n" +
                                " nit |  id_empresa |  nombre |  concepto |  porcentaje_iva |  porcentaje |  base |  iva |  retenido |  ano |  periodo |  ciudad_Pago |  ciudad_Expedido |  fecha_expedicion\n\n" +
                                "Por favor, revise la estructura del archivo y vuelva a intentarlo.\n");
                        }
                        // Recorrer las filas del archivo y agregar la información a la base de datos
                        foreach (Row row in sheetData.Elements<Row>().Skip(1)) // Comenzar en la fila 2 para omitir el encabezado
                        {
                            // Verificar si el proveedor ya existe en la base de datos y agregarlo si no
                            var provider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)));
                            if (provider == null)
                            {
                                var newProvider = new Proveedores_Master
                                {
                                    Nit = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)),
                                    Nombre = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(2))
                                };
                                _context.Proveedores_Master.Add(newProvider);
                                _context.SaveChanges();
                            }
                            ;
                            // Crear un objeto CertificadoIva con los datos de la fila
                            var certificadoIva = new CertificadosIva
                            {
                                IdIva = Guid.NewGuid(),
                                Nit = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)),
                                IdEmpresa = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(1))),
                                Concepto = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(3)),
                                PorcentajeIva = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(4)), CultureInfo.InvariantCulture) / 100,
                                Porcentaje = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(5)), CultureInfo.InvariantCulture) / 100,
                                Base = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(6)), CultureInfo.InvariantCulture),
                                Iva = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(7)), CultureInfo.InvariantCulture),
                                Retenido = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(8)), CultureInfo.InvariantCulture),
                                Ano = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(9))),
                                Periodo = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(10))),
                                CiudadPago = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(11)),
                                CiudadExpedido = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(12)),
                                FechaExpedicion = DateOnly.FromDateTime(DateTime.FromOADate(double.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(13)))))

                            };

                            // Agregar el certificado a la base de datos
                            _context.CertificadosIvas.Add(certificadoIva);
                        }

                        // Guardar los cambios en la base de datos
                        _context.SaveChanges();
                    }
                }
                return ("Datos cargados correctamente", true);
            }
            catch (Exception e)
            {
                var innerException = e.InnerException as SqlException;

                if (innerException != null)
                {
                    switch (innerException.Number)
                    {
                        case 2627: // Clave única duplicada
                            var duplicateKeyValues = ExtractDuplicateKeyValues(innerException.Message);

                            var existingRecords = _context.CertificadosIvas
                                .Where(c =>
                                    c.Nit == duplicateKeyValues.Nit &&
                                    c.IdEmpresa == duplicateKeyValues.IdEmpresa &&
                                    c.Ano == duplicateKeyValues.Ano &&
                                    c.Periodo == duplicateKeyValues.Periodo &&
                                    c.Concepto == duplicateKeyValues.Descripcion
                                )
                                .ToList();

                            var message = existingRecords.Count > 0
                                ? $"⚠️  Hemos detectado que algunos registros en el archivo ya existen en la base de datos.\n\n" +
                                  $"📌 Detalles del registro existente:\n" +
                                  $"- NIT: {duplicateKeyValues.Nit}\n" +
                                  $"- Empresa: {duplicateKeyValues.IdEmpresa}\n" +
                                  $"- Año: {duplicateKeyValues.Ano}\n" +
                                  $"- Concepto: {duplicateKeyValues.Descripcion}\n\n" +
                                  $"Por favor, verifique los datos antes de intentar nuevamente. "
                                : "⚠️ Se detectó un problema con los datos. El registro parece estar duplicado, pero no pudimos encontrarlo en la base de datos. Verifique los datos e intente nuevamente.\n" +
                                  $"Datos en conflicto: \n" + $"- NIT: {duplicateKeyValues.Nit}\n" +
                                  $"- Empresa: {duplicateKeyValues.IdEmpresa}\n" +
                                  $"- Año: {duplicateKeyValues.Ano}\n" +
                                  $"- Concepto: {duplicateKeyValues.Descripcion}\n\n" +
                                  $"Por favor, verifique los datos antes de intentar nuevamente. ";

                            return (message, false);

                        case 547: // Violación de clave foránea (FK)
                            return ("⚠️ Econtramos un ID de empresa no válido en el archivo. Verifique que el Id de empresa sea correcto antes de subir el archivo.", false);

                        case 515: // Un campo obligatorio es nulo
                            return ("⚠️ El archivo contiene datos incompletos. Asegúrese de llenar todos los campos obligatorios.", false);

                        default: // Otro error de SQL
                            return ("Ocurrió un error inesperado al procesar el archivo. Verifique los datos e intente nuevamente.", false);
                    }
                }
                return ($"Ocurrió un error al procesar la solicitud. Detalles técnicos:\n {e.Message}", false);
            }

        }

        //Método que agrega información de certificados de ICA desde un archivo Excel
        public (string message, bool success) AddInfoIcaFromExcel(IFormFile file)
        {
            try
            {
                using (var stream = new MemoryStream())
                {
                    file.CopyTo(stream);
                    stream.Position = 0;
                    // Abrir el archivo Excel con OpenXML
                    using (SpreadsheetDocument document = SpreadsheetDocument.Open(stream, false))
                    {
                        WorkbookPart workbookPart = document.WorkbookPart;
                        Sheet sheet = workbookPart.Workbook.Sheets.GetFirstChild<Sheet>();
                        WorksheetPart worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id);
                        SheetData sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();

                        // Obtener la fila de encabezados y verificar que sean correctos
                        Row headersIca = sheetData.Elements<Row>().FirstOrDefault();
                        if (headersIca == null)
                        {
                            throw new InvalidExcelFormatException("⚠️ El archivo no contiene encabezados. Asegúrese de que el archivo tenga la información correcta antes de intentar subirlo.");
                        }

                        if (!IsHeadersRight(headersIca, "ICA", workbookPart))
                        {
                            throw new InvalidExcelFormatException("⚠️ El archivo no tiene la estructura correcta.\n\n" +
                                "📌 Formato esperado para el archivo de ICA:\n\n" +
                                "nit |  id_empresa |  nombre |  concepto |  porcentaje |  base |  retenido |  ano |  periodo |  ciudad_Pago |  ciudad_Expedido |  fecha_expedicion\n\n" +
                                "Por favor, revise la estructura del archivo y vuelva a intentarlo.\n");
                        }
                        // Recorrer las filas del archivo y agregar la información a la base de datos
                        foreach (Row row in sheetData.Elements<Row>().Skip(1)) // Comenzar en la fila 2 para omitir el encabezado
                        {
                            // Verificar si el proveedor ya existe en la base de datos y agregarlo si no
                            var provider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)));
                            if (provider == null)
                            {
                                var newProvider = new Proveedores_Master
                                {
                                    Nit = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)),
                                    Nombre = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(2))
                                };
                                _context.Proveedores_Master.Add(newProvider);
                                _context.SaveChanges();
                            }
                            ;
                            // Crear un objeto CertificadoIca con los datos de la fila
                            var certificadoIca = new CertificadosIca
                            {
                                IdIca = Guid.NewGuid(),
                                Nit = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)),
                                IdEmpresa = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(1))),
                                Concepto = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(3)),
                                Porcentaje = (decimal)double.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(4)), CultureInfo.InvariantCulture),
                                Base = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(5)), CultureInfo.InvariantCulture),
                                Retenido = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(6)), CultureInfo.InvariantCulture),
                                Ano = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(7))),
                                Periodo = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(8))),
                                CiudadPago = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(9)),
                                CiudadExpedido = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(10)),
                                FechaExpedicion = DateOnly.FromDateTime(DateTime.FromOADate(double.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(11)))))

                            };

                            // Agregar el certificado a la base de datos
                            _context.CertificadosIcas.Add(certificadoIca);
                        }

                        // Guardar los cambios en la base de datos
                        _context.SaveChanges();
                    }
                }
                return ("Datos cargados correctamente", true);
            }
            catch (Exception e)
            {
                var innerException = e.InnerException as SqlException;

                if (innerException != null)
                {
                    switch (innerException.Number)
                    {
                        case 2627: // Clave única duplicada
                            var duplicateKeyValues = ExtractDuplicateKeyValues(innerException.Message);

                            var existingRecords = _context.CertificadosIcas
                                .Where(c =>
                                    c.Nit == duplicateKeyValues.Nit &&
                                    c.IdEmpresa == duplicateKeyValues.IdEmpresa &&
                                    c.Ano == duplicateKeyValues.Ano &&
                                    c.Periodo == duplicateKeyValues.Periodo &&
                                    c.Concepto == duplicateKeyValues.Descripcion
                                )
                                .ToList();

                            var message = existingRecords.Count > 0
                                 ? $"⚠️  Hemos detectado que algunos registros en el archivo ya existen en la base de datos.\n\n" +
                                   $"📌 Detalles del registro existente:\n" +
                                   $"- NIT: {duplicateKeyValues.Nit}\n" +
                                   $"- Empresa: {duplicateKeyValues.IdEmpresa}\n" +
                                   $"- Año: {duplicateKeyValues.Ano}\n" +
                                   $"- Concepto: {duplicateKeyValues.Descripcion}\n\n" +
                                   $"Por favor, verifique los datos antes de intentar nuevamente. "
                                 : "⚠️ Se detectó un problema con los datos. El registro parece estar duplicado, pero no pudimos encontrarlo en la base de datos. Verifique los datos e intente nuevamente.\n" +
                                   $"Datos en conflicto: \n" + $"- NIT: {duplicateKeyValues.Nit}\n" +
                                   $"- Empresa: {duplicateKeyValues.IdEmpresa}\n" +
                                   $"- Año: {duplicateKeyValues.Ano}\n" +
                                   $"- Concepto: {duplicateKeyValues.Descripcion}\n\n" +
                                   $"Por favor, verifique los datos antes de intentar nuevamente. ";
                            return (message, false);

                        case 547: // Violación de clave foránea (FK)
                            return ("⚠️ Econtramos un ID de empresa no válido en el archivo. Verifique que el Id de empresa sea correcto antes de subir el archivo.", false);

                        case 515: // Un campo obligatorio es nulo
                            return ("⚠️ El archivo contiene datos incompletos. Asegúrese de llenar todos los campos obligatorios.", false);

                        default:
                            return ("Ocurrió un error inesperado al procesar el archivo. Verifique los datos e intente nuevamente.", false);
                    }
                }
                return ($"Ocurrió un error al procesar la solicitud. Detalles técnicos:\n {e.Message}", false);
            }
        }

        //Método que agrega información de certificados de RTF desde un archivo Excel
        public (string message, bool success) AddInfoRtfFromExcel(IFormFile file)
        {
            try
            {
                using (var stream = new MemoryStream())
                {
                    file.CopyTo(stream);
                    stream.Position = 0;
                    // Abrir el archivo Excel con OpenXML
                    using (SpreadsheetDocument document = SpreadsheetDocument.Open(stream, false))
                    {
                        WorkbookPart workbookPart = document.WorkbookPart;
                        Sheet sheet = workbookPart.Workbook.Sheets.GetFirstChild<Sheet>();
                        WorksheetPart worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id);
                        SheetData sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();

                        // Obtener la fila de encabezados y verificar que sean correctos
                        Row headersRtf = sheetData.Elements<Row>().FirstOrDefault();
                        if (headersRtf == null)
                        {
                            throw new InvalidExcelFormatException("⚠️ El archivo no contiene encabezados. Asegúrese de que el archivo tenga la información correcta antes de intentar subirlo.");
                        }

                        if (!IsHeadersRight(headersRtf, "RTF", workbookPart))
                        {
                            throw new InvalidExcelFormatException("⚠️ El archivo no tiene la estructura correcta.\n\n" +
                                "📌 Formato esperado para el archivo de RTF:\n\n" +
                                " Nit |  Id_empresa |  Nombre |  Concepto |  Porcentaje |  Base |  Retenido |  Ano |  Mes |  Ciudad_Pago |  Ciudad_Expedido |  Fecha_expedicion\n\n" +
                                " Por favor, revise la estructura del archivo y vuelva a intentarlo.\n");
                        }
                        // Recorrer las filas del archivo y agregar la información a la base de datos
                        foreach (Row row in sheetData.Elements<Row>().Skip(1)) // Comenzar en la fila 2 para omitir el encabezado
                        {
                            var provider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)));
                            if (provider == null)
                            {
                                var newProvider = new Proveedores_Master
                                {
                                    Nit = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)),
                                    Nombre = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(2))
                                };
                                _context.Proveedores_Master.Add(newProvider);
                                _context.SaveChanges();
                            }
                            ;
                            var certificadoRtf = new CertificadosRtefte
                            {
                                IdRtf = Guid.NewGuid(),
                                Nit = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(0)),
                                IdEmpresa = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(1))),
                                Concepto = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(3)),
                                Porcentaje = (decimal)double.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(4)), CultureInfo.InvariantCulture),
                                Base = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(5)), CultureInfo.InvariantCulture),
                                Retenido = decimal.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(6)), CultureInfo.InvariantCulture),
                                Ano = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(7))),
                                Mes = int.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(8))),
                                CiudadPago = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(9)),
                                CiudadExpedido = GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(10)),
                                FechaExpedicion = DateOnly.FromDateTime(DateTime.FromOADate(double.Parse(GetCellValue(workbookPart, row.Elements<Cell>().ElementAt(11)))))

                            };

                            // Agregar el certificado a la base de datos
                            _context.CertificadosRteftes.Add(certificadoRtf);
                        }

                        // Guardar los cambios en la base de datos
                        _context.SaveChanges();
                    }
                }
                return ("Datos cargados correctamente", true);
            }
            catch (Exception e)
            {
                var innerException = e.InnerException as SqlException;
                if (innerException != null)
                {
                    switch (innerException.Number)
                    {
                        case 2627: // Clave única duplicada
                            var duplicateKeyValues = ExtractDuplicateKeyValues(innerException.Message);

                            var existingRecords = _context.CertificadosRteftes
                                .Where(c =>
                                    c.Nit == duplicateKeyValues.Nit &&
                                    c.IdEmpresa == duplicateKeyValues.IdEmpresa &&
                                    c.Ano == duplicateKeyValues.Ano &&
                                    c.Mes == duplicateKeyValues.Periodo &&
                                    c.Concepto == duplicateKeyValues.Descripcion
                                )
                                .ToList();

                            var message = existingRecords.Count > 0
                                ? $"⚠️  Hemos detectado que algunos registros en el archivo ya existen en la base de datos.\n\n" +
                                  $"📌 Detalles del registro existente:\n" +
                                  $"- NIT: {duplicateKeyValues.Nit}\n" +
                                  $"- Empresa: {duplicateKeyValues.IdEmpresa}\n" +
                                  $"- Año: {duplicateKeyValues.Ano}\n" +
                                  $"- Concepto: {duplicateKeyValues.Descripcion}\n\n" +
                                  $"Por favor, verifique los datos antes de intentar nuevamente. "
                                : "⚠️ Se detectó un problema con los datos. El registro parece estar duplicado, pero no pudimos encontrarlo en la base de datos. Verifique los datos e intente nuevamente.\n" +
                                  $"Datos en conflicto: \n" + $"- NIT: {duplicateKeyValues.Nit}\n" +
                                  $"- Empresa: {duplicateKeyValues.IdEmpresa}\n" +
                                  $"- Año: {duplicateKeyValues.Ano}\n" +
                                  $"- Concepto: {duplicateKeyValues.Descripcion}\n\n" +
                                  $"Por favor, verifique los datos antes de intentar nuevamente. ";


                            return (message, false);

                        case 547: // Violación de clave foránea (FK)
                            return ("⚠️ Econtramos un Id de empresa no válido en el archivo. Verifique que el Id de empresa sea correcto antes de subir el archivo.", false);

                        case 515: // Un campo obligatorio es nulo
                            return ("⚠️ El archivo contiene datos incompletos. Asegúrese de llenar todos los campos obligatorios.", false);

                        default: // Otro error de SQL
                            return ("Ocurrió un error inesperado al procesar el archivo. Verifique los datos e intente nuevamente.", false);
                    }
                }
                return ($"Ocurrió un error al procesar la solicitud. Detalles técnicos:\n {e.Message}", false);
            }
        }

        //Método que extrae el valor de una celda en un archivo Excel con OpenXML retornando el valor como string
        private string GetCellValue(WorkbookPart workbookPart, Cell cell)
        {
            if (cell == null) return null;

            string value = cell.InnerText;

            if (cell.DataType != null && cell.DataType.Value == CellValues.SharedString)
            {
                return workbookPart.SharedStringTablePart.SharedStringTable.ChildElements[int.Parse(value)].InnerText;
            }

            return value;
        }


        //Método que extrae los valores de la clave duplicada desde un mensaje de error de SQL
        private (string Nit, int Periodo, int Ano, decimal Retenido, string Descripcion, int IdEmpresa) ExtractDuplicateKeyValues(string errorMessage)
        {
            var match = Regex.Match(errorMessage, @"The duplicate key value is \((\d+), (\d+), (\d+), ([\d.]+), (.+), (\d+)\)");
            if (match.Success)
            {
                return (
                    match.Groups[1].Value,  
                    int.Parse(match.Groups[2].Value),  
                    int.Parse(match.Groups[3].Value),  
                    decimal.Parse(match.Groups[4].Value),  
                    match.Groups[5].Value.Trim(), 
                    int.Parse(match.Groups[6].Value) 
                );
            }
            throw new InvalidOperationException("No se pudieron extraer los valores de la clave duplicada desde el mensaje de error.");
        }
        //Método que verifica si los encabezados del archivo Excel son correctos dependiendo del tipo de certificado
        private bool IsHeadersRight(Row headers,string type,WorkbookPart workbookPart)
        {
            if (type.Equals("IVA"))
            {
                string[] headersIva = { "nit", "id_empresa", "nombre", "concepto", "porcentaje_iva", "porcentaje", "base", "iva", "retenido", "ano", "periodo", "ciudad_Pago", "ciudad_Expedido", "fecha_expedicion" };
                // Verificar que la cantidad de encabezados coincida
                if (headers.Elements<Cell>().Count() != headersIva.Length)
                {
                    return false;
                }

                // Verificar que cada encabezado coincida exactamente
                int index = 0;
                foreach (Cell cell in headers.Elements<Cell>())
                {
                    if (GetCellValue(workbookPart, cell).ToLower() != headersIva[index].ToLower())
                    {
                        return false;
                    }
                    index++;
                }
            }

            if (type.Equals("ICA"))
            {
                string[] headersIca = { "nit", "id_empresa", "nombre", "concepto", "porcentaje", "base", "retenido", "ano", "periodo", "ciudad_Pago", "ciudad_Expedido", "fecha_expedicion" };
                // Verificar que la cantidad de encabezados coincida
                if (headers.Elements<Cell>().Count() != headersIca.Length)
                {
                    return false;
                }
                // Verificar que cada encabezado coincida exactamente
                int index = 0;
                foreach (Cell cell in headers.Elements<Cell>())
                {
                    if (GetCellValue(workbookPart, cell).ToLower() != headersIca[index].ToLower())
                    {
                        return false;
                    }
                    index++;
                }
            }

            if (type.Equals("RTF"))
            {
                string[] headersRtf = { "Nit", "id_empresa", "Nombre", "Concepto", "Porcentaje", "Base", "Retenido", "Ano", "Mes", "Ciudad_Pago", "Ciudad_Expedido", "fecha_expedicion" };
                // Verificar que la cantidad de encabezados coincida
                if (headers.Elements<Cell>().Count() != headersRtf.Length)
                {
                    return false;
                }
                // Verificar que cada encabezado coincida exactamente
                int index = 0;
                foreach (Cell cell in headers.Elements<Cell>())
                {
                    if (GetCellValue(workbookPart, cell).ToLower() != headersRtf[index].ToLower())
                    {
                        return false;
                    }
                    index++;
                }
            }
             return true;
        }


    }

    //Excepción personalizada para manejar errores de formato en archivos Excel
    public class InvalidExcelFormatException : Exception
    {
        public InvalidExcelFormatException(string message) : base(message)
        {
        }
    }
}
