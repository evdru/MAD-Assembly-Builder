::This batch file will start MAB and is specifically for windows installations

@echo off

set myPath = %cd%

cd %myPath%

call npm start

exit