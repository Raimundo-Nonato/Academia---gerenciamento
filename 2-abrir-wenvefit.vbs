Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = scriptDir

' Inicia o sistema em segundo plano, sem abrir janela de terminal
shell.Run "cmd /c npm start", 0, False

' Espera o servidor terminar de subir antes de abrir o navegador
WScript.Sleep 5000

' Abre o sistema no navegador padrao
shell.Run "http://localhost:3000"
