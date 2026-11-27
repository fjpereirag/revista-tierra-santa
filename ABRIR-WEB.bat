@echo off
rem Abre la web de la Revista Tierra Santa en el navegador (necesita Python).
cd /d "%~dp0"
set PY=
where py >nul 2>nul && set PY=py
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY goto sinpython
start "Servidor Revista Tierra Santa (no cerrar)" /min %PY% servir.py 4360
timeout /t 2 /nobreak >nul
start "" http://localhost:4360/
exit /b
:sinpython
echo.
echo No encuentro Python en este ordenador.
echo Instalalo desde https://www.python.org/downloads/ y vuelve a abrir este archivo.
echo.
pause
