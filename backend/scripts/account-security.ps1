param(
  [ValidateSet('generate', 'reset', 'change')][string]$Action = 'generate',
  [string]$ApiOrigin = 'http://127.0.0.1:3001',
  [string]$RecoveryDirectory = (Join-Path (Split-Path $PSScriptRoot -Parent) 'recovery.local')
)
$ErrorActionPreference = 'Stop'
$origin = [uri]$ApiOrigin
if ($origin.Scheme -ne 'http' -or $origin.Host -notin @('127.0.0.1', 'localhost') -or $origin.AbsolutePath -ne '/' -or $origin.Query -or $origin.UserInfo -or $origin.Fragment) {
  throw 'Tool ini hanya menerima API HTTP loopback lokal tanpa path atau kredensial URL.'
}
$api = $origin.GetLeftPart([UriPartial]::Authority) + '/api/v1/auth'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$token = $null
$currentPassword = $null
$newPassword = $null
$recoveryCode = $null
$savedCodes = $null

function Read-PrivateValue([string]$Label) {
  $secure = Read-Host $Label -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $secure.Dispose()
  }
}
function Invoke-LocalAuth([string]$Path, [hashtable]$Body, [bool]$Authorized = $false) {
  $headers = @{}
  if ($Authorized) { $headers.Authorization = 'Bearer ' + $script:token }
  try {
    return Invoke-RestMethod -Uri ($api + $Path) -Method Post -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Compress) -WebSession $session -Headers $headers -TimeoutSec 30
  } catch {
    # Never echo response bodies, request payloads, tokens, passwords or codes.
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'koneksi' }
    throw "Permintaan gagal ($status). Periksa server, kredensial/kode, atau batas percobaan. Password baru minimal 8 karakter, berisi huruf dan angka, maksimal 72 byte UTF-8."
  }
}
try {
  Write-Host 'Keamanan akun LaperU lokal. Input rahasia tidak ditampilkan atau dimasukkan command history.'
  $email = (Read-Host 'Email akun').Trim()
  if ($Action -eq 'reset') {
    $recoveryCode = Read-PrivateValue 'Kode pemulihan yang sudah disimpan sebelumnya'
  } else {
    $currentPassword = Read-PrivateValue 'Password saat ini'
    $login = Invoke-LocalAuth '/login' @{ email = $email; password = $currentPassword }
    $token = $login.data.accessToken
    if (-not $token) { throw 'Login tidak menghasilkan sesi; proses dihentikan.' }
  }
  if ($Action -eq 'generate') {
    $directory = $RecoveryDirectory
    [IO.Directory]::CreateDirectory($directory) | Out-Null
    $file = Join-Path $directory (([guid]::NewGuid().ToString('N')) + '.json')
    # Reserve a writable private local file before invalidating the previous set.
    $stream = [IO.File]::Open($file, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try {
      $result = Invoke-LocalAuth '/recovery-codes' @{ currentPassword = $currentPassword } $true
      $savedCodes = $result.data.codes
      if ($savedCodes.Count -ne 5) { throw 'Respons kode pemulihan tidak sesuai.' }
      $content = @{ email = $email; codes = $savedCodes; createdAt = (Get-Date).ToUniversalTime().ToString('o'); warning = 'RAHASIA. Simpan offline secara pribadi. Satu reset membatalkan seluruh set kode lama. Jangan unggah atau bagikan.' } | ConvertTo-Json
      $bytes = [Text.Encoding]::UTF8.GetBytes($content)
      $stream.Write($bytes, 0, $bytes.Length)
      $stream.Flush()
    } finally { $stream.Dispose() }
    Write-Host "Lima kode baru tersimpan di $file"
    Write-Host 'Set kode sebelumnya tidak berlaku. Pindahkan salinan ke penyimpanan pribadi yang aman, terpisah dari laptop. Jangan kirim ke grup/GitHub.'
  } else {
    $newPassword = Read-PrivateValue 'Password baru'
    $confirmation = Read-PrivateValue 'Ulangi password baru'
    if ($newPassword -cne $confirmation) { throw 'Konfirmasi password tidak sama; tidak ada perubahan.' }
    if ($Action -eq 'reset') {
      Invoke-LocalAuth '/reset-password' @{ email = $email; recoveryCode = $recoveryCode; newPassword = $newPassword } | Out-Null
    } else {
      Invoke-LocalAuth '/change-password' @{ currentPassword = $currentPassword; newPassword = $newPassword } $true | Out-Null
    }
    Write-Host 'Password berhasil diganti. Semua sesi dan kode lama dibatalkan. Login dengan password baru, lalu buat kode pemulihan baru.'
  }
} catch {
  Write-Host $_.Exception.Message
  Write-Host ("Lokasi kegagalan: baris " + $_.InvocationInfo.ScriptLineNumber)
  Write-Host 'Jika penyimpanan kode gagal setelah server menerbitkan kode, jalankan generate lagi selagi password masih diketahui.'
  exit 1
} finally {
  if ($token) {
    try { Invoke-LocalAuth '/logout' @{} | Out-Null } catch { Write-Host 'Sesi alat mungkin belum ditutup karena server tidak terjangkau.' }
  }
  $token = $null; $currentPassword = $null; $newPassword = $null; $confirmation = $null; $recoveryCode = $null; $savedCodes = $null; $content = $null; $bytes = $null; $login = $null; $result = $null
}
