using CasaToro.Consulta.Certificados.DAL;
using CasaToro.Consulta.Certificados.Entities;


namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class AdminService
    {
        private readonly ApplicationDbContext _context;

        public AdminService(ApplicationDbContext context)
        {
            _context = context;
        }

        public Administradore getAdminById(string id)
        {
            return _context.Administradores.Find(id);
        }

        // Método que obtiene la lista de proveedores paginada
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

        // Método que obtiene la cantidad de proveedores
        public int getProvidersCount(string? search = null)
        {
            return _context.Proveedores_Master
                                     .Where(p => string.IsNullOrEmpty(search) ||
                                                 p.Nit.ToLower().Contains(search.ToLower()) ||
                                                 p.Nombre.ToLower().Contains(search.ToLower()))
                                     .Count();
        }

        //metodo para agregar nuevo proveedor en la tabla master
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

        //metodo para restaurar contraseña de proveedor
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
