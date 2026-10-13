param(
    [string]$BaseUrl = 'https://www.rebar.shop',
    [switch]$AllowInvalidStagingCertificate
)

$ErrorActionPreference = 'Stop'
$oldCallback = [System.Net.ServicePointManager]::ServerCertificateValidationCallback
if ($AllowInvalidStagingCertificate) {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
}

function Get-NoRedirect([string]$Url) {
    try {
        return Invoke-WebRequest -UseBasicParsing -MaximumRedirection 0 -Uri $Url -Headers @{'User-Agent'='Mozilla/5.0 REBAR-Shop-P3-Verifier'}
    } catch {
        if ($_.Exception.Response) { return $_.Exception.Response }
        throw
    }
}

try {
    $base = $BaseUrl.TrimEnd('/')
    $primaryPath = '/product-category/rebar-products/prefabricated-rebars/stirrups/'
    $duplicatePath = '/product-category/rebar-stirrups/'
    $primaryUrl = $base + $primaryPath
    $duplicateUrl = $base + $duplicatePath

    $duplicate = Get-NoRedirect $duplicateUrl
    $duplicateStatus = [int]$duplicate.StatusCode
    $location = [string]$duplicate.Headers['Location']
    if ($location.StartsWith('/')) { $location = $base + $location }
    if ($duplicateStatus -ne 301 -or $location.TrimEnd('/') -ne $primaryUrl.TrimEnd('/')) {
        throw "Duplicate archive did not return the expected 301. Status=$duplicateStatus Location=$location"
    }

    $primary = Invoke-WebRequest -UseBasicParsing -Uri $primaryUrl -Headers @{'User-Agent'='Mozilla/5.0 REBAR-Shop-P3-Verifier'}
    if ([int]$primary.StatusCode -ne 200) { throw 'Primary Stirrups archive is not HTTP 200.' }
    $canonical = [regex]::Match($primary.Content, '<link[^>]+rel=["'']canonical["''][^>]+href=["'']([^"'']+)', 'IgnoreCase').Groups[1].Value
    if ($canonical.TrimEnd('/') -ne $primaryUrl.TrimEnd('/')) { throw "Primary canonical mismatch: $canonical" }
    if ([regex]::Matches($primary.Content, '<h1\b', 'IgnoreCase').Count -ne 1) { throw 'Primary archive does not contain exactly one H1; deploy/verify P2 first.' }

    $api = Invoke-RestMethod -Uri ($base + '/wp-json/wp/v2/product?product_cat=572&per_page=1&_fields=id') -Headers @{'User-Agent'='Mozilla/5.0 REBAR-Shop-P3-Verifier'}
    if (@($api).Count -ne 0) { throw 'Duplicate term 572 still has products assigned.' }

    $sitemap = (Invoke-WebRequest -UseBasicParsing -Uri ($base + '/product_cat-sitemap.xml') -Headers @{'User-Agent'='Mozilla/5.0 REBAR-Shop-P3-Verifier'}).Content
    if ($sitemap -match [regex]::Escape($duplicatePath)) { throw 'Duplicate archive remains in the product-category sitemap.' }
    if ($sitemap -notmatch [regex]::Escape($primaryPath)) { throw 'Primary archive is missing from the product-category sitemap.' }

    Write-Host 'PASS: duplicate Stirrups archive 301s to the primary archive, term 572 has no products, and the primary remains 200/self-canonical with one H1.'
} finally {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $oldCallback
}
