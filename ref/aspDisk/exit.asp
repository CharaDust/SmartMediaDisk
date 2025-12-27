<!--#include file="conn.asp"-->
<%
if session("User_id")<>"" then
opendata
sql="delete from Vip_Online where User_id="&session("User_id")
conn.execute(sql)
closedata
end if
session("User_id")=null
session("Admin")=null
session.abandon
response.redirect "login.asp"
%>