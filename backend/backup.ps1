param(
  [string]$Destination = "backups"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root $Destination
New-Item -ItemType Directory -Force -Path $target | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item (Join-Path $PSScriptRoot "topazion.sqlite3") (Join-Path $target "topazion-$stamp.sqlite3")
Write-Output "Backup created in $target"