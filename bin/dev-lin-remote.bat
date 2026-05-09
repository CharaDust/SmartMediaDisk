@echo off
setlocal EnableExtensions

set "REMOTE_HOST=192.168.233.112"
set "REMOTE_USER=root"
set "REMOTE_BASE=/home/orangepi/Apps"
set "REMOTE_APP=SmartMediaDisk"
set "REMOTE_DIR=%REMOTE_BASE%/%REMOTE_APP%"
set "REMOTE_OLD=%REMOTE_BASE%/%REMOTE_APP%_old"
set "REMOTE_ARCHIVE=/tmp/smartmediadisk_upload.tar.gz"
set "REMOTE_DB_REL=src/django/db.sqlite3"

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"

set "KEY_FILE=%~1"
if not defined KEY_FILE (
    set /p "KEY_FILE=Input SSH private key path: "
)
set "KEY_FILE=%KEY_FILE:"=%"

if not exist "%KEY_FILE%" (
    echo [ERROR] Private key file does not exist: %KEY_FILE%
    goto fail
)

echo [INFO] If OpenSSH reports "UNPROTECTED PRIVATE KEY FILE", fix key ACL first.
set /p "FIX_KEY_ACL=Fix private key ACL for current Windows user now? [y/N]: "
if /I "%FIX_KEY_ACL%"=="Y" goto fix_key_acl
if /I "%FIX_KEY_ACL%"=="YES" goto fix_key_acl
goto after_key_acl

:fix_key_acl
echo [INFO] Updating private key ACL...
icacls "%KEY_FILE%" /inheritance:r >nul
if errorlevel 1 goto fail
icacls "%KEY_FILE%" /grant:r "%USERNAME%:R" >nul
if errorlevel 1 goto fail
icacls "%KEY_FILE%" /remove:g "BUILTIN\Users" "Authenticated Users" "Everyone" >nul 2>nul
echo [INFO] Private key ACL updated.

:after_key_acl

where ssh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] ssh not found. Install Windows OpenSSH Client, or use PowerShell/WSL.
    goto fail
)

where scp >nul 2>nul
if errorlevel 1 (
    echo [ERROR] scp not found. Install Windows OpenSSH Client, or use PowerShell/WSL.
    goto fail
)

where tar >nul 2>nul
if errorlevel 1 (
    echo [ERROR] tar not found. Install bsdtar/Git for Windows, or use PowerShell/WSL plus rsync.
    goto fail
)

set "ARCHIVE=%TEMP%\smartmediadisk_%RANDOM%%RANDOM%.tar.gz"
set "SSH_TARGET=%REMOTE_USER%@%REMOTE_HOST%"

echo [INFO] Project root: %PROJECT_ROOT%
echo [INFO] Remote host: %SSH_TARGET%
echo [INFO] Remote path: %REMOTE_DIR%
echo.

echo [1/6] Stop remote containers and backup old code...
ssh -i "%KEY_FILE%" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "%SSH_TARGET%" "cd %REMOTE_DIR% 2>/dev/null && (docker compose down || docker-compose down || true); mkdir -p %REMOTE_BASE%; if [ -e %REMOTE_OLD% ]; then mv %REMOTE_OLD% %REMOTE_OLD%_$(date +%%s); fi; if [ -e %REMOTE_DIR% ]; then mv %REMOTE_DIR% %REMOTE_OLD%; fi; mkdir -p %REMOTE_DIR%"
if errorlevel 1 goto fail

echo.
echo [2/6] Package local project...
tar --exclude=.git --exclude=.obsidian --exclude=env --exclude=data --exclude=dist --exclude=build --exclude=src/django/db.sqlite3 --exclude=./src/django/db.sqlite3 --exclude=src/django/db --exclude=./src/django/db -czf "%ARCHIVE%" -C "%PROJECT_ROOT%" .
if errorlevel 1 goto fail

echo.
echo [3/6] Upload package...
scp -i "%KEY_FILE%" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "%ARCHIVE%" "%SSH_TARGET%:%REMOTE_ARCHIVE%"
if errorlevel 1 goto fail

echo.
echo [4/6] Extract package on remote host...
ssh -i "%KEY_FILE%" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "%SSH_TARGET%" "tar -xzf %REMOTE_ARCHIVE% -C %REMOTE_DIR% && rm -f %REMOTE_ARCHIVE%"
if errorlevel 1 goto fail

echo.
echo [5/6] Preserve database...
set /p "KEEP_DB=Keep database from old code directory %REMOTE_OLD%/%REMOTE_DB_REL% ? [y/N]: "
if /I "%KEEP_DB%"=="Y" goto preserve_db
if /I "%KEEP_DB%"=="YES" goto preserve_db
goto after_preserve_db

:preserve_db
ssh -i "%KEY_FILE%" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "%SSH_TARGET%" "if [ -f %REMOTE_OLD%/%REMOTE_DB_REL% ]; then mkdir -p %REMOTE_DIR%/src/django && cp -f %REMOTE_OLD%/%REMOTE_DB_REL% %REMOTE_DIR%/%REMOTE_DB_REL% && echo '[OK] Database preserved.'; else echo '[WARN] Old database not found: %REMOTE_OLD%/%REMOTE_DB_REL%'; fi"
if errorlevel 1 goto fail

:after_preserve_db

echo.
echo [6/6] Start remote containers...
ssh -i "%KEY_FILE%" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "%SSH_TARGET%" "cd %REMOTE_DIR% && (docker compose up -d --build || docker-compose up -d --build)"
if errorlevel 1 goto fail

if exist "%ARCHIVE%" del /q "%ARCHIVE%" >nul 2>nul

echo.
echo [OK] Remote project updated and containers started.
set /p "DELETE_OLD=Delete remote old code directory %REMOTE_OLD% ? [y/N]: "
if /I "%DELETE_OLD%"=="Y" goto delete_old
if /I "%DELETE_OLD%"=="YES" goto delete_old

echo [INFO] Old code directory kept: %REMOTE_OLD%
goto success

:delete_old
echo [INFO] Delete remote old code directory...
ssh -i "%KEY_FILE%" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "%SSH_TARGET%" "rm -rf %REMOTE_OLD%"
if errorlevel 1 goto fail
echo [OK] Old code directory deleted.
goto success

:fail
if defined ARCHIVE (
    if exist "%ARCHIVE%" del /q "%ARCHIVE%" >nul 2>nul
)
echo.
echo [FAILED] Remote deploy failed. Check old directory if needed: %REMOTE_OLD%
pause
exit /b 1

:success
pause
exit /b 0
