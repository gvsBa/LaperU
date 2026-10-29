param(
  [string]$DatabaseBin = 'C:\xampp\mysql\bin',
  [switch]$BrowserSmoke
)

$ErrorActionPreference = 'Stop'
$backendDirectory = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$databaseServer = Join-Path $DatabaseBin 'mysqld.exe'
$databaseInstaller = Join-Path $DatabaseBin 'mysql_install_db.exe'
$databaseAdmin = Join-Path $DatabaseBin 'mysqladmin.exe'
foreach ($executable in @($databaseServer, $databaseInstaller, $databaseAdmin)) {
  if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
    throw "Binary database tidak ditemukan: $executable. Gunakan -DatabaseBin untuk instalasi MariaDB/XAMPP Anda."
  }
}

# Only this newly created temporary directory belongs to the test runner.
# No installed service or existing XAMPP database/configuration is changed.
$runId = [guid]::NewGuid().ToString('N')
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$runDirectory = Join-Path $tempRoot "laperu-qa-$runId"
$dataDirectory = Join-Path $runDirectory 'data'
$databaseName = "laperu_test_$runId"
$databasePassword = [guid]::NewGuid().ToString('N')
$databaseProcess = $null
$exitCode = 1
$environmentNames = @('DATABASE_URL', 'NODE_ENV', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'LAPERU_INTEGRATION_TESTS', 'UPLOAD_DIRECTORY', 'MYSQL_PWD', 'LAPERU_DEMO_CREDENTIALS', 'LAPERU_SHOWCASE_CREDENTIALS')
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$previousLocation = Get-Location

function Invoke-DatabaseAdmin([string]$Action) {
  $adminProcess = Start-Process -FilePath $databaseAdmin -ArgumentList @(
    '--no-defaults', '--host=127.0.0.1', "--port=$databasePort", '--user=root', '--connect-timeout=1', '--silent', $Action
  ) -WindowStyle Hidden -PassThru
  if (-not $adminProcess.WaitForExit(3000)) {
    # Bound this runner's health/shutdown client, never an existing DB service.
    $adminProcess.Kill()
    $adminProcess.WaitForExit()
    return 1
  }
  return $adminProcess.ExitCode
}

try {
  New-Item -ItemType Directory -Path $runDirectory | Out-Null
  $portProbe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
  $portProbe.Start()
  $databasePort = $portProbe.LocalEndpoint.Port
  $portProbe.Stop()
  & $databaseServer --version
  & $databaseInstaller "--datadir=$dataDirectory" "--port=$databasePort" "--password=$databasePassword" --silent
  if ($LASTEXITCODE -ne 0) { throw 'Inisialisasi database QA gagal.' }

  $serverArguments = @(
    '--no-defaults',
    ('--basedir="{0}"' -f (Split-Path $DatabaseBin -Parent)),
    ('--datadir="{0}"' -f $dataDirectory),
    "--port=$databasePort",
    '--bind-address=127.0.0.1',
    '--skip-name-resolve',
    '--innodb-buffer-pool-size=32M',
    # Avoid the native-AIO slot assertion observed in XAMPP MariaDB 10.4 on Windows.
    # This flag affects only this runner's disposable instance, never XAMPP config.
    '--innodb-use-native-aio=0',
    ('--log-error="{0}"' -f (Join-Path $runDirectory 'server.log'))
  )
  $databaseProcess = Start-Process -FilePath $databaseServer -ArgumentList $serverArguments -WindowStyle Hidden -PassThru
  $env:MYSQL_PWD = $databasePassword
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if ($databaseProcess.HasExited) { throw "Server QA berhenti sebelum siap (exit $($databaseProcess.ExitCode)). Periksa log di direktori QA." }
    if ((Invoke-DatabaseAdmin 'ping') -eq 0) { $ready = $true; break }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw 'Server database QA belum siap setelah 10 detik.' }

  $env:DATABASE_URL = "mysql://root:${databasePassword}@127.0.0.1:${databasePort}/$databaseName"
  $env:NODE_ENV = 'test'
  $env:ADMIN_EMAIL = 'qa-admin@example.test'
  $env:ADMIN_PASSWORD = 'QaAdmin12345'
  $env:LAPERU_INTEGRATION_TESTS = '1'
  $env:UPLOAD_DIRECTORY = Join-Path $runDirectory 'uploads'
  $env:LAPERU_DEMO_CREDENTIALS = Join-Path $runDirectory 'demo-accounts.json'
  $env:LAPERU_SHOWCASE_CREDENTIALS = Join-Path $runDirectory 'showcase-accounts.json'
  Set-Location -LiteralPath $backendDirectory
  & npm.cmd run db:migrate
  if ($LASTEXITCODE -ne 0) { throw 'Migrasi QA gagal.' }
  & npm.cmd run db:seed
  if ($LASTEXITCODE -ne 0) { throw 'Seed QA gagal.' }
  # Repeating migration/seed verifies that normal setup is repeatable.
  & npm.cmd run db:migrate
  if ($LASTEXITCODE -ne 0) { throw 'Pengulangan migrasi QA gagal.' }
  & npm.cmd run db:seed
  if ($LASTEXITCODE -ne 0) { throw 'Pengulangan seed QA gagal.' }
  & npm.cmd run db:seed:demo
  if ($LASTEXITCODE -ne 0) { throw 'Seed akun demo QA gagal.' }
  & npm.cmd run db:seed:demo
  if ($LASTEXITCODE -ne 0) { throw 'Pengulangan seed akun demo QA gagal.' }
  & npm.cmd run db:seed:showcase
  if ($LASTEXITCODE -ne 0) { throw 'Seed showcase QA gagal.' }
  & npm.cmd run db:seed:showcase
  if ($LASTEXITCODE -ne 0) { throw 'Pengulangan seed showcase QA gagal.' }
  & npm.cmd run test:integration
  $exitCode = $LASTEXITCODE
  if ($BrowserSmoke -and $exitCode -eq 0) {
    Set-Location -LiteralPath (Split-Path $backendDirectory -Parent)
    & npm.cmd run test:browser
    $exitCode = $LASTEXITCODE
  }
} catch {
  Write-Host "Pengujian QA gagal: $($_.Exception.Message)"
  $serverLog = Join-Path $runDirectory 'server.log'
  if (Test-Path -LiteralPath $serverLog) { Get-Content -LiteralPath $serverLog -Tail 50 }
} finally {
  if ($null -ne $databaseProcess -and -not $databaseProcess.HasExited) {
    Invoke-DatabaseAdmin 'shutdown' | Out-Null
    if (-not $databaseProcess.WaitForExit(5000)) {
      # This is the exact child process started above, never an existing service.
      $databaseProcess.Kill()
      $databaseProcess.WaitForExit()
    }
  }
  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
  }
  Set-Location -LiteralPath $previousLocation.Path
  if (Test-Path -LiteralPath $runDirectory) {
    $resolvedRun = (Resolve-Path -LiteralPath $runDirectory).Path
    $expectedRun = [IO.Path]::GetFullPath((Join-Path $tempRoot "laperu-qa-$runId"))
    if ($resolvedRun -ne $expectedRun -or (Split-Path $resolvedRun -Leaf) -ne "laperu-qa-$runId") {
      throw 'Pembersihan dibatalkan: direktori sementara tidak sesuai dengan direktori yang dibuat runner.'
    }
    Remove-Item -LiteralPath $resolvedRun -Recurse -Force
  }
}
exit $exitCode
