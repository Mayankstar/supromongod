@echo off
set CYGWIN=nodosfilewarning
rem current working directory must be set up by shortcut or by manual running from here
..\..\..\bin\sh.exe ./mongo-edit.sh
pause
exit
