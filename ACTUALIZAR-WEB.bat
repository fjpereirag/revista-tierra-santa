@echo off
rem Abre el panel para actualizar noticias y revistas de la web (necesita Python).
cd /d "%~dp0"
set PY=
where py >nul 2>nul && set PY=py
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY goto sinpython
title Panel de la Revista Tierra Santa - no cierres esta ventana
%PY% herramientas\panel.py 4361
pause
exit /b
:sinpython
echo.
echo No encuentro Python en este ordenador.
echo Instalalo desde https://www.python.org/downloads/ y vuelve a abrir este archivo.
echo.
pause
