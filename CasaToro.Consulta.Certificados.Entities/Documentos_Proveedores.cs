using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Documentos_Proveedores
{
    public int idDocProve { get; set; }

    public string? NitProveedor { get; set; }

    public string CategoriaDOC { get; set; } = null!;

    public string NombreArchivo { get; set; } = null!;

    public string RutaArchivo { get; set; } = null!;

    public DateTime? fechaCarga { get; set; }
}
