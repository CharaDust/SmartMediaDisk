<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True
%>
<!--#include file="conn.asp"-->
<!--#include file="admin_config.asp"-->
<%
Opendata
dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_config%>
<HTML><HEAD><TITLE><%=Web_Vip_Name%></TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<meta http-equiv="Expires" content="0">
<meta http-equiv="Pragma" content="no-cache">
<link rel="stylesheet" href="../style.css">
</head>
<BODY>
<div align=center>
<center>
<table width=543 border=0 cellspacing=1><tr><td height=1 bgcolor=#B4B6B5>
<table width=100% border=0 cellspacing=0 cellpadding=0>
<tr><td height=22 bgcolor=#EAEAEA width="536" colspan=5><img src=../images/arrow01.gif hspace=5> 首页 -&gt; 管理登陆</td></tr>
<tr><td height=1 bgcolor=#EAEAEA width="20%"><a href=admin.asp>管理首页</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=Group.asp>群组管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=User1.asp>用户管理</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=PassEdit.asp>修改密码</a></td>
<td height=1 bgcolor=#EAEAEA width="20%"><a href=exit.asp>退出登陆</a></td>
<tr><td height=1 bgcolor=#CECECE width="536" colspan=5></td></tr>
</table>
<img src=../images/step01.gif><br>
<table width=540><tr><td width=40></td><td>
<table width=100% border=0 cellspacing=1 cellpadding=3 class=bg2>
<tr><td></td></tr>
<%
OpenData
dim group_action,group_id
group_action=replace(Request.QueryString("action"),"'","")
group_id=replace(Request.QueryString("id"),"'","")
if group_action="" or group_id="" then
group
else
groupwork group_action,group_id
end if
function group
sql="select * from vip_group"
set rs=conn.execute(sql)
if rs.eof then
response.write "没有群组,<a href=GroupEdit.asp?action=add>点此添加</a>"
else
response.write "<tr><td>ID</td><td>群组名称</td>"
response.write "<td>查看</td><td>修改</td><td>删除</td><td>添加</td></tr>"
do while not rs.eof
%>
<tr>
<td width=10%><%=rs("Group_id")%>
<td width=18%><a href=?id=<%=rs("Group_id")%>&action=edit><%=rs("Group_Name")%></a></td>
<td width=18%><a href=?id=<%=rs("Group_id")%>&action=look>组内用户</a></td>
<td width=18%><a href=?id=<%=rs("Group_id")%>&action=edit>修改</a></td>
<td width=18%><a href=?id=<%=rs("Group_id")%>&action=del>删除</a></td>
<td width=18%><a href=GroupEdit.asp?action=add>添加</a></td>
</tr>
<%
rs.movenext
loop
end if
rs.close
set rs=nothing
end function

function groupwork(groupaction,groupid)
if isnull(groupaction) or isnull(groupid) then exit function
select case groupaction
case "look"
dim rs1,sql1
set rs1=server.createobject("adodb.recordset")
sql1="select * from vip_user where vip="&groupid
rs1.open sql1,conn,1,1
if rs1.eof then
response.write "无用户"
rs1.close
set rs1=nothing
else
dim pagecount,pagesize
pagesize=20        '每页记录数量
if not isempty(request("page")) then
pagecount=cint(request("page"))
else
pagecount=1
end if
rs1.pagesize=pagesize
if pagecount>rs1.pagecount or pagecount<=0 then
pagecount=1
end if
rs1.AbsolutePage=pagecount
response.write "<tr><td>用户名</td><td>登陆ＩＰ</td><td>群组状态</td></tr>"
dim i
for i=1 to rs1.pagesize
response.write"<tr><td><a href=User.asp?id="&rs1("id")&" target=_blank>"&rs1("Username")
response.write " </a></td>"
response.write"<td>"&rs1("loginip")&"</td><td>"&rs1("vip")
response.write"</td></tr>"
rs1.movenext
if rs1.eof then exit for
next
if pagecount=1 then
response.write "首页 上一页&nbsp;"
else
response.write "<a href=Group.asp?page=1&id="&groupid&"&action="&groupaction&">首页</a>&nbsp;"   
response.write "<a href=Group.asp?page="&cstr(pagecount-1)&"&id="&groupid&"&action="&groupaction&">上一页</a>&nbsp;"
end if
if rs1.PageCount-pagecount<1 then
response.write "下一页 尾页"
else
response.write "<a href=Group.asp?page="&cstr(pagecount+1)&"&id="&groupid&"&action="&groupaction&">下一页</a>&nbsp;"
response.write "<a href=Group.asp?page="&cstr(rs1.PageCount)&"&id="&groupid&"&action="&groupaction&">尾页</a>"
end if 
response.write "&nbsp;页次:"&pagecount&"/"&rs1.pagecount&"页</font>" 
response.write "&nbsp;&nbsp;每页"&pagesize&"个&nbsp;&nbsp;"
rs1.close
set rs1=nothing
end if

case "edit"
sql="select * from Vip_Group where Group_id="&Groupid
set rs=conn.execute(sql)
if rs.eof then
response.write "无此组信息"
rs.close
set rs=nothing
else
response.write "<tr><td></td><td>信息</td><td>说明</td></tr>"
response.write "<form name=form1 method='post' action='GroupEdit.asp?action=GroupEdit&id="&Groupid&"'>"
response.write "<tr><td>群组ID</td><td>"&rs("Group_ID")&"</td><td>群组ID</td></tr>"
response.write "<tr><td>群组名称</td><td><input type=text name='Group_Name'"
response.write " value="&rs("Group_Name")&"></td><td>群组名称</td></tr>"
response.write "<tr><td>文件数量</td><td><input type=text name='File_Count' value='"&rs("File_Count")&"'></td><td>允许上传的文件总数量</td></tr>"
response.write "<tr><td>文件大小</td><td><input type=text name='File_Max' value='"&rs("File_Max")&"'>K</td><td>允许上传的单个文件大小</td></tr>"
response.write "<tr><td>文件总量</td><td><input type=text name='File_Max_Sum' value='"&rs("File_Max_Sum")&"'>K</td><td>允许上传的文件容量</td></tr>"
response.write "<tr><td>文件类型</td><td><input type=text name='File_Type' value='"&rs("File_Type")&"'></td><td>允许上传的文件类型</td></tr>"
response.write "<tr><td>目录数量</td><td><input type=text name='File_Dir_Max' value='"&rs("File_Dir_Max")&"'></td><td>允许创建的目录数量</td></tr>"
response.write "<tr><td>水印文字</td><td><input type=text name='File_str' value='"&rs("File_str")&"'></td><td>图片文件的水印文字</td></tr>"
response.write "<tr><td>存储目录</td><td><input type=text name='File_Path' value='"&rs("File_Path")&"'></td><td>文件存储的目录</td></tr>"
response.write "<tr><td>使用缩图</td><td><input type=text name='File_GFL_SL' value='"&rs("File_GFL_SL")&"'></td><td>是否使用缩略图,0使用,1不使用</td></tr>"
response.write "<tr><td>使用水印</td><td><input type=text name='File_GFL' value='"&rs("File_GFL")&"'></td><td>是否给图片加水印,0使用,1不使用</td></tr>"
response.write "<tr><td>FSO组件</td><td><input type=text name='File_FSO' value='"&rs("File_FSO")&"'></td><td>FSO组件名称</td><tr>"
response.write "<tr><td colspan=3 align=center><input type=submit name=submit value='修改'>"
response.write "&nbsp;<input type=reset name=reset value='重添'></td></tr>"
response.write "</form>"
rs.close
set rs=nothing
end if

Case "del"
sql="select * from vip_Group where Group_id="&groupid
set rs=conn.execute(sql)
if rs.eof then
response.write "无此群组"
rs.close
set rs=nothing
response.end
else
Group_id=rs("Group_id")
dim File_Path,File_FSO
File_Path=rs("File_Path")
File_FSO=rs("File_FSO")
rs.close
set rs=nothing
end if
sql="delete from Vip_Group where Group_id="&Group_id
conn.execute(sql)

sql="delete from Vip_Photo where User_id in (select id from Vip_User where vip="&Group_id&")"
conn.execute(sql)

sql="delete from Vip_FileDir where FileDir_Userid in (select id from Vip_User where vip="&Group_id&")"
conn.execute(sql)

sql="delete from Vip_user where Vip="&Group_id
conn.execute(sql)


on error resume next
dim objFso,Path
Set objFso=Server.CreateObject(File_FSO)
If err <> 0 Then
Err.Clear
Response.Write "服务器不支持FSO"
else
Path=File_Path&Group_id
path=Server.MapPath(path)
path=replace(path,"admin\","")
    If objFso.FolderExists(path) then
      objFso.DeleteFolder (path)
      response.write "目录已删除．"
    Else
      response.write "目录未找到．"
    End If
end if
Set objFso=nothing
case else
response.redirect "group.asp"
end select
end function

CloseData
%>
</table>
</td></tr></table>
</td></tr></table>
</center></div>

</BODY></HTML>
