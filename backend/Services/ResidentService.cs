
using System.Text;
using Microsoft.EntityFrameworkCore;
using GridEventManagement.Web.Data;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Services;

public class ResidentService : IResidentService
{
    private readonly ApplicationDbContext _context;

    public ResidentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<ResidentDto>> GetPagedResidentsAsync(ResidentQueryDto query)
    {
        var queryable = _context.Residents
            .Include(r => r.Grid)
            .AsQueryable();

        if (query.GridId.HasValue)
            queryable = queryable.Where(r => r.GridId == query.GridId.Value);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
            queryable = queryable.Where(r => r.Name.Contains(query.Keyword) || r.IdCard.Contains(query.Keyword) || (r.Phone != null && r.Phone.Contains(query.Keyword)));

        if (!string.IsNullOrWhiteSpace(query.HouseholdType))
            queryable = queryable.Where(r => r.HouseholdType == query.HouseholdType);

        if (!string.IsNullOrWhiteSpace(query.Tag))
            queryable = queryable.Where(r => r.Tags != null && r.Tags.Contains(query.Tag));

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderBy(r => r.Name)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(r => MapToResidentDto(r))
            .ToListAsync();

        return new PagedResultDto<ResidentDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<ResidentDto?> GetResidentByIdAsync(int id)
    {
        var resident = await _context.Residents
            .Include(r => r.Grid)
            .FirstOrDefaultAsync(r => r.Id == id);
        return resident == null ? null : MapToResidentDto(resident);
    }

    public async Task<ResidentDto> CreateResidentAsync(CreateResidentDto request)
    {
        var resident = new Resident
        {
            Name = request.Name,
            IdCard = request.IdCard,
            Phone = request.Phone,
            Address = request.Address,
            GridId = request.GridId,
            HouseholdType = request.HouseholdType,
            Tags = request.Tags,
            Remark = request.Remark
        };

        _context.Residents.Add(resident);
        await _context.SaveChangesAsync();
        return MapToResidentDto(await _context.Residents.Include(r => r.Grid).FirstAsync(r => r.Id == resident.Id));
    }

    public async Task<ResidentDto?> UpdateResidentAsync(int id, UpdateResidentDto request)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return null;

        resident.Name = request.Name;
        resident.IdCard = request.IdCard;
        resident.Phone = request.Phone;
        resident.Address = request.Address;
        resident.GridId = request.GridId;
        resident.HouseholdType = request.HouseholdType;
        resident.Tags = request.Tags;
        resident.Remark = request.Remark;

        await _context.SaveChangesAsync();
        return MapToResidentDto(await _context.Residents.Include(r => r.Grid).FirstAsync(r => r.Id == id));
    }

    public async Task<bool> DeleteResidentAsync(int id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return false;

        _context.Residents.Remove(resident);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<byte[]> ExportResidentsToCsvAsync(ResidentQueryDto query)
    {
        query.PageIndex = 1;
        query.PageSize = int.MaxValue;
        var result = await GetPagedResidentsAsync(query);

        var sb = new StringBuilder();
        sb.AppendLine("Id,姓名,身份证号,电话,地址,网格Id,网格名称,户籍类型,标签,备注");

        foreach (var r in result.Items)
        {
            sb.AppendLine($"{r.Id},{EscapeCsv(r.Name)},{EscapeCsv(r.IdCard)},{EscapeCsv(r.Phone)},{EscapeCsv(r.Address)},{r.GridId},{EscapeCsv(r.GridName)},{EscapeCsv(r.HouseholdType)},{EscapeCsv(r.Tags)},{EscapeCsv(r.Remark)}");
        }

        var preamble = Encoding.UTF8.GetPreamble();
        var content = Encoding.UTF8.GetBytes(sb.ToString());
        var output = new byte[preamble.Length + content.Length];
        Buffer.BlockCopy(preamble, 0, output, 0, preamble.Length);
        Buffer.BlockCopy(content, 0, output, preamble.Length, content.Length);
        return output;
    }

    public async Task<int> ImportResidentsFromCsvAsync(Stream csvStream, int? gridId = null)
    {
        var residents = new List<Resident>();
        using var reader = new StreamReader(csvStream, Encoding.UTF8);

        string? headerLine = await reader.ReadLineAsync();
        if (headerLine == null) return 0;

        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var fields = ParseCsvLine(line);
            if (fields.Length < 7) continue;

            var name = fields[0].Trim();
            var idCard = fields[1].Trim();
            var phone = fields[2].Trim();
            var address = fields[3].Trim();
            var householdType = fields[4].Trim();
            var tags = fields[5].Trim();
            var remark = fields[6].Trim();

            if (string.IsNullOrWhiteSpace(idCard)) continue;

            var resident = new Resident
            {
                Name = name,
                IdCard = idCard,
                Phone = string.IsNullOrWhiteSpace(phone) ? null : phone,
                Address = string.IsNullOrWhiteSpace(address) ? null : address,
                GridId = gridId,
                HouseholdType = string.IsNullOrWhiteSpace(householdType) ? null : householdType,
                Tags = string.IsNullOrWhiteSpace(tags) ? null : tags,
                Remark = string.IsNullOrWhiteSpace(remark) ? null : remark
            };

            residents.Add(resident);
        }

        if (residents.Count > 0)
        {
            _context.Residents.AddRange(residents);
            await _context.SaveChangesAsync();
        }

        return residents.Count;
    }

    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new System.Text.StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());
        return result.ToArray();
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private static ResidentDto MapToResidentDto(Resident resident)
    {
        return new ResidentDto
        {
            Id = resident.Id,
            Name = resident.Name,
            IdCard = resident.IdCard,
            Phone = resident.Phone,
            Address = resident.Address,
            GridId = resident.GridId,
            GridName = resident.Grid?.Name,
            HouseholdType = resident.HouseholdType,
            Tags = resident.Tags,
            Remark = resident.Remark
        };
    }
}
