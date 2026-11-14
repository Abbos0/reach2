$ErrorActionPreference = 'Stop'

$firstPassword = Read-Host 'Yangi parol (kamida 5 belgi)' -AsSecureString
$secondPassword = Read-Host 'Yangi parolni qayta kiriting' -AsSecureString
$firstPointer = [IntPtr]::Zero
$secondPointer = [IntPtr]::Zero
$plainFirst = $null
$plainSecond = $null

try {
  $firstPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($firstPassword)
  $secondPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secondPassword)
  $plainFirst = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPointer)
  $plainSecond = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPointer)

  if ($plainFirst.Length -lt 5) {
    throw 'Parol kamida 5 belgidan iborat bo‘lishi kerak.'
  }

  if ($plainFirst -cne $plainSecond) {
    throw 'Parollar mos emas. Hech narsa o‘zgartirilmadi.'
  }

  @($plainFirst, $plainSecond) | & '.\node-v22\node-v22.13.0-win-x64\node.exe' --env-file=.env.local '.\scripts\set-admin-password.mjs' --stdin

  if ($LASTEXITCODE -ne 0) {
    throw 'Parol hash’i saqlanmadi.'
  }
} finally {
  if ($firstPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPointer)
  }

  if ($secondPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPointer)
  }

  $plainFirst = $null
  $plainSecond = $null
  $firstPassword.Dispose()
  $secondPassword.Dispose()
}