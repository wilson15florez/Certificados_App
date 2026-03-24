using CasaToro.Consulta.Certificados.Entities;
using CasaToro.Consulta.Certificados.DAL;
namespace CasaToro.Consulta.Certificados.BL.Services
{
    /// <summary>
    /// Servicio para registrar eventos de auditoría en las tablas de log.
    /// Persiste registros de descargas y de inicio de sesión (proveedores y administradores).
    /// </summary>
    public class LogService
    {
        private readonly ApplicationDbContext _context;

        /// <summary>
        /// Constructor. Recibe el contexto de base de datos por inyección de dependencias.
        /// </summary>
        public LogService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Registra una descarga de documento en la tabla LogDescargas.
        /// </summary>
        /// <param name="log">Objeto con los datos del evento de descarga.</param>
        public void addLogDownload(LogDescarga log)
        {
            _context.LogDescargas.Add(log);
            _context.SaveChanges();
        }

        /// <summary>
        /// Registra un inicio de sesión de proveedor en la tabla LogLogins.
        /// </summary>
        /// <param name="log">Objeto con NIT, nombre y fecha del inicio de sesión.</param>
        public void addLogLogin(LogLogin log)
        {
            _context.LogLogins.Add(log);
            _context.SaveChanges();
        }

        /// <summary>
        /// Registra un inicio de sesión de administrador en la tabla LogLoginAdmins.
        /// </summary>
        /// <param name="log">Objeto con ID de admin, nombre y fecha del inicio de sesión.</param>
        public void addLogLoginAdmin(LogLoginAdmin log)
        {
            _context.LogLoginAdmins.Add(log);
            _context.SaveChanges();
        }
    }
}
