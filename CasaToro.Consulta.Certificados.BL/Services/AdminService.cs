using CasaToro.Consulta.Certificados.DAL;
using CasaToro.Consulta.Certificados.Entities;


namespace CasaToro.Consulta.Certificados.BL.Services
{
    /// <summary>
    /// Servicio para operaciones administrativas sobre proveedores.
    /// Gestiona consultas paginadas, creación y mantenimiento de cuentas en Proveedores_Master.
    /// </summary>
    public class AdminService
    {
        private readonly ApplicationDbContext _context;

        /// <summary>
        /// Constructor. Recibe el contexto de base de datos por inyección de dependencias.
        /// </summary>
        public AdminService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Obtiene un administrador por su ID.
        /// </summary>
        /// <param name="id">Identificador del administrador.</param>
        /// <returns>Instancia de <see cref="Administradore"/> si existe, de lo contrario <c>null</c>.</returns>
        public Administradore getAdminById(string id)
        {
            return _context.Administradores.Find(id);
        }

        /// <summary>
        /// Obtiene la lista de proveedores con paginación y filtro de búsqueda opcional.
        /// El filtro busca coincidencias parciales en NIT y Nombre (case-insensitive).
        /// </summary>
        /// <param name="pageNumber">Número de página (base 1).</param>
        /// <param name="pageSize">Cantidad de registros por página.</param>
        /// <param name="search">Texto de búsqueda opcional. Si es nulo o vacío, retorna todos.</param>
        /// <returns>Lista de <see cref="Proveedores_Master"/> correspondiente a la página solicitada.</returns>
        /// <exception cref="Exception">Si ocurre un error al consultar la DB.</exception>
        public List<Proveedores_Master> getProviders(int pageNumber, int pageSize, string? search = null)
        {
            try
            {
                var query = _context.Proveedores_Master.AsQueryable(); // Obtiene la consulta sin ejecutarla aún

                // Aplicar filtro si hay búsqueda
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p => p.Nit.ToLower().Contains(search.ToLower()) ||
                                             p.Nombre.ToLower().Contains(search.ToLower()));
                }

                // Aplicar paginación
                var providers = query.Skip((pageNumber - 1) * pageSize)
                                     .Take(pageSize)
                                     .ToList();

                return providers;
            }
            catch (Exception ex)
            {
                throw new Exception("Error al obtener la lista de proveedores", ex);
            }
        }

        /// <summary>
        /// Obtiene el total de proveedores registrados, con filtro de búsqueda opcional.
        /// Se usa junto con <see cref="getProviders"/> para calcular el total de páginas.
        /// </summary>
        /// <param name="search">Texto de búsqueda opcional.</param>
        /// <returns>Cantidad total de proveedores que coinciden con el filtro.</returns>
        public int getProvidersCount(string? search = null)
        {
            return _context.Proveedores_Master
                                     .Where(p => string.IsNullOrEmpty(search) ||
                                                 p.Nit.ToLower().Contains(search.ToLower()) ||
                                                 p.Nombre.ToLower().Contains(search.ToLower()))
                                     .Count();
        }

        /// <summary>
        /// Agrega un nuevo proveedor a la tabla Proveedores_Master.
        /// NOTA: Al insertar, el trigger <c>TR_Proveedores_Master_SetVinculacion</c>
        /// asigna automáticamente <c>TipoTramite_Formato = 'VINCULACION'</c> en la DB.
        /// No es necesario asignarlo desde el código.
        /// </summary>
        /// <param name="proveedor">Objeto con los datos del nuevo proveedor.</param>
        /// <exception cref="Exception">Si ocurre un error al insertar.</exception>
        public void AddProveedorMaster(Proveedores_Master proveedor)
        {
            try
            {
                _context.Proveedores_Master.Add(proveedor);
                _context.SaveChanges();

            }
            catch (Exception ex)
            {
                throw new Exception("Error al agregar el proveedor", ex);
            }
        }

        /// <summary>
        /// Restaura la contraseña de un proveedor al valor de su propio NIT (contraseña por defecto).
        /// La contraseña se almacena sin hashear en este método — el hash debe aplicarse
        /// antes si se requiere consistencia con el flujo de login.
        /// </summary>
        /// <param name="nit">NIT del proveedor al que se le restaura la contraseña.</param>
        /// <exception cref="Exception">Si ocurre un error al actualizar.</exception>
        public void RestoreProviderPassword(string nit)
        {
            try
            {
                var provider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == nit);
                if (provider != null)
                {
                    provider.Contrasena = provider.Nit;
                    _context.SaveChanges();
                }

            }
            catch (Exception ex)
            {
                throw new Exception("Error al restaurar la contraseña del proveedor", ex);
            }
        }
    }
}
