using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class LogLogin
{
    public Guid IdRegistroLogin { get; set; }

    public string NitTercero { get; set; } = null!;

    public string NombreTercero { get; set; } = null!;

    public DateTime FecLogin { get; set; }

    public virtual Proveedores_Master NitTerceroNavigation { get; set; } = null!;
}
