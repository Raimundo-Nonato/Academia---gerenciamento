@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Configuracao inicial do sistema wenvefit
echo   (isso so precisa ser feito uma unica vez)
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado no seu computador.
  echo Baixe e instale a versao LTS em: https://nodejs.org
  echo Depois de instalar, execute este arquivo novamente.
  pause
  exit /b 1
)

echo Instalando dependencias do sistema...
echo (pode demorar alguns minutos na primeira vez)
echo.
call npm install
if errorlevel 1 goto erro

echo.
echo Gerando a versao de producao do sistema...
call npm run build
if errorlevel 1 goto erro

echo.
echo Inicializando o banco de dados...
start /b "" npm start
timeout /t 6 /nobreak > nul
curl -s http://localhost:3000/api/auth/me >nul 2>nul
timeout /t 2 /nobreak > nul
taskkill /f /im node.exe >nul 2>nul

echo.
echo Criando as contas de acesso iniciais...
call npm run seed:users
echo.

echo ============================================
echo   Tudo pronto!
echo.
echo   A partir de agora, use o arquivo
echo   "2-abrir-wenvefit.vbs" para abrir o sistema
echo   (duplo clique - nao precisa mais deste aqui).
echo.
echo   Login inicial:
echo     admin@wenvefit.com     /  troque-esta-senha-admin
echo     gerente@wenvefit.com   /  troque-esta-senha-gerente
echo.
echo   Troque essas senhas assim que entrar no sistema.
echo ============================================
pause
exit /b 0

:erro
echo.
echo Algo deu errado durante a instalacao.
echo Confira se o Node.js esta instalado corretamente e tente de novo.
pause
exit /b 1
