<!--#include file="conn.asp"-->
<!-- #include file=user_config.asp -->
<%response.write "<html><head>"
response.write "<link rel='stylesheet' href='style.css'></head>"
response.write "<body leftmargin=0 topmargin=0 marginwidth=0 marginheight=0 bgcolor=#F6ECE2>"
%>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr> 
    <td height=10><!--#include file="ad.asp"--></td>
  </tr>
</table>
<%
opendata
set rs=server.createobject("adodb.recordset")
sql="select Username,id from Vip_User where id in(select User_id from Vip_Online)"
rs.open sql,conn,1,1
if rs.eof then
response.write "<table><tr><td>"
response.write "目前"&rs.recordcount&"人在线</td></tr></table>"
%>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body></html>
<%
else
response.write "<table><tr>"
Dim i
do while not rs.eof
i=i+1
response.write "<td>"
response.write "<a href=Vip_Online_List.asp?id="&rs("id")&">"&rs("UserName")&"</a>&nbsp;</td>"
if i mod 16 =0 then
response.write "</tr><tr>"
end if
rs.movenext
loop
response.write "<tr><td colspan=10 align=center>目前"&rs.recordcount&"人在线</td></tr></table>"
%>
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6ECE2">
  <tr><td height=10 bgcolor=#ffffff></td></tr><tr> 
    <td><script language=javascript src=http://ulinkjs.tom.com/5x2_ent.js></script></td>
  </tr>
</table>
</body></html>
<%
end if
rs.close
set rs=nothing
closedata
%>