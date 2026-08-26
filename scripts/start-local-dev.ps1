[CmdletBinding()]
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot 'logs/local-dev'

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

$composeStarted = $false
foreach ($attempt in 1..3) {
    Push-Location $repoRoot
    try {
        docker compose -f docker-compose.dev.yml up -d --wait
    }
    finally {
        Pop-Location
    }
    if ($LASTEXITCODE -eq 0) {
        $composeStarted = $true
        break
    }

    if ($attempt -lt 3) {
        Write-Warning "Docker is not ready (attempt $attempt of 3); retrying in 3 seconds."
        Start-Sleep -Seconds 3
    }
}

if (-not $composeStarted) {
    throw 'Failed to start local MySQL and Redis containers. Check that Docker Desktop is running.'
}

if (-not $SkipInstall) {
    foreach ($app in @('server', 'web', 'miniapp')) {
        $appDir = Join-Path $repoRoot $app
        if (-not (Test-Path (Join-Path $appDir 'node_modules'))) {
            Push-Location $appDir
            try {
                npm install
                if ($LASTEXITCODE -ne 0) {
                    throw "npm install failed in $app."
                }
            }
            finally {
                Pop-Location
            }
        }
    }
}

$serverPidFile = Join-Path $runtimeDir 'server.pid'
$serverAlreadyRunning = $false
if (Test-Path $serverPidFile) {
    $trackedServerPid = [int](Get-Content -Raw $serverPidFile)
    $serverAlreadyRunning = [bool](Get-Process -Id $trackedServerPid -ErrorAction SilentlyContinue)
}

if ($serverAlreadyRunning) {
    Write-Host 'Server is already running; skipping Prisma generation and migrations.'
}
else {
    Push-Location (Join-Path $repoRoot 'server')
    try {
        npm run prisma:generate
        if ($LASTEXITCODE -ne 0) {
            throw 'Prisma client generation failed.'
        }

        npm run prisma:migrate:prod
        if ($LASTEXITCODE -ne 0) {
            throw 'Database migration failed.'
        }
    }
    finally {
        Pop-Location
    }
}

function Start-LocalProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string[]]$Arguments
    )

    $pidFile = Join-Path $runtimeDir "$Name.pid"
    if (Test-Path $pidFile) {
        $existingPid = [int](Get-Content -Raw $pidFile)
        if (Get-Process -Id $existingPid -ErrorAction SilentlyContinue) {
            Write-Host "$Name is already running (PID $existingPid)."
            return
        }
    }

    $process = Start-Process -FilePath 'npm.cmd' `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput (Join-Path $runtimeDir "$Name.stdout.log") `
        -RedirectStandardError (Join-Path $runtimeDir "$Name.stderr.log") `
        -WindowStyle Hidden `
        -PassThru

    Set-Content -Path $pidFile -Value $process.Id
    Write-Host "Started $Name (PID $($process.Id))."
}

Start-LocalProcess -Name 'server' -WorkingDirectory (Join-Path $repoRoot 'server') -Arguments @('run', 'start:dev')
Start-LocalProcess -Name 'web' -WorkingDirectory (Join-Path $repoRoot 'web') -Arguments @('run', 'dev')
Start-LocalProcess -Name 'miniapp' -WorkingDirectory (Join-Path $repoRoot 'miniapp') -Arguments @('run', 'dev:mp-weixin')

Write-Host 'Local development services are starting:'
Write-Host '  API health: http://localhost:3000/api/health'
Write-Host '  Web:        http://localhost:5173'
Write-Host '  Miniapp:    miniapp/dist/dev/mp-weixin'
Write-Host "  Logs:       $runtimeDir"
