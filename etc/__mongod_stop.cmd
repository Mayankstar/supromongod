@echo off
set CYGWIN=nodosfilewarning
rem current working directory must be set up by shortcut or by manually running from here
..\..\..\bin\sh.exe ./init.d/mongodb+.sh stop
pause
