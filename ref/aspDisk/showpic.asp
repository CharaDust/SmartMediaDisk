<HTML>
<HEAD>
<TITLE>查看大图</TITLE>
<meta http-equiv="Content-Type" content="text/html; charset=gb2312">
<style type="text/css">
body {margin:0px; background:white; font-size:9pt}
</style>
<script>
<!--
function ResetWinSize()
{
	//设置窗体大小等于图片大小
	if ( PhotoSrc.width > (screen.width - 50) || PhotoSrc.height > (screen.height - 70) )
	{
		//window.moveTo(0,0);
		window.moveTo((screen.width - PhotoSrc.width)/2,0);
		if (PhotoSrc.width > (screen.width - 15) )
			PhotoSrc.width = screen.width - 15;
		else if ( PhotoSrc.height > (screen.height - 65) )
			PhotoSrc.height = screen.height - 65;

		window.resizeTo(PhotoSrc.width+12,PhotoSrc.height+31);
		//window.resizeTo(screen.width,screen.height - 30);
	}
	else
	{
		window.moveTo((screen.width - PhotoSrc.width)/2,(screen.height - PhotoSrc.height)/2);
		window.resizeTo(PhotoSrc.width+12,PhotoSrc.height+31);
	}
}
function MM_findObj(n, d) { //v4.01
  var p,i,x;  if(!d) d=document; if((p=n.indexOf("?"))>0&&parent.frames.length) {
    d=parent.frames[n.substring(p+1)].document; n=n.substring(0,p);}
  if(!(x=d[n])&&d.all) x=d.all[n]; for (i=0;!x&&i<d.forms.length;i++) x=d.forms[i][n];
  for(i=0;!x&&d.layers&&i<d.layers.length;i++) x=MM_findObj(n,d.layers[i].document);
  if(!x && d.getElementById) x=d.getElementById(n); return x;
}

function MM_showHideLayers() { //v6.0
  var i,p,v,obj,args=MM_showHideLayers.arguments;
  for (i=0; i<(args.length-2); i+=3) if ((obj=MM_findObj(args[i]))!=null) { v=args[i+2];
    if (obj.style) { obj=obj.style; v=(v=='show')?'visible':(v=='hide')?'hidden':v; }
    obj.visibility=v; }
}
-->
</script>
</HEAD>
<BODY onload="MM_showHideLayers('Layer2','','hide');ResetWinSize()" scroll="auto">
<div id="Layer2" style="position:absolute; left:0px; top:0px; width:100%; height:100%; z-index:10; visibility: visible; FILTER: alpha(opacity=80);background-color: #FFFFFF; layer-background-color: #FFFFFF; border: 1px solid #000000"><br>
<p align="center"><img src="images/jh_logo_06.gif" width="92" height="79"><br><br><font color="#999999">照片读取中,请稍候<br>Now Loading</font></p>
</div>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td align=center><img src="<%=request.QueryString("src")%>" name="PhotoSrc"></td></tr>
</table>
</BODY>
</HTML>
