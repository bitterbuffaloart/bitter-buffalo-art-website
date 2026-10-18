# Deploy Bitter Buffalo Art static site to Cloudflare Pages (preview only — no DNS).
# Run (works even when .ps1 execution is restricted):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy-preview.ps1
# Or double-click / run: .\deploy-preview.cmd
#
# Auth: npx wrangler login   OR   set CLOUDFLARE_API_TOKEN (Pages:Edit)
# Account: CLOUDFLARE_ACCOUNT_ID (set below if unset)

$ErrorActionPreference = 'Stop'

$Project = 'bitter-buffalo-art'
# Pages project production_branch is still `preview` (Direct Upload).
# Deploying to `preview` updates https://bitter-buffalo-art.pages.dev/
$Branch = 'preview'
$AccountId = if ($env:CLOUDFLARE_ACCOUNT_ID) { $env:CLOUDFLARE_ACCOUNT_ID } else { 'f3ee68d66369fd4b2bc390d1dae218f6' }
$env:CLOUDFLARE_ACCOUNT_ID = $AccountId

# Deployable assets live in this folder (index.html + assets/), not the Art Builder repo root.
$Dir = $PSScriptRoot
if (-not $Dir) { $Dir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$Dir = (Resolve-Path -LiteralPath $Dir).Path
$Index = Join-Path $Dir 'index.html'

if (-not (Test-Path -LiteralPath $Index)) {
  throw "Static site index not found: $Index. Build with working\build-static-site.js first."
}

Write-Host "Account:  $AccountId"
Write-Host "Project:  $Project"
Write-Host "Branch:   $Branch"
Write-Host "Directory:$Dir"
Write-Host ""

Write-Host "Checking Wrangler authentication..."
$whoami = & npx --yes wrangler whoami 2>&1 | Out-String
Write-Host $whoami
if ($whoami -match 'not authenticated|You are not logged in|Please run') {
  throw "Wrangler is not authenticated. Run: npx wrangler login  (approve in browser), then re-run this script."
}

Write-Host "Ensuring Pages project exists..."
$listJson = & npx --yes wrangler pages project list --json 2>&1 | Out-String
$projectExists = $false
# Prefer string match — Wrangler list output is often a table, not JSON.
if ($listJson -match [regex]::Escape($Project)) { $projectExists = $true }
if (-not $projectExists) {
  try {
    $projects = $listJson | ConvertFrom-Json
    if ($projects) {
      foreach ($p in @($projects)) {
        $name = $p.name
        if (-not $name -and $p.PSObject.Properties['Name']) { $name = $p.Name }
        if ($name -eq $Project) { $projectExists = $true; break }
      }
    }
  } catch { }
}

if (-not $projectExists) {
  Write-Host "Creating Pages project '$Project' (production branch: $Branch)..."
  & npx --yes wrangler pages project create $Project --production-branch $Branch
  if ($LASTEXITCODE -ne 0) { throw "Failed to create Pages project '$Project'." }
} else {
  Write-Host "Pages project '$Project' already exists."
}

Write-Host ""
Write-Host "Deploying static site..."
& npx --yes wrangler pages deploy $Dir --project-name=$Project --branch=$Branch
if ($LASTEXITCODE -ne 0) { throw "wrangler pages deploy failed (exit $LASTEXITCODE)." }

Write-Host ""
Write-Host "Deploy finished. Preview URL is usually: https://$Project.pages.dev"
Write-Host "Confirm the URL printed above by Wrangler. Do not change production DNS."
