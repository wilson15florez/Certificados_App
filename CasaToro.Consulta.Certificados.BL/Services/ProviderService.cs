using CasaToro.Consulta.Certificados.Entities;
using Microsoft.EntityFrameworkCore;
using CasaToro.Consulta.Certificados.DAL;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class ProviderService
    {
        private readonly ApplicationDbContext _context;
        // Constructor de la clase que recibe una instancia de ApplicationDbContext (db)
        public ProviderService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Método que obtiene la lista de proveedores paginada
        public List<ProveedoresMaster> getProviders(int pageNumber, int pageSize, string? search = null)
        {
            try
            {
                var query = _context.ProveedoresMasters.AsQueryable(); // Obtiene la consulta sin ejecutarla aún

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
            return _context.ProveedoresMasters
                                     .Where(p => string.IsNullOrEmpty(search) ||
                                                 p.Nit.ToLower().Contains(search.ToLower()) ||
                                                 p.Nombre.ToLower().Contains(search.ToLower()))
                                     .Count();
        }

        // Método que obtiene un proveedor por su NIT
        public ProveedoresMaster getPoviderByNit(string nit)
        {
            return _context.ProveedoresMasters.FirstOrDefault(p => p.Nit != null && p.Nit.Equals(nit));
        }
        // Método que obtiene las empresas asociadas a un proveedor
        public List<EmpresasMaster> GetCompaniesForProvider(string nit)

        {
            return _context.EmpresasProveedores
                           .Include(c => c.IdEmpresaNavigation)
                           .Where(ep => ep.Nit == nit)
                           .Select(ep => ep.IdEmpresaNavigation)
                           .ToList();
        }

        //Metodo para actualizar la información de un proveedor
        public void UpdateProvider(ProveedoresMaster provider)
        {
            try
            {
                var existingProvider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == provider.Nit);
                if (existingProvider != null)
                {
                    // Actualizar la entidad existente
                    _context.Entry(existingProvider).CurrentValues.SetValues(provider);
                    _context.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error al actualizar el proveedor", ex);
            }
        }

        public void UpdateNaturalInfo(Proveedores_Natural providerData)
        {
            try
            {
                var existingProvider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == providerData.Nit);
                if (existingProvider != null)
                {
                    // Actualizar los campos específicos para persona natural
                    existingProvider.Nombre = providerData.pnNombreCompl.ToUpper();
                    existingProvider.Direccion = providerData.pnDiResidencia;
                    existingProvider.Correo = providerData.pnEmail;
                    existingProvider.Telefono = providerData.pnTelefono;
                    _context.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error al actualizar la información de la persona natural", ex);
            }
        }

        public void UpdateJuridicaInfo(Proveedores_Juridica providerData)
        {
            string providerNit = providerData.Nit;

            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    var existingJuridica = _context.Proveedores_Juridica.FirstOrDefault(p => p.Nit == providerNit);

                    if (existingJuridica != null)
                    {
                        existingJuridica.pjRazSocial = providerData.pjRazSocial;
                        existingJuridica.pjDirPrincipal = providerData.pjDirPrincipal;
                        existingJuridica.pjCiudadDirPrincipal = providerData.pjCiudadDirPrincipal;
                        existingJuridica.pjEmailDirPrincipal = providerData.pjEmailDirPrincipal;
                        existingJuridica.pjTelDirPrincipal = providerData.pjTelDirPrincipal;
                        _context.Proveedores_Juridica.Update(existingJuridica);
                    }
                    else
                    {
                        throw new Exception($"Registro detallado para NIT {providerNit} no encontrado.");
                    }
                    _context.SaveChanges();

                    var oldSucursales = _context.Sucursales_PJuridica.Where(s => s.NitProveedor == providerNit);
                    _context.Sucursales_PJuridica.RemoveRange(oldSucursales);

                    foreach (var sucursal in providerData.Sucursales_PJuridica)
                    {
                        var newSucursal = new Sucursales_PJuridica
                        {
                            NitProveedor = providerNit,
                            Direccion = sucursal.Direccion,
                            Ciudad = sucursal.Ciudad,
                            Email = sucursal.Email,
                            Telefono = sucursal.Telefono
                        };
                        _context.Sucursales_PJuridica.Add(newSucursal);
                    }

                    var oldAccionistas = _context.AccionistasControlPJuridica.Where(a => a.NitProveedor == providerNit);
                    _context.AccionistasControlPJuridica.RemoveRange(oldAccionistas);

                    foreach (var accionista in providerData.AccionistasControlPJuridica)
                    {
                        var newAccionista = new AccionistasControlPJuridica
                        {
                            NitProveedor = providerNit,
                            razonSocial = accionista.razonSocial,
                            idType = accionista.idType,
                            idNum = accionista.idNum,
                            porcentaje = accionista.porcentaje
                        };
                        _context.AccionistasControlPJuridica.Add(newAccionista);
                    }
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al actualizar la información de la persona jurídica", ex);
                }
            }
        }


        public void RestoreProviderPassword(string nit)
        {
            try
            {
                var provider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == nit);
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

        public void UpdatePassword(ProveedoresMaster provider)
        {
            try
            {
                var existingProvider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == provider.Nit);
                if (existingProvider != null)
                {
                    existingProvider.Contrasena = provider.Contrasena;
                    _context.SaveChanges();
                }

            }
            catch (Exception ex)
            {
                throw new Exception("Error al actualizar la contraseña del proveedor", ex);
            }
        }
    }
}
