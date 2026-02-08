# Companies CSV to Account Table Field Mapping

## CSV Fields Available

1. **DQ: Exceptions** - Data quality exceptions/notes
2. **QB Date Created** - Quickbase creation date
3. **QB Date Modified** - Quickbase modification date
4. **Record ID** - Hubspot Record ID (unique identifier)
5. **Create Date** - Original creation date
6. **Company name** - Company name
7. **Company Domain Name** - Company website domain
8. **Industry** - Industry classification
9. **Number of Associated Contacts** - Count of related contacts
10. **Number of Associated Deals** - Count of related deals
11. **Number of Deals Won** - Count of won deals
12. **PMS Company ID** - PMS system company ID
13. **PMS Company ID - Hubspot Company ID** - Duplicate of Record ID
14. **PMS Company ID - Name** - Duplicate of Company name

## Account Table Fields

- `id` - Auto-generated (cuid)
- `name` - **REQUIRED** - Company name
- `website` - Optional - Website URL
- `industry` - Optional - Industry
- `phone` - Optional - Phone number
- `email` - Optional - Email address
- `billingStreet` - Optional - Billing street address
- `billingCity` - Optional - Billing city
- `billingState` - Optional - Billing state
- `billingZip` - Optional - Billing ZIP code
- `billingCountry` - Optional - Billing country
- `description` - Optional - Description/notes
- `annualRevenue` - Optional - Annual revenue (Float)
- `employeeCount` - Optional - Employee count (Int)
- `hubspotRecordId` - Optional - Hubspot Record ID (unique)
- `ownerId` - Optional - Owner user ID
- `createdAt` - Auto-generated timestamp
- `updatedAt` - Auto-updated timestamp

## Current Mapping (Implemented)

| CSV Field | Account Field | Status | Notes |
|-----------|---------------|--------|-------|
| **Company name** | `name` | ✅ Mapped | Required field |
| **Company Domain Name** | `website` | ✅ Mapped | Auto-adds https:// if missing |
| **Industry** | `industry` | ✅ Mapped | Direct mapping |
| **Record ID** | `hubspotRecordId` | ✅ Mapped | Used for duplicate detection |

## Fields NOT Currently Mapped

### Available in CSV but not mapped:
- **Create Date** / **QB Date Created** → Could map to `createdAt` (currently auto-generated)
- **QB Date Modified** → Could map to `updatedAt` (currently auto-updated)
- **DQ: Exceptions** → Could map to `description` (data quality notes)

### Available in Account but not in CSV:
- `phone` - No phone field in CSV
- `email` - No email field in CSV
- `billingStreet` - No address fields in CSV
- `billingCity` - No address fields in CSV
- `billingState` - No address fields in CSV
- `billingZip` - No address fields in CSV
- `billingCountry` - No address fields in CSV
- `description` - Could use DQ: Exceptions
- `annualRevenue` - No revenue data in CSV
- `employeeCount` - No employee count in CSV
- `ownerId` - Not set (accounts will be unassigned)

### Calculated/Relationship Fields (Not Imported):
- **Number of Associated Contacts** - This is a count, not imported (relationships handled separately)
- **Number of Associated Deals** - This is a count, not imported (relationships handled separately)
- **Number of Deals Won** - This is a count, not imported

### Duplicate/Redundant Fields:
- **PMS Company ID** - External system ID, not needed
- **PMS Company ID - Hubspot Company ID** - Duplicate of Record ID
- **PMS Company ID - Name** - Duplicate of Company name

## Recommendations

### Option 1: Keep Current Mapping (Minimal)
- ✅ Simple and clean
- ✅ Only maps essential fields
- ✅ No date manipulation needed

### Option 2: Enhanced Mapping (Recommended)
Add these mappings:
- **Create Date** → `createdAt` (preserve original creation date)
- **QB Date Modified** → `updatedAt` (preserve last modification date)
- **DQ: Exceptions** → `description` (store data quality notes)

### Option 3: Full Mapping (If dates are important)
Same as Option 2, but also consider:
- Parse and convert date formats properly
- Handle timezone issues

## Current Implementation Summary

**Mapped Fields:** 4 out of 14 CSV fields
- Company name → name ✅
- Company Domain Name → website ✅
- Industry → industry ✅
- Record ID → hubspotRecordId ✅

**Unmapped but Available:** 3 fields could be mapped
- Create Date / QB Date Created → createdAt
- QB Date Modified → updatedAt
- DQ: Exceptions → description

**Not Applicable:** 7 fields
- Relationship counts (3 fields)
- Duplicate/redundant fields (3 fields)
- External system ID (1 field)
