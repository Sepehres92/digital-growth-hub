$ErrorActionPreference = 'Stop'

$expectations = @(
    @{ Url = 'https://www.rebar.shop/product/wiremesh-6x6-6-gauge/'; Title = '6×6 6-Gauge Welded Wire Mesh | 4×8 & 8×20 Sheets'; MetaContains = 'available in 4×8 and 8×20 sheets'; H1 = '6″x6″ Welded Wire Mesh – 6 Gauge' },
    @{ Url = 'https://www.rebar.shop/product/5x12-circular-steel-cage/'; Title = '5-ft × 12-in Circular Rebar Cage | Pre-Tied Steel'; MetaContains = '5-ft-long × 12-in-diameter'; H1 = '5′ x 12″ Circular Steel Cage' },
    @{ Url = 'https://www.rebar.shop/product-category/rebar-products/prefabricated-rebars/stirrups/'; Title = 'Rebar Stirrups & Ties | CSA 400W | Custom Sizes'; MetaContains = 'request custom sizes'; H1 = 'Rebar Stirrups & Ties — Standard Sizes or Custom Fabrication' },
    @{ Url = 'https://www.rebar.shop/product/rebar-dowels-24x8/'; Title = '15M Rebar Dowel 24×8 in | Grade 400W L-Bar'; MetaContains = '15M Grade 400W'; H1 = 'Rebar Dowels 24″x 8″ L-Shaped' }
)

$results = foreach ($item in $expectations) {
    $response = Invoke-WebRequest -Uri $item.Url -UseBasicParsing -TimeoutSec 30
    $html = $response.Content
    $title = [System.Net.WebUtility]::HtmlDecode([regex]::Match($html, '(?is)<title>(.*?)</title>').Groups[1].Value.Trim())
    $meta = [System.Net.WebUtility]::HtmlDecode([regex]::Match($html, '(?is)<meta[^>]+name=["'']description["''][^>]+content=["'']([^"'']+)').Groups[1].Value)
    $robots = [regex]::Match($html, '(?is)<meta[^>]+name=["'']robots["''][^>]+content=["'']([^"'']+)').Groups[1].Value
    $canonical = [regex]::Match($html, '(?is)<link[^>]+rel=["'']canonical["''][^>]+href=["'']([^"'']+)').Groups[1].Value
    $h1s = @([regex]::Matches($html, '(?is)<h1\b[^>]*>(.*?)</h1>') | ForEach-Object {
        [System.Net.WebUtility]::HtmlDecode(($_.Groups[1].Value -replace '<[^>]+>', ' ' -replace '\s+', ' ').Trim())
    })

    [pscustomobject]@{
        Url = $item.Url
        Http200 = ([int]$response.StatusCode -eq 200)
        TitleMatches = ($title -eq $item.Title)
        MetaMatches = ($meta -like "*$($item.MetaContains)*")
        CanonicalMatches = ($canonical -eq $item.Url)
        Indexable = ($robots -match 'index\s*,\s*follow' -and $robots -notmatch 'noindex')
        OneExpectedH1 = ($h1s.Count -eq 1 -and $h1s[0] -eq $item.H1)
        NoPlaceholderShipping = ($html -notmatch 'MAECENAS IACULIS|ADIPISCING CONVALLIS BULUM')
    }
}

$results | Format-Table -AutoSize

if ($results.Where({
    -not ($_.Http200 -and $_.TitleMatches -and $_.MetaMatches -and $_.CanonicalMatches -and $_.Indexable -and $_.OneExpectedH1 -and $_.NoPlaceholderShipping)
}).Count -gt 0) {
    throw 'P1 live verification failed. Review the false fields and roll back if the issue is material.'
}

Write-Host 'PASS: all four P1 URLs passed metadata, canonical, indexability, H1, and placeholder-removal checks.'

