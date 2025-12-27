<%
function inohtml(str)
if isnull(str) then 
inohtml = ""
exit function
end if
dim ilen,ihtml,i
ilen = len(str)
ihtml = ""
for i = 1 to ilen
select case mid(str,i,1)
case "<"
ihtml = ihtml + "&lt;"
case ">"
ihtml = ihtml + "&gt;"
case chr(13)
ihtml = ihtml + "<br>"
case chr(34)
ihtml = ihtml + "&quot;"
case "&"
ihtml = ihtml + "&amp;"
case chr(32)	           
ihtml = ihtml + "&nbsp;"
if i + 1 <= ilen and i - 1 >0 then
if mid(str,i + 1,1) = chr(32) or mid(str,i + 1,1) = chr(9) or mid(str,i - 1,1) = chr(32) or mid(str,i - 1,1) = chr(9)  then	                      
ihtml = ihtml + "&nbsp;"
else
ihtml = ihtml + " "
end if
else
ihtml = ihtml + "&nbsp;"	                    
end if
case chr(9)
ihtml = ihtml + "    "
case else
ihtml = ihtml + mid(str,i,1)
end select
next 
inohtml = ihtml
end function
%>