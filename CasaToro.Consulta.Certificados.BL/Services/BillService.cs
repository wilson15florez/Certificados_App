using System.Data.Entity;
using CasaToro.Consulta.Certificados.DAL;
using CasaToro.Consulta.Certificados.Entities;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    /// <summary>
    /// Servicio para la consulta de facturas asociadas a un proveedor.
    /// </summary>
    public class BillService
    {
        private readonly ApplicationDbContext _context;

        /// <summary>
        /// Constructor. Recibe el contexto de base de datos por inyección de dependencias.
        /// </summary>
        public BillService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Obtiene todas las facturas de un proveedor, incluyendo la empresa emisora
        /// y los datos del proveedor relacionado.
        /// Los campos opcionales se normalizan con valores por defecto para evitar nulos en la vista
        /// (ValorPago → 0, FechaPago → DateOnly.MinValue, BancoReceptor/CuentaBancaria → "-", etc.).
        /// </summary>
        /// <param name="nit">NIT del proveedor.</param>
        /// <returns>Lista de <see cref="FacturasProveedore"/> con todas las facturas del proveedor.</returns>
        public List<FacturasProveedore> GetBillsForProvider(string nit)
        {
            return _context.FacturasProveedores.Where(b => b.Nit == nit).Include(b => b.IdEmpresaNavigation)
                 .Include(b => b.NitNavigation).Select(b => new FacturasProveedore
                 {
                     NumeroFactura = b.NumeroFactura,
                     IdEmpresa = b.IdEmpresa,
                     Nit = b.Nit,
                     Moneda = b.Moneda,
                     FechaFactura = b.FechaFactura,
                     ValorTotal = b.ValorTotal,
                     Iva = b.Iva,
                     ReteFuente = b.ReteFuente,
                     ReteIva = b.ReteIva,
                     ReteIca = b.ReteIca,
                     ValorPago = b.ValorPago ?? 0.0m,
                     FechaPago = b.FechaPago ?? DateOnly.MinValue,
                     BancoReceptor = b.BancoReceptor ?? "-",
                     CuentaBancaria = b.CuentaBancaria ?? "-",
                     CodigoSpiga = b.CodigoSpiga ?? 0,
                     Estado = b.Estado,
                     IdEmpresaNavigation = b.IdEmpresaNavigation,
                     NitNavigation = b.NitNavigation,
                     Descripcion = b.Descripcion ?? "-"
                 }).ToList();
        }
    }
}
