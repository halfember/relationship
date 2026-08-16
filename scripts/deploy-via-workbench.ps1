param(
  [string]$InstanceId = 'i-n4ad9mkgom3cozxz2hrn',
  [string]$Archive = '',
  [string]$Region = ''
)

$ErrorActionPreference = 'Stop'

function Invoke-Workbench {
  param(
    [string]$Stage,
    [string[]]$WorkbenchArgs
  )

  Write-Host "[$Stage]"
  & workbench @WorkbenchArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Workbench stage '$Stage' failed with exit code $LASTEXITCODE"
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$packageJson = Get-Content -Raw (Join-Path $repoRoot 'server\package.json') | ConvertFrom-Json
$version = [string]$packageJson.version

if (-not $Archive) {
  $Archive = Join-Path $repoRoot "relationship-manager-server-v$version-20260816-1302.tar.gz"
}
$archivePath = (Resolve-Path $Archive).Path
$deployScript = Join-Path $PSScriptRoot 'deploy-linux.sh'
$backupScript = Join-Path $PSScriptRoot 'backup-mysql.js'

foreach ($requiredFile in @($archivePath, $deployScript, $backupScript)) {
  if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
    throw "Required deployment file is missing: $requiredFile"
  }
}

$remoteDir = '/tmp'
$archiveName = Split-Path -Leaf $archivePath
$globalArgs = @()
if ($Region) {
  $globalArgs = @('-r', $Region)
}

Write-Host 'Uploading verified release and deployment helpers'
Invoke-Workbench 'Upload release archive' (@('upload', $archivePath, "$remoteDir/", '-i', $InstanceId, '-f') + $globalArgs)
Invoke-Workbench 'Upload deployment script' (@('upload', $deployScript, "$remoteDir/", '-i', $InstanceId, '-f') + $globalArgs)
Invoke-Workbench 'Upload database backup helper' (@('upload', $backupScript, "$remoteDir/", '-i', $InstanceId, '-f') + $globalArgs)

$remoteDeploy = "chmod 700 '$remoteDir/deploy-linux.sh' && cd '$remoteDir' && bash ./deploy-linux.sh './$archiveName' '$version'"
Write-Host "Deploying relationship-manager v$version"
try {
  Invoke-Workbench 'Deploy through non-interactive exec' (@('exec', '-i', $InstanceId, '-c', $remoteDeploy, '--timeout', '900') + $globalArgs)
} catch {
  Write-Warning "Non-interactive exec is unavailable: $($_.Exception.Message)"
  Write-Host 'All release files were uploaded successfully.'
  Write-Host "Open a TTY with: workbench connect -i $InstanceId"
  Write-Host "Then run: $remoteDeploy"
  throw 'Workbench exec is unavailable; deployment must be started in the interactive TTY.'
}

Write-Host 'Verifying public HTTPS endpoint'
try {
  Invoke-Workbench 'Public health check' (@('exec', '-i', $InstanceId, '-c', 'curl -fsS https://yumt.cn/api/health', '--timeout', '30') + $globalArgs)
} catch {
  throw "Deployment ran, but the public health check could not be executed: $($_.Exception.Message)"
}

$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
Write-Host "Deployment completed. Archive SHA256: $hash"
