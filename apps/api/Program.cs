using System.Data;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray() ?? [];

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
    var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
    if (connectionResult.Error is not null)
    {
        return connectionResult.Error;
    }

    await using var connection = connectionResult.Connection!;
    await using var command = new NpgsqlCommand("select 1", connection);
    var result = await command.ExecuteScalarAsync(cancellationToken);

    return Results.Ok(new
    {
        status = result is 1 ? "ok" : "unexpected",
        checkedAt = DateTimeOffset.UtcNow
    });
});

var api = app.MapGroup("/api");

api.MapGet("/profiles/{id:guid}", Profiles.GetByIdAsync);
api.MapPut("/profiles/{id:guid}", Profiles.UpsertAsync);

api.MapGet("/offers", Offers.ListAsync);
api.MapGet("/offers/{id:guid}", Offers.GetByIdAsync);
api.MapPost("/offers", Offers.CreateAsync);
api.MapPut("/offers/{id:guid}", Offers.UpdateAsync);
api.MapDelete("/offers/{id:guid}", Offers.DeleteAsync);

api.MapGet("/offers/{offerId:guid}/interests", Interests.ListForOfferAsync);
api.MapGet("/profiles/{profileId:guid}/interests", Interests.ListForProfileAsync);
api.MapPost("/offers/{offerId:guid}/interests", Interests.CreateAsync);
api.MapDelete("/interests/{id:guid}", Interests.DeleteAsync);

app.MapGet("/partnership-offers", LegacyMobileOffers.ListAsync);
app.MapPost("/partnership-offers", LegacyMobileOffers.CreateAsync);
app.MapPost("/partnership-offers/{offerId}/interests", LegacyMobileOffers.CreateInterestAsync);

app.Run();

internal static class Database
{
    public static async Task<ConnectionResult> OpenConnectionAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("Supabase");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return new ConnectionResult(null, Results.Problem(
                title: "Missing Supabase connection string",
                detail: "Set ConnectionStrings__Supabase before using database endpoints.",
                statusCode: StatusCodes.Status503ServiceUnavailable));
        }

        try
        {
            var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            return new ConnectionResult(connection, null);
        }
        catch (Exception exception) when (exception is NpgsqlException or TimeoutException or InvalidOperationException)
        {
            return new ConnectionResult(null, Results.Problem(
                title: "Database unavailable",
                detail: "The API could not connect to Supabase/PostgreSQL.",
                statusCode: StatusCodes.Status503ServiceUnavailable));
        }
    }
}

internal sealed record ConnectionResult(NpgsqlConnection? Connection, IResult? Error);

internal static class Profiles
{
    public static async Task<IResult> GetByIdAsync(
        Guid id,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            select id, display_name, headline, created_at, updated_at
            from public.profiles
            where id = @id
            """,
            connection);
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return HttpErrors.NotFound("Profile not found.");
        }

        return Results.Ok(ReadProfile(reader));
    }

    public static async Task<IResult> UpsertAsync(
        Guid id,
        UpsertProfileRequest request,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var errors = Validation.ValidateProfile(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            insert into public.profiles (id, display_name, headline)
            values (@id, @display_name, @headline)
            on conflict (id)
            do update set
              display_name = excluded.display_name,
              headline = excluded.headline,
              updated_at = now()
            returning id, display_name, headline, created_at, updated_at
            """,
            connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("display_name", request.DisplayName!.Trim());
        command.Parameters.AddWithValue("headline", DbValue.TextOrNull(request.Headline));

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        return Results.Ok(ReadProfile(reader));
    }

    internal static ProfileResponse ReadProfile(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetString(1),
        reader.IsDBNull(2) ? null : reader.GetString(2),
        reader.GetFieldValue<DateTimeOffset>(3),
        reader.GetFieldValue<DateTimeOffset>(4));
}

internal static class Offers
{
    public static async Task<IResult> ListAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken,
        string? stage = null,
        Guid? ownerId = null)
    {
        var errors = Validation.ValidateOfferFilters(stage);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            select id, owner_id, title, description, stage::text, skills_needed, commitment, location_mode, created_at, updated_at
            from public.partnership_offers
            where (@stage is null or stage = @stage::project_stage)
              and (@owner_id is null or owner_id = @owner_id)
            order by created_at desc
            limit 100
            """,
            connection);
        command.Parameters.AddWithValue("stage", DbValue.TextOrNull(stage));
        command.Parameters.AddWithValue("owner_id", DbValue.GuidOrNull(ownerId));

        var offers = new List<OfferResponse>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            offers.Add(ReadOffer(reader));
        }

        return Results.Ok(offers);
    }

    public static async Task<IResult> GetByIdAsync(
        Guid id,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            select id, owner_id, title, description, stage::text, skills_needed, commitment, location_mode, created_at, updated_at
            from public.partnership_offers
            where id = @id
            """,
            connection);
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return HttpErrors.NotFound("Offer not found.");
        }

        return Results.Ok(ReadOffer(reader));
    }

    public static async Task<IResult> CreateAsync(
        CreateOfferRequest request,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var errors = Validation.ValidateOffer(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            insert into public.partnership_offers
              (owner_id, title, description, stage, skills_needed, commitment, location_mode)
            values
              (@owner_id, @title, @description, @stage::project_stage, @skills_needed, @commitment, @location_mode)
            returning id, owner_id, title, description, stage::text, skills_needed, commitment, location_mode, created_at, updated_at
            """,
            connection);
        AddOfferParameters(command, request);

        try
        {
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            var offer = ReadOffer(reader);

            return Results.Created($"/api/offers/{offer.Id}", offer);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["ownerId"] = ["Profile does not exist."]
            });
        }
    }

    public static async Task<IResult> UpdateAsync(
        Guid id,
        CreateOfferRequest request,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var errors = Validation.ValidateOffer(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            update public.partnership_offers
            set owner_id = @owner_id,
                title = @title,
                description = @description,
                stage = @stage::project_stage,
                skills_needed = @skills_needed,
                commitment = @commitment,
                location_mode = @location_mode,
                updated_at = now()
            where id = @id
            returning id, owner_id, title, description, stage::text, skills_needed, commitment, location_mode, created_at, updated_at
            """,
            connection);
        command.Parameters.AddWithValue("id", id);
        AddOfferParameters(command, request);

        try
        {
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return HttpErrors.NotFound("Offer not found.");
            }

            return Results.Ok(ReadOffer(reader));
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["ownerId"] = ["Profile does not exist."]
            });
        }
    }

    public static async Task<IResult> DeleteAsync(
        Guid id,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            "delete from public.partnership_offers where id = @id",
            connection);
        command.Parameters.AddWithValue("id", id);

        var deleted = await command.ExecuteNonQueryAsync(cancellationToken);
        return deleted == 0 ? HttpErrors.NotFound("Offer not found.") : Results.NoContent();
    }

    private static void AddOfferParameters(NpgsqlCommand command, CreateOfferRequest request)
    {
        command.Parameters.AddWithValue("owner_id", request.OwnerId);
        command.Parameters.AddWithValue("title", request.Title!.Trim());
        command.Parameters.AddWithValue("description", request.Description!.Trim());
        command.Parameters.AddWithValue("stage", request.Stage!.Trim());
        command.Parameters.AddWithValue("skills_needed", request.SkillsNeeded!.Select(skill => skill.Trim()).Where(skill => skill.Length > 0).Distinct().ToArray());
        command.Parameters.AddWithValue("commitment", DbValue.TextOrNull(request.Commitment));
        command.Parameters.AddWithValue("location_mode", request.LocationMode!.Trim());
    }

    internal static OfferResponse ReadOffer(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.GetString(4),
        reader.GetFieldValue<string[]>(5),
        reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.GetString(7),
        reader.GetFieldValue<DateTimeOffset>(8),
        reader.GetFieldValue<DateTimeOffset>(9));
}

internal static class Interests
{
    public static async Task<IResult> ListForOfferAsync(
        Guid offerId,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        return await ListAsync(
            configuration,
            cancellationToken,
            "where i.offer_id = @id",
            command => command.Parameters.AddWithValue("id", offerId));
    }

    public static async Task<IResult> ListForProfileAsync(
        Guid profileId,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        return await ListAsync(
            configuration,
            cancellationToken,
            "where i.profile_id = @id",
            command => command.Parameters.AddWithValue("id", profileId));
    }

    public static async Task<IResult> CreateAsync(
        Guid offerId,
        CreateInterestRequest request,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var errors = Validation.ValidateInterest(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            insert into public.partnership_interests (offer_id, profile_id, message)
            values (@offer_id, @profile_id, @message)
            on conflict (offer_id, profile_id)
            do update set message = excluded.message
            returning id, offer_id, profile_id, message, created_at
            """,
            connection);
        command.Parameters.AddWithValue("offer_id", offerId);
        command.Parameters.AddWithValue("profile_id", request.ProfileId);
        command.Parameters.AddWithValue("message", DbValue.TextOrNull(request.Message));

        try
        {
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            var interest = ReadInterest(reader);

            return Results.Created($"/api/interests/{interest.Id}", interest);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["offerId"] = ["Offer does not exist."],
                ["profileId"] = ["Profile does not exist."]
            });
        }
    }

    public static async Task<IResult> DeleteAsync(
        Guid id,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            "delete from public.partnership_interests where id = @id",
            connection);
        command.Parameters.AddWithValue("id", id);

        var deleted = await command.ExecuteNonQueryAsync(cancellationToken);
        return deleted == 0 ? HttpErrors.NotFound("Interest not found.") : Results.NoContent();
    }

    private static async Task<IResult> ListAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken,
        string whereClause,
        Action<NpgsqlCommand> addParameters)
    {
        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            $"""
            select i.id, i.offer_id, i.profile_id, i.message, i.created_at
            from public.partnership_interests i
            {whereClause}
            order by i.created_at desc
            limit 100
            """,
            connection);
        addParameters(command);

        var interests = new List<InterestResponse>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            interests.Add(ReadInterest(reader));
        }

        return Results.Ok(interests);
    }

    internal static InterestResponse ReadInterest(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetGuid(2),
        reader.IsDBNull(3) ? null : reader.GetString(3),
        reader.GetFieldValue<DateTimeOffset>(4));
}

internal static class LegacyMobileOffers
{
    private static readonly Guid MobileFallbackProfileId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static async Task<IResult> ListAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await using var command = new NpgsqlCommand(
            """
            select offers.id,
                   offers.title,
                   offers.description,
                   offers.stage::text,
                   offers.skills_needed,
                   profiles.display_name,
                   offers.location_mode
            from public.partnership_offers offers
            join public.profiles profiles on profiles.id = offers.owner_id
            order by offers.created_at desc
            limit 100
            """,
            connection);

        var offers = new List<LegacyMobileOfferResponse>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            offers.Add(new LegacyMobileOfferResponse(
                reader.GetGuid(0).ToString(),
                reader.GetString(1),
                reader.GetString(2),
                ToMobileStage(reader.GetString(3)),
                reader.GetFieldValue<string[]>(4),
                reader.GetString(5),
                reader.GetString(6)));
        }

        return Results.Ok(offers);
    }

    public static async Task<IResult> CreateAsync(
        LegacyMobileCreateOfferRequest request,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var errors = ValidateLegacyOffer(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await EnsureMobileFallbackProfileAsync(connection, request.OwnerName, cancellationToken);

        await using var command = new NpgsqlCommand(
            """
            insert into public.partnership_offers
              (owner_id, title, description, stage, skills_needed, location_mode)
            values
              (@owner_id, @title, @description, @stage::project_stage, @skills_needed, @location_mode)
            returning id, title, description, stage::text, skills_needed, location_mode
            """,
            connection);
        command.Parameters.AddWithValue("owner_id", MobileFallbackProfileId);
        command.Parameters.AddWithValue("title", request.Title!.Trim());
        command.Parameters.AddWithValue("description", request.Summary!.Trim());
        command.Parameters.AddWithValue("stage", ToApiStage(request.ProjectStage));
        command.Parameters.AddWithValue("skills_needed", request.SkillsNeeded ?? []);
        command.Parameters.AddWithValue(
            "location_mode",
            string.IsNullOrWhiteSpace(request.Location) ? "remote" : request.Location.Trim());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        var offer = new LegacyMobileOfferResponse(
            reader.GetGuid(0).ToString(),
            reader.GetString(1),
            reader.GetString(2),
            ToMobileStage(reader.GetString(3)),
            reader.GetFieldValue<string[]>(4),
            string.IsNullOrWhiteSpace(request.OwnerName) ? "Utilisateur mobile" : request.OwnerName.Trim(),
            reader.GetString(5));

        return Results.Created($"/partnership-offers/{offer.Id}", offer);
    }

    public static async Task<IResult> CreateInterestAsync(
        string offerId,
        LegacyMobileCreateInterestRequest request,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(offerId, out var parsedOfferId))
        {
            return Results.Ok(new
            {
                status = "accepted",
                detail = "Interest accepted for a client-local offer id. No database row was created."
            });
        }

        var connectionResult = await Database.OpenConnectionAsync(configuration, cancellationToken);
        if (connectionResult.Error is not null)
        {
            return connectionResult.Error;
        }

        await using var connection = connectionResult.Connection!;
        await EnsureMobileFallbackProfileAsync(connection, request.ProfileName, cancellationToken);

        await using var command = new NpgsqlCommand(
            """
            insert into public.partnership_interests (offer_id, profile_id, message)
            values (@offer_id, @profile_id, @message)
            on conflict (offer_id, profile_id)
            do update set message = excluded.message
            returning id, offer_id, profile_id, message, created_at
            """,
            connection);
        command.Parameters.AddWithValue("offer_id", parsedOfferId);
        command.Parameters.AddWithValue("profile_id", MobileFallbackProfileId);
        command.Parameters.AddWithValue("message", DbValue.TextOrNull(request.Message));

        try
        {
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            return Results.Created($"/api/interests/{reader.GetGuid(0)}", Interests.ReadInterest(reader));
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return HttpErrors.NotFound("Offer not found.");
        }
    }

    private static async Task EnsureMobileFallbackProfileAsync(
        NpgsqlConnection connection,
        string? displayName,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            insert into public.profiles (id, display_name, headline)
            values (@id, @display_name, @headline)
            on conflict (id)
            do update set display_name = excluded.display_name,
                          headline = excluded.headline,
                          updated_at = now()
            """,
            connection);
        command.Parameters.AddWithValue("id", MobileFallbackProfileId);
        command.Parameters.AddWithValue(
            "display_name",
            string.IsNullOrWhiteSpace(displayName) ? "Utilisateur mobile" : displayName.Trim());
        command.Parameters.AddWithValue("headline", "Profil mobile de développement");

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Dictionary<string, string[]> ValidateLegacyOffer(LegacyMobileCreateOfferRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors["title"] = ["Value is required."];
        }

        if (string.IsNullOrWhiteSpace(request.Summary))
        {
            errors["summary"] = ["Value is required."];
        }

        return errors;
    }

    private static string ToApiStage(string? mobileStage)
    {
        var normalized = mobileStage?.Trim().ToLowerInvariant() ?? string.Empty;

        if (normalized.Contains("mvp") || normalized.Contains("build") || normalized.Contains("construction"))
        {
            return "building";
        }

        if (normalized.Contains("valid") || normalized.Contains("prototype") || normalized.Contains("discovery"))
        {
            return "validation";
        }

        if (normalized.Contains("lanc") || normalized.Contains("launch"))
        {
            return "launched";
        }

        return "idea";
    }

    private static string ToMobileStage(string apiStage) => apiStage switch
    {
        "validation" => "Validation marché",
        "building" => "MVP",
        "launched" => "Lancé",
        _ => "Idée"
    };
}

internal static class Validation
{
    private static readonly HashSet<string> ProjectStages = ["idea", "validation", "building", "launched"];
    private static readonly HashSet<string> LocationModes = ["remote", "hybrid", "onsite"];

    public static Dictionary<string, string[]> ValidateProfile(UpsertProfileRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        RequiredText(errors, "displayName", request.DisplayName, 2, 80);
        OptionalText(errors, "headline", request.Headline, 160);
        return errors;
    }

    public static Dictionary<string, string[]> ValidateOffer(CreateOfferRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        RequiredGuid(errors, "ownerId", request.OwnerId);
        RequiredText(errors, "title", request.Title, 3, 120);
        RequiredText(errors, "description", request.Description, 20, 4_000);
        RequiredChoice(errors, "stage", request.Stage, ProjectStages);
        RequiredChoice(errors, "locationMode", request.LocationMode, LocationModes);
        OptionalText(errors, "commitment", request.Commitment, 160);

        if (request.SkillsNeeded is null)
        {
            errors["skillsNeeded"] = ["Value is required."];
        }
        else if (request.SkillsNeeded.Length > 20)
        {
            errors["skillsNeeded"] = ["At most 20 skills are allowed."];
        }
        else if (request.SkillsNeeded.Any(skill => string.IsNullOrWhiteSpace(skill) || skill.Trim().Length > 60))
        {
            errors["skillsNeeded"] = ["Each skill must be non-empty and at most 60 characters."];
        }

        return errors;
    }

    public static Dictionary<string, string[]> ValidateOfferFilters(string? stage)
    {
        var errors = new Dictionary<string, string[]>();
        if (!string.IsNullOrWhiteSpace(stage) && !ProjectStages.Contains(stage.Trim()))
        {
            errors["stage"] = [$"Stage must be one of: {string.Join(", ", ProjectStages)}."];
        }

        return errors;
    }

    public static Dictionary<string, string[]> ValidateInterest(CreateInterestRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        RequiredGuid(errors, "profileId", request.ProfileId);
        OptionalText(errors, "message", request.Message, 1_000);
        return errors;
    }

    private static void RequiredGuid(Dictionary<string, string[]> errors, string field, Guid value)
    {
        if (value == Guid.Empty)
        {
            errors[field] = ["Value must be a non-empty UUID."];
        }
    }

    private static void RequiredText(Dictionary<string, string[]> errors, string field, string? value, int minLength, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors[field] = ["Value is required."];
            return;
        }

        var length = value.Trim().Length;
        if (length < minLength || length > maxLength)
        {
            errors[field] = [$"Value must be between {minLength} and {maxLength} characters."];
        }
    }

    private static void OptionalText(Dictionary<string, string[]> errors, string field, string? value, int maxLength)
    {
        if (value is not null && value.Trim().Length > maxLength)
        {
            errors[field] = [$"Value must be at most {maxLength} characters."];
        }
    }

    private static void RequiredChoice(Dictionary<string, string[]> errors, string field, string? value, HashSet<string> choices)
    {
        if (string.IsNullOrWhiteSpace(value) || !choices.Contains(value.Trim()))
        {
            errors[field] = [$"Value must be one of: {string.Join(", ", choices)}."];
        }
    }
}

internal static class DbValue
{
    public static object TextOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();

    public static object GuidOrNull(Guid? value) =>
        value.HasValue ? value.Value : DBNull.Value;
}

internal static class HttpErrors
{
    public static IResult NotFound(string detail) => Results.Problem(
        title: "Not found",
        detail: detail,
        statusCode: StatusCodes.Status404NotFound);
}

public sealed record UpsertProfileRequest(
    string? DisplayName,
    string? Headline);

public sealed record ProfileResponse(
    Guid Id,
    string DisplayName,
    string? Headline,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateOfferRequest(
    Guid OwnerId,
    string? Title,
    string? Description,
    string? Stage,
    string[]? SkillsNeeded,
    string? Commitment,
    string? LocationMode);

public sealed record OfferResponse(
    Guid Id,
    Guid OwnerId,
    string Title,
    string Description,
    string Stage,
    string[] SkillsNeeded,
    string? Commitment,
    string LocationMode,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateInterestRequest(
    Guid ProfileId,
    string? Message);

public sealed record InterestResponse(
    Guid Id,
    Guid OfferId,
    Guid ProfileId,
    string? Message,
    DateTimeOffset CreatedAt);

public sealed record LegacyMobileCreateOfferRequest(
    string? Id,
    string? Title,
    string? Summary,
    string? ProjectStage,
    string[]? SkillsNeeded,
    string? OwnerName,
    string? Location);

public sealed record LegacyMobileOfferResponse(
    string Id,
    string Title,
    string Summary,
    string ProjectStage,
    string[] SkillsNeeded,
    string OwnerName,
    string Location);

public sealed record LegacyMobileCreateInterestRequest(
    string? ProfileName,
    string? Message);
