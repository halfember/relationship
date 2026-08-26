[CmdletBinding()]
param(
    [switch]$StopInfrastructure
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot 'logs/local-dev'

foreach ($name in @('server', 'web', 'miniapp')) {
    $pidFile = Join-Path $runtimeDir "$name.pid"
    if (-not (Test-Path $pidFile)) {
        continue
    }

    $processId = [int](Get-Content -Raw $pidFile)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    if ($process -and $process.Name -in @('npm.exe', 'npm.cmd', 'cmd.exe', 'node.exe')) {
        taskkill /PID $processId /T /F | Out-Null
        Write-Host "Stopped $name (PID $processId)."
    }

    Remove-Item -LiteralPath $pidFile -Force
}

if ($StopInfrastructure) {
    Push-Location $repoRoot
    try {
        docker compose -f docker-compose.dev.yml stop
    }
    finally {
        Pop-Location
    }
}
