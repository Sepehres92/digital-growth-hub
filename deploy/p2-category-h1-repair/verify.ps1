$ErrorActionPreference = 'Stop'

$expectations = @(
    @{
        Url = 'https://www.rebar.shop/product-category/rebar-products/prefabricated-rebars/stirrups/'
        H1 = 'Rebar Stirrups & Ties — Standard Sizes or Custom Fabrication'
    },
    @{
        Url = 'https://www.rebar.shop/product-category/fiber-glass-rebars-gfrp/'
        H1 = 'Fiberglass Rebar (GFRP) — Corrosion-Resistant Reinforcement'
    }
)

$results = foreach ($item in $expectations) {
    $response = Invoke-WebRequest -Uri $item.Url -UseBasicParsing -TimeoutSec 30
    $html = $response.Content
    $robots = [regex]::Match($html, '(?is)<meta[^>]+name=["'']robots["''][^>]+content=["'']([^"'']+)').Groups[1].Value
    $canonical = [regex]::Match($html, '(?is)<link[^>]+rel=["'']canonical["''][^>]+href=["'']([^"'']+)').Groups[1].Value
    $h1s = @([regex]::Matches($html, '(?is)<h1\b[^>]*>(.*?)</h1>') | ForEach-Object {
        [System.Net.WebUtility]::HtmlDecode(($_.Groups[1].Value -replace '<[^>]+>', ' ' -replace '\s+', ' ').Trim())
    })

    [pscustomobject]@{
        Url = $item.Url
        Http200 = ([int]$response.StatusCode -eq 200)
        CanonicalMatches = ($canonical -eq $item.Url)
        Indexable = ($robots -match 'index\s*,\s*follow' -and $robots -notmatch 'noindex')
        H1Count = $h1s.Count
        ExpectedH1 = ($h1s.Count -eq 1 -and $h1s[0] -eq $item.H1)
    }
}

$results | Format-Table -AutoSize

if ($results.Where({
    -not ($_.Http200 -and $_.CanonicalMatches -and $_.Indexable -and $_.ExpectedH1)
}).Count -gt 0) {
    throw 'P2 live verification failed. Review the false fields and roll back if the issue is material.'
}

Write-Host 'PASS: both P2 category pages return 200, self-canonicalize, remain indexable, and contain exactly one expected H1.'

