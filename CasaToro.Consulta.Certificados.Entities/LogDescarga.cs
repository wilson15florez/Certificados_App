using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class LogDescarga
{
    public Guid IdRegistroDescargas { get; set; }

    public string NitTercero { get; set; } = null!;

    public string NombreTercero { get; set; } = null!;

    public DateTime FecDesc { get; set; }

    public string DocumentoDesc { get; set; } = null!;

    public virtual Proveedores_Master NitTerceroNavigation { get; set; } = null!;
}
