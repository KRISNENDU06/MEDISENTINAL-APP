' =========================================================================
' MEDISENTINEL Desktop Shortcut Creator
' Self-contained, auto-detects folder paths even without arguments
' =========================================================================
On Error Resume Next

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetParentFolderName(scriptDir)

sTarget = rootDir & "\Run_MEDISENTINEL.bat"
sWorkDir = rootDir
sIcon = scriptDir & "\app_icon.ico"

If WScript.Arguments.Count > 0 Then
    If Len(WScript.Arguments(0)) > 0 Then sTarget = WScript.Arguments(0)
End If
If WScript.Arguments.Count > 1 Then
    If Len(WScript.Arguments(1)) > 0 Then sWorkDir = WScript.Arguments(1)
End If
If WScript.Arguments.Count > 2 Then
    If Len(WScript.Arguments(2)) > 0 Then sIcon = WScript.Arguments(2)
End If

Set oWS = CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
sLinkFile = sDesktop & "\MEDISENTINEL - AI Health Surveillance.lnk"

Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = sTarget
oLink.WorkingDirectory = sWorkDir
oLink.IconLocation = sIcon & ", 0"
oLink.Description = "MEDISENTINEL - AI-Powered Community Health Surveillance & Early Warning Platform"
oLink.WindowStyle = 1
oLink.Save

If Err.Number = 0 Then
    WScript.Echo "SUCCESS: Shortcut created at: " & sLinkFile
    WScript.Echo "Target: " & sTarget
    WScript.Echo "WorkingDir: " & sWorkDir
    WScript.Echo "Icon: " & sIcon
Else
    WScript.Echo "ERROR: " & Err.Description
End If
