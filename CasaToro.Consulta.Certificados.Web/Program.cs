using CasaToro.Consulta.Certificados.BL.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using CasaToro.Consulta.Certificados.DAL;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ProveedoresConnection")));

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login/Index";
        options.AccessDeniedPath = "/Provider/Certificates";
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

builder.Services.AddAuthorization();
builder.Services.AddControllersWithViews();


builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<ProviderService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<LogService>();
builder.Services.AddScoped<CertificatesService>();
builder.Services.AddScoped<CertificateServiceExcel>();
builder.Services.AddScoped<BillService>();
builder.Services.AddScoped<FormatService>();
builder.Services.AddScoped<UsersService>();

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Shared/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}");

app.Run();
