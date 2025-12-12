# AUTO-BUILDER FLOWORK (Python 3.11 + Node.js 18)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BaseDist = Join-Path $ScriptDir "flowork-core\dist"

# --- CONFIG ---
$PythonUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
$NodeUrl = "https://nodejs.org/dist/v18.20.0/node-v18.20.0-win-x64.zip"
$GetPipUrl = "https://bootstrap.pypa.io/get-pip.py"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   FLOWORK AUTO-FACTORY (ENGINE & GUI BUILDER)   " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. PERSIAPAN FOLDER
if (!(Test-Path $BaseDist)) { New-Item -ItemType Directory -Force -Path $BaseDist | Out-Null }

# --- PART A: PYTHON SETUP ---
$PyDir = Join-Path $BaseDist "python"
if (!(Test-Path $PyDir)) {
    Write-Host "[1/4] Downloading Python Engine..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $PyDir | Out-Null
    $PyZip = Join-Path $PyDir "python.zip"

    Invoke-WebRequest -Uri $PythonUrl -OutFile $PyZip
    Expand-Archive -Path $PyZip -DestinationPath $PyDir -Force
    Remove-Item $PyZip

    # Patch .pth
    $PthFile = Join-Path $PyDir "python311._pth"
    (Get-Content $PthFile) -replace "#import site", "import site" | Set-Content $PthFile

    # Install PIP
    Write-Host "[1.5/4] Installing PIP..." -ForegroundColor Yellow
    $PipScript = Join-Path $PyDir "get-pip.py"
    Invoke-WebRequest -Uri $GetPipUrl -OutFile $PipScript
    $PyExe = Join-Path $PyDir "python.exe"
    Start-Process -FilePath $PyExe -ArgumentList "$PipScript --no-warn-script-location" -Wait -NoNewWindow
    Remove-Item $PipScript
} else {
    Write-Host "[SKIP] Python already installed." -ForegroundColor Gray
}

# --- PART B: NODE.JS SETUP ---
$NodeDir = Join-Path $BaseDist "nodejs"
if (!(Test-Path $NodeDir)) {
    Write-Host "[2/4] Downloading Node.js (for GUI Building)..." -ForegroundColor Magenta
    $NodeZip = Join-Path $BaseDist "node.zip"

    Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeZip

    Write-Host "      Extracting Node.js..." -ForegroundColor Magenta
    Expand-Archive -Path $NodeZip -DestinationPath $BaseDist -Force
    Remove-Item $NodeZip

    # Rename folder hasil ekstrak biar rapi (misal node-v18... jadi nodejs)
    $Extracted = Get-ChildItem -Path $BaseDist -Filter "node-v*" -Directory | Select-Object -First 1
    if ($Extracted) {
        Rename-Item -Path $Extracted.FullName -NewName "nodejs"
    }
} else {
    Write-Host "[SKIP] Node.js already installed." -ForegroundColor Gray
}

# --- PART C: DEPENDENCIES ---
Write-Host "[3/4] Installing Python Libraries..." -ForegroundColor Green
$PyExe = Join-Path $PyDir "python.exe"
$CoreReq = Join-Path $ScriptDir "flowork-core\requirements.txt"
$GateReq = Join-Path $ScriptDir "flowork-gateway\requirements.txt"

# Fungsi Install Aman
function Install-Lib ($ReqFile) {
    if (Test-Path $ReqFile) {
        Start-Process -FilePath $PyExe -ArgumentList "-m pip install -r `"$ReqFile`" --no-warn-script-location" -Wait -NoNewWindow
    }
}

Install-Lib $CoreReq
Install-Lib $GateReq
# Tambahan wajib
Start-Process -FilePath $PyExe -ArgumentList "-m pip install Flask-JWT-Extended PyJWT" -Wait -NoNewWindow

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "   ENGINE READY! GUI WILL BE BUILT ON LAUNCH." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green