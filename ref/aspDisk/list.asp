<%@ LANGUAGE=VBScript CodePage=936%>
<%Option Explicit
Response.Buffer = True%>
<!--#include file="conn.asp"-->
<!--#include file="User_config.asp"-->
<%
OpenData
Dim Web_Vip_reg,Web_Vip_Name,Web_Vip_Caller
Web_Config
dim User_UpFileCount,User_UpFileMax,User_Vip,Username,pwd,Sex,Age,Address,Mail,Times,Loginip
dim User_Share,User_Friends,File_Dir_Max,User_Friendallow
User_UpFileConfig(User_id)
User_Online
dim Group_id,Group_Name,File_Count,File_Max,File_Max_Sum,File_Type,File_str,File_Path
dim File_GFL,File_FSO,File_GFL_SL
User_Group(User_Vip)

call right

sub right%>
<html><head>
<link rel="stylesheet" href="style.css">
<title></title>
</head>
<body leftmargin="5" topmargin="0" marginwidth="0" marginheight="0" bgcolor="#F6ECE2">
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor=#EAEAEA>
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
          <td>登陆时间：</td>
          <td><%=times%></td>
          <td>登陆ＩＰ：</td>
          <td><%=loginip%></td>
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
          <td  width=200 style="table-layout:fixed; word-break:break-all"><%=File_Type%></td>
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
                response.write "允许加入好友"
                else
                response.write "拒绝加入好友"
                end if%></td>
          <td>好友数量：</td>
          <td><font color=red><%=ubound(split(User_Friends,"|"))-1%>个</font></td>
        </tr>
      </table></td>
  </tr>
</table>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body></html>
<%end sub%>