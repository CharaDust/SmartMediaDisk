<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = true
Opendata
%>
<!-- #include file=conn.asp -->
<!-- #include file=User_config.asp -->
<!-- #include file=md5.asp -->
<HTML><HEAD><TITLE></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="style.css">
<script Language="JavaScript">
function Add(){
	if (!document.all.file_name.value){
		alert("名称不能为空！");
		document.all.file_name.focus();
		return false;
	}
}
</script>
</head>
<body leftmargin="0" topmargin="0" bgcolor="#F6ECE2">
<%
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,pwd,Sex,Age,Address,Mail,Times,Loginip
Dim User_Share,USer_Friends,File_Dir_Max,User_Friendallow
User_UpFileConfig(User_id) 
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_GFL_SL
User_Group(User_Vip)
if File_Dir_Max>0 then
if File_Dir_Max<=ubound(split(User_Share,"|"))-1 then
response.write "超过目录数量限制，请升级会员1"
response.end
end if
else
response.write "超过目录数量限制，请升级会员2"
response.end
end if

If Request.QueryString("submitflag") = "" Then
	photoUpformFunction
Else
dim File_Name,File_Pass,File_Share
File_Name=replace(request.form("file_name"),"'","")
File_Pass=replace(request.form("file_Pass"),"'","")
if len(File_Pass)>8 then
response.write "密码不可超过8位 [ <a href='javascript:history.back();'>重新填写</a> ]"
response.end
end if
File_Pass=md5(File_Pass)
if FileDir_Name(file_name) then
GetSaveFileName(File_Name)
else
response.write "非法名称 [ <a href='javascript:history.back();'>重新填写</a> ]"
end if
End If

Function photoUpformFunction
%>
<table width="560" border="0" cellpadding="0" cellspacing="0"><tr><td>
<p align=left>提示：
<br><font color=#B50000>
1. 为了不影响您的使用，名称只能是字母及数字.<br>
2. 为了不影响您的使用，密码不要超过8位.<br>
3. 请不要使用不雅的英文名称.<br>
4. 请自觉维护本站秩序，感谢使用！
</font></p></td></tr>
<tr><td height=10 bgcolor=#ffffff></td></tr>
<tr><td>
<form name="form1" method="Post" action=setup.asp?submitflag=yes onSubmit="return Add();">
<table width="560" border="0" cellspacing="0" cellpadding="0" height="84">
<tr><td align=right height="1">目录名称</td><td height="1">
<input type="text" name='file_name' value=""></td></tr>
<tr><td align=right height="1">目录密码</td><td height="1">
<input type="text" name='file_pass' value=""></td></tr>
<tr><td align=center colspan=2><input type="submit" value="创建"></td></tr>
</table>
</form>
</td></tr></table>
</body>
</html>
<%End Function
Function GetSaveFileName(name)
        Dim TempStr,PhotoDirectory,UploadPhotoUrl
        PhotoDirectory=File_Path '获取上传目录
	name = Lcase(name)
	On Error Resume Next
	Set FS = CreateObject(File_FSO)
        If File_FSO = "" or err <> 0 Then 
        response.write "服务器不支持FSO"
		Err.Clear
		Set Fs = Nothing
		Exit Function
	End If

	Dim TDir,FS
	TDir = Server.MapPath(PhotoDirectory) & "\"
	If Not FS.FolderExists(TDir) then
		TempStr = TempStr & "错误，存放文件的目录不存在！<br>" & VbCrLf
	End If
	TDir = TDir & Group_id & "\"
	UploadPhotoUrl = UploadPhotoUrl & Group_id & "/"
	If Not FS.FolderExists(TDir) then
		FS.CreateFolder(TDir)
	End If
        TDir = TDir & User_id & "\"
	UploadPhotoUrl = UploadPhotoUrl & User_id & "/"
	If Not FS.FolderExists(TDir) then
		FS.CreateFolder(TDir)
	End If
	TDir = TDir & Name & "\"
	UploadPhotoUrl = UploadPhotoUrl & name & "/"
	If Not FS.FolderExists(TDir) then
		FS.CreateFolder(TDir)
        TempStr = "文件夹建立成功"
        User_Share=User_Share&name&"|"
        sql="update vip_User set User_Share='"&User_Share&"' where id="&User_id
        conn.execute (Sql)
        sql="insert into vip_FileDir (FileDir_Userid,FileDir_Name,FileDir_Pass)values("&User_id&",'"&name&"','"&File_Pass&"')"
        conn.execute (Sql)
        else
        TempStr = "文件夹已经存在"
        End If
        PhotoDir = TDir
        Set FS = Nothing
        response.write TempStr
End Function
CloseData
%>