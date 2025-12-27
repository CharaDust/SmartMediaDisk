<!--#include file="conn.asp"-->
<%
id=replace(request.querystring("id"),"'","")
if not IsNumeric(id) then
response.write "非法参数"
response.end
end if
opendata

User_UpFileConfig(id)
User_Group(User_Vip)

dim User_UpFileCount,User_UpFileMax,User_Vip,Username,Sex,Age,Address,Mail
dim User_Share,USer_Friends,User_Friendallow
Function User_UpFileConfig(User_id)  '用户上传文件总数量、总容量
sql="select * from Vip_User where id="&User_id
set rs=conn.execute(sql)
if rs.eof then
response.write "错误，请联系管理员"
rs.close
set rs=nothing
response.end
end if
User_UpFileCount=rs("User_UpCount") '数量
User_UpFileMax=rs("User_UpMax")     '容量
User_Vip=rs("Vip")                  '用户群组
User_Share=rs("User_Share")         '用户共享目录
Username=rs("Username")
Sex=rs("sex")
Age=rs("age")
Address=rs("address")
Mail=rs("mail")
User_Friends=rs("USer_Friends")
User_Friendallow=rs("User_Friendallow")
rs.close
set rs=nothing
End Function

dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_Dir_Max,File_GFL_SL
Function User_Group(User_Vip)  '用户所属群组权限
sql="select * from Vip_Group where Group_id="&User_Vip
set rs=conn.execute(sql)
if rs.eof then
response.write "错误，请联系管理员"
rs.close
set rs=nothing
response.end
end if
Group_id=rs("Group_id")       '群组id
Group_Name=rs("Group_Name")   '群组名称
File_Count=rs("File_Count")   '群组允许上传数量
File_Max=rs("File_Max")  '群组允许上传单个文件大小
File_Max_Sum=rs("File_Max_Sum")'群组允许总体上传容量
File_Type=rs("File_Type")     '群组允许上传文件格式
File_Dir_Max=rs("File_Dir_Max")'群组允许创建的目录数量
File_str=rs("File_str")       '群组上传图片水印文字
File_Path=rs("File_Path")     '群组上传文件路径
File_GFL=rs("File_GFL")       '是否开启水印功能
File_GFL_SL=rs("File_GFL_SL") '是否开启缩略图功能
File_FSO=rs("File_FSO")       'Fso组件名称
rs.close
set rs=nothing
End Function


function Share(ID)
sql="select * from Vip_FileDir where FileDir_Userid="&ID&" and FileDir_Share=2"
set rs=conn.execute(sql)
if rs.eof and rs.bof then
Share="无共享目录"
else
do while not rs.eof
Share=Share&"<a href=Share_List.asp?ID="&rs("FileDir_USerID")&"&FileDir_Namelist="&rs("FileDir_Name")&">"&rs("FileDir_Name")&"</a>&nbsp;"
rs.movenext
loop
end if
rs.close
set rs=nothing
end function
%>
<html><head>
<link rel="stylesheet" href="style.css">
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" bgcolor=#F6ECE2>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td>　</td>
  </tr>
</table>
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor=#F6ECE2>
  <tr> 
    <td> <table width=100% cellpadding=3 cellspacing=1 bgcolor=#F6ECE2>
        <col class=fiel>
        <col  bgcolor=#F6F6F6>
        <col  class=fiel>
        <col  bgcolor=#F6F6F6>
        <tr> 
          <td>您的ＩＤ：</td>
          <td><b><%=UserName%></b></td>
          <td>性    别：</td>
          <td><b><%if sex=0 then response.write "男"%>
                 <%if sex=1 then response.write "女"%></b></td>
        </tr>
        <tr> 
          <td>ＯＩＣＱ：</td>
          <td class=num><%=address%></td>
          <td>邮   箱：</td>
          <td><%=mail%></td>
        </tr>
        
        <tr> 
          <td>会员状态：</td>
          <td><%=Group_Name%></td>
          <td>年   龄：</td>
          <td><%=Age%></td>
        </tr>
        <tr> 
          <td>允许上传：</td>
          <td><%=File_Count%>个</td>
          <td>已经上传</td>
          <td><%=User_UpFileCount%>个</td>
        </tr>
        <tr> 
          <td>剩余文件</td>
          <td><font color=red><%=File_Count-User_UpFileCount%>个</font></td>
          <td>文件类型</td>
          <td width=200 style="table-layout:fixed; word-break:break-all"><%=File_Type%></td>
        </tr>
        <tr> 
          <td>单个文件：</td>
          <td><%=File_Max%>K</td>
          <td>允许容量</td>
          <td><%=clng(File_Max_Sum)%>K</td>
        </tr>
        <tr> 
          <td>使用容量</td>
          <td><%=clng(User_UpFileMax/1024)%>K</td>
          <td>剩余容量：</td>
          <td><font color=red><%=clng(File_Max_Sum-clng(User_UpFileMax/1024))%>K</font></td>
        </tr>
        <tr> 
          <td>创建目录</td>
          <td>
               <%if not isnull(User_Share) then
                User_Share=split(User_Share,"|")
                response.write ubound(User_Share)-1&"个"
                else
                response.write "0个"
                end if%></td>
          <td>允许目录</td>
          <td><%response.write File_Dir_Max&"个"%></td>
        </tr>
        <tr> 
          <td>友好状态</td>
          <td><%if User_Friendallow>0 then 
response.write "允许加入好友&nbsp;&nbsp;<a href=mail/mail.asp?Pop_username="&username&">发送短信</a>"
                else
response.write "拒绝加入好友&nbsp;&nbsp;<a href=mail/mail.asp?Pop_username="&username&">发送短信</a>"
                end if%></td>
          <td>好友数量：</td>
          <td><font color=red><%=ubound(split(User_Friends,"|"))-1%>个</font></td>
        </tr>
        <tr> 
          <td>共享目录</td>
<td colspan=4 width=500 style="table-layout:fixed; word-break:break-all"><%=Share(ID)%></td>
        </tr>
      </table></td>
  </tr>
</table>
</body></html>
<%closeData%>