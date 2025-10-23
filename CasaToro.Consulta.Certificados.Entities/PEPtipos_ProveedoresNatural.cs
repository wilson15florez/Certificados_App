using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class PEPtipos_ProveedoresNatural
{
    public string NitProveedor { get; set; } = null!;

    public int TipoPEPid { get; set; }

    public virtual PEPtipos TipoPEP { get; set; } = null!;
}
