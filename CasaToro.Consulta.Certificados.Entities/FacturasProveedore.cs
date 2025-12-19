using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class FacturasProveedore
{
    public Guid IdFactura { get; set; }

    public string? NumeroFactura { get; set; }

    public int IdEmpresa { get; set; }

    public string Nit { get; set; } = null!;

    public string? Moneda { get; set; }

    public DateOnly FechaFactura { get; set; }

    public decimal ValorTotal { get; set; }

    public decimal Iva { get; set; }

    public decimal ReteFuente { get; set; }

    public decimal ReteIva { get; set; }

    public decimal ReteIca { get; set; }

    public decimal? ValorPago { get; set; }

    public DateOnly? FechaPago { get; set; }

    public string? BancoReceptor { get; set; }

    public string? CuentaBancaria { get; set; }

    public int? CodigoSpiga { get; set; }

    public string Estado { get; set; } = null!;

    public string? Descripcion { get; set; }

    public virtual EmpresasMaster IdEmpresaNavigation { get; set; } = null!;

    public virtual Proveedores_Master NitNavigation { get; set; } = null!;
}
