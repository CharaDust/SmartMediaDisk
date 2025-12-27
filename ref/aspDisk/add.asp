<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = true
Opendata
%>
<!-- #include file=conn.asp -->
<!-- #include file=User_config.asp -->
<!-- #include file=upload1_fun.asp -->
<HTML><HEAD><TITLE></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="style.css">
<script LANGUAGE=javascript src="js/common.js"></script>
<script Language="JavaScript">
function Add(){
	if (!document.all.Photo.value){
		alert("文件路径不能为空！");
		document.all.Photo.focus();
		return false;
	}
uploadtext.innerHTML="<font color=#ff0000>正在上传请稍后......</font>";
}
</script>
</head>
<body leftmargin="0" topmargin="0" bgcolor="#F6ECE2">
<%
dim DEF_Now
DEF_Now=NOW()
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,pwd,Sex,Age,Address,Mail,Times,Loginip
dim User_Share,USer_Friends,User_Friendallow
User_UpFileConfig(User_id)
if isnull(User_Share) or User_Share="" then
response.write "请创建上传目录 [ <a href='javascript:history.back();'>重新选择</a> ]"
response.end
end if
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_Dir_Max,File_GFL_SL
User_Group(User_Vip)
if User_UpFileMax>=File_Max_Sum*1024 then
response.write "容量已满无法上传，请升级会员"
response.end
end if
if File_Max_Sum*1024-User_UpFileMax<=0 then
response.write "容量已满无法上传，请升级会员"
response.end
end if
if User_UpFileCount>=File_Count then
response.write "数量已满无法上传，请升级会员"
response.end
end if
Dim FileDir,FileDir_id
FileDir=replace(request.QueryString("FileDir"),"'","")
FileDir_id=replace(request.QueryString("FileDir_id"),"'","")
If Request.QueryString("submitflag") = "" Then
	photoUpformFunction
Else
        if FileDir_Name(FileDir) then
        if not IsNumeric(FileDir_id) then
        response.write "非法递交"
        response.end
        end if
        UploadFileNow
        else
response.write "请正确选择上传目录 [ <a href='javascript:history.back();'>重新选择</a> ]"
        response.end
        end if
End If

Function SaveSmallPic(LoadFile,SaveW,SaveH)
	Dim MaxWidth
	Dim MaxHeight
	MaxWidth = SaveW
	MaxHeight = SaveH
	Dim Img_Height,Img_Width
	On Error Resume Next
	Dim MyObj
	Set MyObj = Server.CreateObject("GflAx190.GflAx")
	MyObj.EnableLZW = True
	MyObj.LoadBitmap(LoadFile)
	if err Then
		SaveSmallPic = 0
		Set MyObj = Nothing
		err.clear
		Exit Function
	End If
        Img_Height = MyObj.Height
	Img_Width = MyObj.Width
    if Img_Height>MaxHeight or Img_Width>MaxWidth then
        SaveSmallPic = 2
        IF LCase(right(LoadFile,4))=".jpg" then
        MyObj.SaveFormat = 2
        Else
        MyObj.SaveFormat = 1
        End IF
	MyObj.Resize MaxHeight,MaxWidth
        If MyObj.BitmapType >= 4 Then
        if Int(File_GFL)=0 then
	MyObj.TextOut File_str,4,4,100*256*256+100*256+100
	MyObj.TextOut File_str,3,3,255*256*256+255*256+255
        end if
	End If
	MyObj.SaveBitmap(LoadFile)
	Set MyObj = Nothing
        exit function
     else
        SaveSmallPic = 1
        If MyObj.BitmapType >= 4 Then
        if Int(File_GFL)=0 then
	MyObj.TextOut File_str,4,4,100*256*256+100*256+100
	MyObj.TextOut File_str,3,3,255*256*256+255*256+255
        end if
	End If
	MyObj.SaveBitmap(LoadFile)
	Set MyObj = Nothing
     end if
End Function

Function GetTimeValue(DateString)

	Dim Temp,TempStr
	If isNull(DateString) or isTrueDate(DateString) = 0  Then Exit Function
	Temp = csTr(Year(DateString))
	If len(temp)<3 Then
		Temp = left(year(date),2) & temp
	End If
	TempStr = Temp
	
	Temp = csTr(month(DateString))
	If len(temp)<2 Then Temp = "0" & temp
	TempStr = TempStr & Temp

	Temp = csTr(day(DateString))
	If len(temp)<2 Then Temp = "0" & temp
	TempStr = TempStr & Temp

	Temp = csTr(Hour(DateString))
	If len(temp)<2 Then Temp = "0" & temp
	TempStr = TempStr & Temp

	Temp = csTr(Minute(DateString))
	If len(temp)<2 Then Temp = "0" & temp
	TempStr = TempStr & Temp

	Temp = csTr(Second(DateString))
	If len(temp)<2 Then Temp = "0" & temp
	TempStr = TempStr & Temp

	GetTimeValue = cCur(TempStr)

End Function

Function isTrueDate(TStr)

	Dim T
	T = TStr
	T = Replace(Replace(Replace(Replace(Replace(Replace(Replace(T,"年","-"),"月","-"),"日"," "),"上午"," "),"下午"," "),"  "," "),"  "," ")
	
	Dim N1,N2
	N1 = inStr(T,"-")
	If N1>0 Then N2 = inStrRev(T,"-")
	If N1 = N2 and N1 >0 Then
		isTrueDate = 0
		Exit Function
	End If

	N1 = inStr(T,":")
	If N1>0 Then N2 = inStrRev(T,"-")
	If N1 = N2 and N1 >0 Then
		isTrueDate = 0
		Exit Function
	End If

	If isDate(TStr) Then
		isTrueDate = 1
	Else
		isTrueDate = 0
	End If

End Function
Function photoUpformFunction
%>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor="#F6ECE2">
<table width="560" border="0" cellpadding="0" cellspacing="0"><tr><td>
<p align=left>　提示：
<br><font color=#B50000>1. 凡上传淫秽图片者，一律封ID帐号。 
<br>2. 禁止上传木马、病毒及危机服务器安全的文件，一经发现删除账号并报送公安机关。 
<br>3. 请不要上传大型软件，以免影响其他用户上传文件。 
<br>4. 凡上传法轮功及反动，暴力,色情等内容者，一经发现删除账号并报送公安机关。 
</font></p></td></tr>
<tr><td height=10 bgcolor=#ffffff></td></tr>
</table>
<table width="560" border="0" cellspacing="0" cellpadding="0" height="84">
<tr><td align=center height="41" width="536" colspan="2"><font color="#FF0000">请选择目录</font>
<%sql="select FileDir_Name,FileDir_id from Vip_FileDir where Filedir_Userid="&User_id
set rs=conn.execute(sql)
if Rs.eof then
response.write "<a href=setup.asp>请先创建目录</a>"
rs.close
set rs=nothing
else%>
<select name="select" onChange="javascript:location.href=(this.options[this.selectedIndex].value)" style="line-height:1.5;  letter-spacing: 0.5; FONT-SIZE: 10.5pt; color: rgb(0,107,159);">
<%
response.write"<option value='add.asp'>==选择目录==</option>"
do while not rs.eof
response.write"<option value='add.asp?FileDir="&rs("FileDir_Name")&"&FileDir_id="&rs("FileDir_id")&"'"
if FileDir=rs("FileDir_name") then
response.write " selected "
end if
response.write ">"&rs("FileDir_Name")&"</option>"
rs.movenext
loop
rs.close
set rs=nothing
end if
%>
</select>
</td></tr>
<form enctype="multipart/form-data" name="form1" method="Post" action=add.asp?submitflag=yes&FileDir=<%=FileDir%>&FileDir_id=<%=FileDir_id%> onSubmit="return Add();">
<tr><td align=center height="72"><table width=558 border=0 cellspacing=1 cellpadding=3 height="1">
<tr>
  <td align=right height="1" width="218">文件路径</td><td height="1" width="318"><input type="file" name="Photo" value=""></td>
</tr>
</table>
</td></tr>
<tr><td>
<table width=100% border=0 cellspacing=0 cellpadding=0 height="35">
<tr><td align=center height="35"><span id="uploadtext"></span></td></tr>
</table></td></tr>
<tr><td>
<table width=100% border=0 cellspacing=0 cellpadding=0 height="24">
<tr><td align=center><img name="LocalPic" src="" style="display:none" title="图片预览" width=100 height=100></td></tr>
</table></td></tr>
<tr><td align=center height=12 valing=botton valign="bottom">
<input type="button" value="图片预览" onClick="PreviewPic(document.all.Photo,document.all.LocalPic)">
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="submit" value="文件上传"></td></tr> 
</table>
<input type="hidden" name="PhotoID" value="">
</form>
</td></tr></table>
</body>
</html>
<%End Function


Function GetSaveFileName(name)
        Dim ExtendFileName,TempNum,Temp,PhotoDirectory
        PhotoDirectory=File_Path '获取上传目录
	name = Lcase(name)
	name = "1" & Mid(name,inStrRev(name,"."))
	ExtendFileName = Mid(name,inStrRev(name,"."))
	TempNum = Right(GetTimeValue(DEF_Now),6)
        GetSaveFileName = TempNum & ExtendFileName
	On Error Resume Next
	Set FS = CreateObject(File_FSO)
        If File_FSO = "" or err <> 0 Then
		Err.Clear
		GetSaveFileName = Left(GetTimeValue(DEF_Now),8) & GetSaveFileName
		PhotoDir = Server.MapPath(PhotoDirectory) & "\"
		Set Fs = Nothing
		Exit Function
	End If

	Dim TDir,FS
	TDir = Server.MapPath(PhotoDirectory) & "\"
	If Not FS.FolderExists(TDir) then
		GetSaveFileName = 0
		response.write "存放文件的目录不存在,请联系管理员！"
                response.end
	End If
	TDir = TDir & Group_id & "\"
	UploadPhotoUrl = UploadPhotoUrl & Group_id & "/"
	If Not FS.FolderExists(TDir) then
		response.write "存放文件的目录不存在,请先创建存放目录1！"
                response.end
	End If
	TDir = TDir & User_id & "\"
	UploadPhotoUrl = UploadPhotoUrl & User_id & "/"
	If Not FS.FolderExists(TDir) then
		response.write "存放文件的目录不存在,请先创建存放目录2！"
                response.end
	End If
        TDir = TDir & FileDir & "\"
	UploadPhotoUrl = UploadPhotoUrl & FileDir & "/"
	If Not FS.FolderExists(TDir) then
		response.write "存放文件的目录不存在,请先创建存放目录3！"
                response.end
	End If
        PhotoDir = TDir

	If FS.FileExists(TDir & GetSaveFileName) then
		For Temp = 0 To 99
			GetSaveFileName = TempNum & "_" & Temp & ExtendFileName
			If FS.FileExists(TDir & GetSaveFileName) then
			Else
				Set FS = Nothing
				Exit For
			End If
		Next
		Set FS = Nothing
	Else
		Set FS = Nothing
	End If

End Function

Dim FileUp,Pic_Name,PhotoDir,NewFileName,UploadPhotoUrl,FileDateSize,GFLStr,PhotoPath,PhotoPathSL
Function UploadFileNow
        Dim formName,file
	set FileUp = new UpFile_Class
	FileUp.GetData File_Max*1024,File_Max_Sum*1024-User_UpFileMax
	If FileUp.err > 0 then
	    Select Case FileUp.err
			Case 1
			Response.Write "请先选择你要上传的文件　[ <a href=#3234 onclick=history.go(-1)>重新上传</a> ]"
                        response.end
			Case 2
		Response.Write "剩余容量不足 [ <a href=# onclick=history.go(-1)>重新上传</a> ]"
                        response.end
		End Select
		Exit Function
	Else
          	For Each formName in FileUp.file ''列出所有上传了的文件
			Set file = FileUp.file(formName)  ''生成一个文件对象
			If file.filesize<1 then
				Response.write "请先选择你要上传的文件　[ <a href=#s334 onclick=history.go(-1)>重新上传</a> ]"
				Response.End
	 		End if
                        if File_Max*1024-file.filesize<0 then
                                Response.Write "超过单个文件容量"&File_Max&"K　[ <a href=#3333 onclick=history.go(-1)>重新上传</a> ]"
				Response.End
			End If
	 		NewFileName="." & LCase(file.FileExt)
			If inStr(File_Type,":" & NewFileName & ":") = 0 then
	 			Response.Write "文件格式不正确　[ <a href=#3333 onclick=history.go(-1)>重新上传</a> ]"
				Response.End
			End If
                        Pic_Name = GetSaveFileName(NewFileName)
			If file.FileSize>0 then
				file.SaveToFile PhotoDir & Pic_Name
                                FileDateSize=file.FileSize
                                GFLStr=SaveSmallPic(PhotoDir & Pic_Name,100,100)
                                PhotoPath= UploadPhotoUrl&Pic_Name
                                If GFLStr<2 then
Sql="insert into vip_Photo (User_id,FileDir_ID,PhotoDir,Times,FileDateSize)values("&session("User_id")&","&FileDir_id&",'"&PhotoPath&"','"&now()&"',"&FileDateSize&")"
conn.execute (Sql)
sql="update Vip_User set User_UpCount=User_UpCount+1,User_UpMax=User_UpMax+"&FileDateSize&" where id="&User_id
conn.execute(sql)
                                else
        if instr(LCase(right(Pic_Name,4)),".jpg") then
        PhotoPathSL= UploadPhotoUrl&replace(Pic_Name,right(Pic_Name,4),".gif")
        else
        PhotoPathSL= UploadPhotoUrl&replace(Pic_Name,right(Pic_Name,4),".jpg")
        end if
        Sql="insert into vip_Photo (User_id,FileDir_ID,PhotoDir,photoDir_SL,Times,FileDateSize)values("&session("User_id")&","&FileDir_id&",'"&PhotoPath&"','"&PhotoPathSL&"','"&now()&"',"&FileDateSize&")"
conn.execute (Sql)
sql="update Vip_User set User_UpCount=User_UpCount+1,User_UpMax=User_UpMax+"&FileDateSize&" where id="&User_id
conn.execute(sql)
                                end if
			End If
			Set File = Nothing
		Next
		Set FileUp = Nothing
	End If
response.redirect "FileDir.asp?FileDir_Namelist="&FileDir
End Function
CloseData
%>