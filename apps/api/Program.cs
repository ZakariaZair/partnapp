using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseCors();

app.MapGet("/", () => Results.Ok(new
{
    name = "PartNApp API",
    status = "running"
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    checkedAt = DateTimeOffset.UtcNow
}));

app.MapGet("/health/db", async (IConfiguration configuration, CancellationToken cancellationToken) =>
{
    var connectionString = configuration.GetConnectionString("Supabase");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            title: "Missing Supabase connection string",
            detail: "Set ConnectionStrings__Supabase before using the database health check.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync(cancellationToken);

    await using var command = new NpgsqlCommand("select 1", connection);
    var result = await command.ExecuteScalarAsync(cancellationToken);

    return Results.Ok(new
    {
        status = result is 1 ? "ok" : "unexpected",
        checkedAt = DateTimeOffset.UtcNow
    });
});

app.Run();
